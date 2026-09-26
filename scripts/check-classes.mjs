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
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/** Classes that are never Tailwind utilities and must not be reported. */
const IGNORED = new Set(['material-symbols-outlined']);

/**
 * Raw palette families that must not appear in app code. `sky-tint`,
 * `lime-tint` and `status-neutral` are legitimate project tokens, so the
 * numeric-suffix and `status-` forms are excluded.
 */
const RAW_PALETTE =
  /(?:^|[\s"'`:])(?:[a-z-]+:)?(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|shadow|accent|caret|placeholder)-(slate|gray|zinc|stone|red|orange|amber|yellow|emerald|green|indigo|violet|purple|fuchsia|pink|rose|teal|cyan|neutral)-(?:[0-9]{2,3})/g;

const RAW_HEX = /#[0-9a-fA-F]{3,8}\b/g;

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
  for (const match of source.matchAll(RAW_HEX)) {
    note(bypasses, match[0], rel);
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

if (failed) {
  console.log('\n');
  process.exit(1);
}

console.log(
  `OK - ${sourceFiles.length} files scanned. No unknown utilities, no raw hex or palette colours.`
);
