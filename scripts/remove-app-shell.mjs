/**
 * One-off codemod: remove the copy-pasted app shell from every page.
 *
 * The authenticated chrome now lives in the (app) route-group layout, so each
 * page's duplicated outer wrapper and <AppSidebar /> must go.
 *
 * Design notes, learned the hard way:
 *  - The matching closing tag is found by div-depth tracking over the whole
 *    file, because JSX tags here span multiple lines and a per-line scan
 *    cannot distinguish a self-closing `<div ... />` from an open tag.
 *  - Self-closing tags are blanked first with a brace/quote-aware scanner,
 *    since attribute values contain JSX expressions with `<` and `>` in them.
 *  - All edits are applied as character-range slices, never via line indices
 *    derived by arithmetic, and every target is asserted before the file is
 *    written. A failed assertion aborts instead of corrupting the source.
 *
 *   node scripts/remove-app-shell.mjs [--dry]
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DRY = process.argv.includes('--dry');
const APP_DIR = 'app/(app)';

class CodemodError extends Error {}

function assert(condition, message) {
  if (!condition) throw new CodemodError(message);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry === 'page.tsx') out.push(full);
  }
  return out;
}

/** Character offsets at which each line starts. */
function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i += 1) if (text[i] === '\n') starts.push(i + 1);
  return starts;
}

function lineIndexAt(starts, offset) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (starts[mid] <= offset) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Character range covering the whole line containing `offset`. */
function lineRange(text, starts, offset) {
  const index = lineIndexAt(starts, offset);
  const start = starts[index];
  const nextStart = index + 1 < starts.length ? starts[index + 1] : text.length;
  return { index, start, end: nextStart, text: text.slice(start, nextStart) };
}

/**
 * Blank out every self-closing JSX tag, preserving all byte offsets.
 * A plain /<tag ...\/>/ regex is insufficient: attribute values may hold JSX
 * expressions containing `<` or `>` (e.g. style={{ width: `${a < b ? 0 : 1}` }}).
 */
function blankSelfClosing(text) {
  const out = text.split('');
  let i = 0;

  while (i < text.length) {
    if (text[i] !== '<' || !/[A-Za-z]/.test(text[i + 1] ?? '')) {
      i += 1;
      continue;
    }

    let j = i + 1;
    let quote = null;
    let braces = 0;
    let selfClosing = false;

    while (j < text.length) {
      const ch = text[j];
      if (quote) {
        if (ch === '\\') j += 1;
        else if (ch === quote) quote = null;
      } else if (ch === '"' || ch === "'" || ch === '`') {
        quote = ch;
      } else if (ch === '{') {
        braces += 1;
      } else if (ch === '}') {
        braces -= 1;
      } else if (ch === '>' && braces === 0) {
        let k = j - 1;
        while (k > i && /\s/.test(text[k])) k -= 1;
        selfClosing = text[k] === '/';
        break;
      }
      j += 1;
    }

    if (j >= text.length) break;
    if (selfClosing) for (let k = i; k <= j; k += 1) out[k] = ' ';
    i = j + 1;
  }

  return out.join('');
}

let changed = 0;
const skipped = [];

for (const file of walk(APP_DIR)) {
  const original = readFileSync(file, 'utf8');
  const text = blankSelfClosing(original);
  const starts = lineStarts(original);

  try {
    // --- locate the shell wrapper -------------------------------------
    const openRe = /<div\s+className="[^"]*h-screen[^"]*"\s*>/g;
    let shellOffset = -1;
    for (const match of text.matchAll(openRe)) {
      // Marker looked up in the original: <AppSidebar /> is self-closing and
      // was blanked out. Offsets are identical in both strings.
      if (original.slice(match.index, match.index + 400).includes('<AppSidebar')) {
        shellOffset = match.index;
        break;
      }
    }
    if (shellOffset === -1) {
      skipped.push(`${relative('.', file)} (no shell wrapper)`);
      continue;
    }

    // --- find its matching close by depth -----------------------------
    let depth = 0;
    let sawOpen = false;
    let closeOffset = -1;
    for (const match of text.matchAll(/<div\b|<\/div>/g)) {
      if (match.index < shellOffset) {
        depth += match[0] === '</div>' ? -1 : 1;
        continue;
      }
      if (!sawOpen) {
        sawOpen = true;
        depth += 1;
        continue;
      }
      depth += match[0] === '</div>' ? -1 : 1;
      if (depth === 0) {
        closeOffset = match.index;
        break;
      }
    }
    assert(closeOffset !== -1, 'could not match the wrapper closing tag');

    const openLine = lineRange(original, starts, shellOffset);
    const closeLine = lineRange(original, starts, closeOffset);
    const sidebarIdx = original.indexOf('<AppSidebar', shellOffset);
    assert(sidebarIdx !== -1 && sidebarIdx < closeOffset, 'sidebar not found inside the wrapper');
    const sidebarLine = lineRange(original, starts, sidebarIdx);

    // --- assert every target before touching anything -----------------
    assert(/^\s*<div\s+className="[^"]*h-screen/.test(openLine.text), 'open line is not the shell div');
    assert(/^\s*<\/div>\s*$/.test(closeLine.text), `close line is not a </div>: ${JSON.stringify(closeLine.text)}`);
    assert(/<AppSidebar\s*\/>/.test(sidebarLine.text), 'sidebar line does not contain <AppSidebar />');
    assert(openLine.index < sidebarLine.index, 'sidebar must follow the wrapper open');
    assert(sidebarLine.index < closeLine.index, 'sidebar must precede the wrapper close');

    const importIdx = original.indexOf("from '@/components/layout/AppSidebar'");
    const importLine = importIdx === -1 ? null : lineRange(original, starts, original.lastIndexOf('import', importIdx));
    if (importLine) {
      assert(/^import\s/.test(importLine.text.trim()), 'import line did not verify');
    }

    // --- build the replacement as ordered slices ----------------------
    const indent = openLine.text.match(/^\s*/)[0];
    const edits = [];

    if (importLine) edits.push({ start: importLine.start, end: importLine.end, replacement: '' });
    edits.push({ start: openLine.start, end: openLine.end, replacement: `${indent}<>\n` });
    edits.push({ start: sidebarLine.start, end: sidebarLine.end, replacement: '' });

    // Drop one blank line directly after the removed sidebar.
    const afterSidebar = lineRange(original, starts, sidebarLine.end);
    if (/^\s*$/.test(afterSidebar.text)) {
      edits.push({ start: afterSidebar.start, end: afterSidebar.end, replacement: '' });
    }

    edits.push({ start: closeLine.start, end: closeLine.end, replacement: `${indent}</>\n` });

    edits.sort((a, b) => a.start - b.start);
    for (let i = 1; i < edits.length; i += 1) {
      assert(edits[i].start >= edits[i - 1].end, 'overlapping edits');
    }

    let result = '';
    let cursor = 0;
    for (const edit of edits) {
      result += original.slice(cursor, edit.start) + edit.replacement;
      cursor = edit.end;
    }
    result += original.slice(cursor);

    // --- final safety net: div tags must stay balanced -----------------
    const beforeOpen = (text.match(/<div\b/g) || []).length;
    const beforeClose = (text.match(/<\/div>/g) || []).length;
    const afterText = blankSelfClosing(result);
    const afterOpen = (afterText.match(/<div\b/g) || []).length;
    const afterClose = (afterText.match(/<\/div>/g) || []).length;
    assert(
      afterOpen - afterClose === beforeOpen - beforeClose,
      `div balance changed: ${beforeOpen - beforeClose} -> ${afterOpen - afterClose}`
    );
    assert(result.includes('<>') && result.includes('</>'), 'fragment tags missing from result');
    assert(!result.includes('<AppSidebar'), 'sidebar survived');

    changed += 1;
    console.log(
      `updated  ${relative('.', file)}  (wrapper ${openLine.index + 1}..${closeLine.index + 1})`
    );
    if (!DRY) writeFileSync(file, result, 'utf8');
  } catch (error) {
    skipped.push(`${relative('.', file)} (${error.message})`);
  }
}

for (const s of skipped) console.log(`skipped  ${s}`);
console.log(`\n${changed} file(s) ${DRY ? 'would be ' : ''}updated.`);
