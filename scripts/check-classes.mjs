/**
 * Guards two silent Tailwind failure modes.
 *
 * 1. Unknown utilities. `bg-brand-subtle` produces no CSS rule at all, so a
 *    typo ships an unstyled element with no build error. Verified against the
 *    generated stylesheet.
 * 2. Token bypass. Raw palette names and arbitrary hex values work fine but
 *    defeat the semantic token layer, so they are reported here.
 *
 * Usage: node scripts/check-classes.mjs   (run after `next build`)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIRS = ['app', 'components', 'lib'];
const CSS_DIR = '.next/static/css';
/**
 * `.css` is included deliberately. The scrollbar colours in `app/globals.css`
 * were raw hex and survived several green builds because this gate only ever
 * looked at JS/TS, which is exactly the sort of hole a build gate exists to
 * close. `tailwind.config.js` is the one file allowed to define hex, since that
 * is where tokens originate.
 */
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);

/** Files where raw hex is the token source of truth and cannot be avoided. */
const HEX_SOURCE_FILES = new Set(['tailwind.config.js', 'scripts/check-classes.mjs']);

/** Classes that are never Tailwind utilities and must not be reported. */
const IGNORED = new Set(['material-symbols-outlined']);

/**
 * Raw palette families that must not appear in app code. `sky-tint`,
 * `lime-tint` and `status-neutral` are legitimate project tokens, so the
 * numeric-suffix and `status-` forms are excluded.
 */
const RAW_PALETTE =
  /(?:^|[\s"'`:])(?:[a-z-]+:)?(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|shadow|accent|caret|placeholder)-(slate|gray|zinc|stone|red|orange|amber|yellow|emerald|green|indigo|violet|purple|fuchsia|pink|rose|teal|cyan|neutral)-(?:[0-9]{2,3})/g;

/**
 * Hex that is legitimately not a Tailwind colour: the browser theme colour
 * meta tag, and fills inside inline SVG assets. These are not class names, so
 * routing them through the token layer is not possible or desirable.
 */
const HEX_ALLOWED = /themeColor|fill=|stroke=/;
const RAW_HEX_GLOBAL = /#[0-9a-fA-F]{3,8}\b/g;

/** Project tokens that look like raw palette entries but are legitimate. */
const ALLOWED = [
  'sky-tint',
  'sky-tint-border',
  'lime-tint',
  'lime-tint-border',
  'status-neutral',
  'status-neutral-bg',
];

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (EXTENSIONS.has(extname(entry))) out.push(full);
  }
  return out;
}

/** Characters Tailwind backslash-escapes inside a generated class selector. */
const CSS_SPECIAL = /[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g;

/** Escape a class name the way Tailwind writes it into the stylesheet. */
function tailwindEscape(className) {
  return className.replace(CSS_SPECIAL, '\\$&');
}

function readGeneratedCss() {
  let files;
  try {
    files = readdirSync(join(ROOT, CSS_DIR));
  } catch {
    throw new Error(`No generated CSS in ${CSS_DIR}. Run \`next build\` first.`);
  }
  return files
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join(ROOT, CSS_DIR, file), 'utf8'))
    .join('\n');
}

/**
 * Collect literal class names from `className="..."`, `className={`...`}` and
 * `cn('a', cond && 'b')` calls. Brace-balanced so nested JSX and ternaries do
 * not leak their internal tokens.
 */
function extractCandidates(source) {
  const candidates = new Set();
  const fragments = [];

  // Static and template className attributes.
  for (const match of source.matchAll(/className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)) {
    fragments.push(match[1] ?? match[2] ?? match[3] ?? '');
  }

  // className={...} with a JS expression: pull quoted strings out of it.
  for (const match of source.matchAll(/className\s*=\s*\{/g)) {
    let depth = 0;
    let index = match.index + match[0].length - 1;
    for (; index < source.length; index += 1) {
      const char = source[index];
      if (char === '{') depth += 1;
      else if (char === '}') {
        depth -= 1;
        if (depth === 0) break;
      } else if (char === "'" || char === '"' || char === '`') {
        const quote = char;
        let end = index + 1;
        while (end < source.length && source[end] !== quote) end += 1;
        fragments.push(source.slice(index + 1, end));
        index = end;
      }
    }
  }

  // cn(...) helper calls.
  for (const match of source.matchAll(/\bcn\(/g)) {
    let depth = 0;
    let index = match.index + match[0].length - 1;
    for (; index < source.length; index += 1) {
      const char = source[index];
      if (char === '(') depth += 1;
      else if (char === ')') {
        depth -= 1;
        if (depth === 0) break;
      } else if (char === "'" || char === '"' || char === '`') {
        const quote = char;
        let end = index + 1;
        while (end < source.length && source[end] !== quote) end += 1;
        fragments.push(source.slice(index + 1, end));
        index = end;
      }
    }
  }

  for (const fragment of fragments) {
    for (const token of stripInterpolations(fragment).split(/[\s"'`,]+/)) {
      if (token && isCheckableCandidate(token)) candidates.add(token);
    }
  }
  return candidates;
}

/** Remove `${...}` interpolations, including nested braces. */
function stripInterpolations(fragment) {
  let out = '';
  for (let i = 0; i < fragment.length; i += 1) {
    if (fragment[i] === '$' && fragment[i + 1] === '{') {
      let depth = 0;
      i += 1;
      for (; i < fragment.length; i += 1) {
        if (fragment[i] === '{') depth += 1;
        else if (fragment[i] === '}') {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      continue;
    }
    out += fragment[i];
  }
  return out;
}

/**
 * A literal class worth verifying. Every multi-part Tailwind utility contains a
 * dash, slash or bracket, while the bare ones (`flex`, `truncate`, ...) are
 * short and low-risk, so they are skipped to keep the report free of noise.
 */
function isCheckableCandidate(token) {
  return /[-[/]/.test(token) && /^[a-z0-9][a-z0-9:/.[\]%()#,!_-]*$/i.test(token);
}

const sourceFiles = CONTENT_DIRS.flatMap((dir) => walk(join(ROOT, dir)));
const css = readGeneratedCss();
const isGenerated = (cls) => css.includes(`.${tailwindEscape(cls)}`);

const missing = new Map();
const bypasses = new Map();
const corrupt = new Map();

/**
 * Mojibake: UTF-8 bytes that were decoded as cp1252. The Arabic login copy and
 * a few separators had this, so it is checked rather than eyeballed.
 */
const MOJIBAKE = /[\u00C2-\u00C3][\u0080-\u00BF]|[\u00E2][\u0080-\u00BF]|[\u00F0][\u0090-\u00BF]/;

/**
 * Legitimate non-ASCII: Arabic script, bidi controls, typographic punctuation
 * and emoji. Anything else outside ASCII is a sign of an encoding accident.
 */
const NON_ASCII_ALLOWED = new RegExp(
  '[\\u0600-\\u06FF\\u0750-\\u077F\\u08A0-\\u08FF\\uFB50-\\uFDFF\\uFE70-\\uFEFF' +
    '\\u200B-\\u200F\\u202A-\\u202E\\u2066-\\u2069' +
    '\\u00A0\\u00B0\\u00B7\\u2013\\u2014\\u2018\\u2019\\u201C\\u201D\\u2022\\u2026\\u00D7' +
    '\\u2190-\\u21FF\\u2300-\\u23FF\\u25A0-\u27BF\\u2B00-\\u2BFF' +
    '\\u{1F300}-\\u{1FAFF}\\u{FE0F}\\u{1F1E6}-\\u{1F1FF}]',
  'gu'
);

const note = (map, key, file) => {
  if (!map.has(key)) map.set(key, new Set());
  map.get(key).add(file);
};

for (const file of sourceFiles) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const source = readFileSync(file, 'utf8');

  for (const candidate of extractCandidates(source)) {
    if (IGNORED.has(candidate)) continue;
    if (ALLOWED.includes(candidate)) continue;
    if (isGenerated(candidate)) continue;
    note(missing, candidate, rel);
  }

  for (const match of source.matchAll(RAW_PALETTE)) {
    const token = match[1] ?? match[0].trim();
    if (ALLOWED.some((allowed) => token.includes(allowed))) continue;
    note(bypasses, token.replace(/^[\s"'`]+/, ''), rel);
  }
  // Report hex values, ignoring lines where a raw colour is legitimate.
  const hexAllowedForFile = !HEX_SOURCE_FILES.has(rel.split(/[\\/]/).pop());
  if (hexAllowedForFile) {
    const hexLines = source.split(/\r?\n/);
    hexLines.forEach((lineText, index) => {
      if (HEX_ALLOWED.test(lineText)) return;
      for (const match of lineText.matchAll(RAW_HEX_GLOBAL)) {
        note(bypasses, match[0], `${rel}:${index + 1}`);
      }
    });
  }

  if (MOJIBAKE.test(source)) {
    const line = source.split(/\r?\n/).findIndex((value) => MOJIBAKE.test(value)) + 1;
    note(corrupt, `line ${line}`, rel);
  } else if (/[^\x00-\x7F]/.test(source)) {
    // Non-ASCII is fine, but only in scripts and typographic punctuation.
    const stripped = source.replace(NON_ASCII_ALLOWED, '');
    if (/[^\x00-\x7F]/.test(stripped)) {
      note(corrupt, 'unexpected non-ASCII characters', rel);
    }
  }
}

let failed = false;

if (missing.size > 0) {
  failed = true;
  console.log(`\nUNKNOWN UTILITIES (${missing.size}) - no CSS rule generated, element renders unstyled:\n`);
  for (const [cls, files] of [...missing].sort()) {
    console.log(`  ${cls}`);
    for (const file of files) console.log(`      ${file}`);
  }
}

if (bypasses.size > 0) {
  failed = true;
  console.log(`\nTOKEN BYPASSES (${bypasses.size}) - raw hex or palette colour instead of a semantic token:\n`);
  for (const [cls, files] of [...bypasses].sort()) {
    console.log(`  ${cls}`);
    for (const file of files) console.log(`      ${file}`);
  }
}

if (corrupt.size > 0) {
  failed = true;
  console.log(`\nTEXT ENCODING (${corrupt.size}) - mojibake or unexpected non-ASCII:\n`);
  for (const [what, files] of [...corrupt].sort()) {
    console.log(`  ${what}`);
    for (const file of files) console.log(`      ${file}`);
  }
}

if (failed) {
  console.log('\n');
  process.exit(1);
}

console.log(
  `OK - ${sourceFiles.length} files scanned. No unknown utilities, no raw hex or palette colours, no mojibake.`
);
