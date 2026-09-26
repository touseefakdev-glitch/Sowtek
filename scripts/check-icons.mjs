/**
 * Guards a silent Material Symbols failure mode.
 *
 * The icon font is self-hosted and subsetted to the ligatures this app uses
 * (app/fonts/MaterialSymbolsOutlined-Subset.woff2). That keeps ~3.5 MB of
 * glyphs out of the bundle, but it introduces a failure mode with no error and
 * no visual cue: an icon name that is not in the subset is rendered by the
 * browser as that name, in the body font, as a stray word. "mail" instead of an
 * envelope. It is easy to miss in review and it is exactly what happened when
 * the font was not loaded at all.
 *
 * So every icon name in the source must be present in the subset manifest.
 * When a new icon is added this fails the build and prints the command needed
 * to regenerate the font.
 *
 * Usage: node scripts/check-icons.mjs
 *        node scripts/check-icons.mjs --emit   (print the list, for regeneration)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIRS = ['app', 'components', 'lib'];
const MANIFEST = 'app/fonts/material-symbols-subset.txt';
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/**
 * Positions an icon name can legitimately occupy.
 *
 * Matching every string literal in the codebase was tried first and rejected:
 * hundreds of ordinary words are also valid Material Symbols names ("class",
 * "html", "function", "try"), so a positional scan is the only way to tell an
 * icon from a Tailwind class or a CSS keyword.
 */
const PATTERNS = [
  // <span className="material-symbols-outlined">mail</span>
  { re: /material-symbols-outlined[^>]*>\s*([a-z][a-z0-9_]*)\s*</g, group: 1 },
  // <Button icon="add" />, <EmptyState icon="inbox" />
  { re: /\bicon\s*=\s*(?:"([a-z][a-z0-9_]*)"|'([a-z][a-z0-9_]*)')/g, groups: [1, 2] },
  // { icon: 'support_agent' } in presentation maps
  { re: /\bicon\s*:\s*(?:"([a-z][a-z0-9_]*)"|'([a-z][a-z0-9_]*)')/g, groups: [1, 2] },
  // <Icon name="home" size="sm" />
  { re: /<Icon\b[^>]{0,160}?\bname\s*=\s*(?:"([a-z][a-z0-9_]*)"|'([a-z][a-z0-9_]*)')/g, groups: [1, 2] },
];

/**
 * Icon maps: `CHANNEL_ICON[conversation.channel]` rendered inside a
 * `material-symbols-outlined` span. The values are only reachable through a
 * lookup, so the surrounding expression is scanned for identifiers and the
 * matching object literal is read.
 */
const SPAN_BODY = /material-symbols-outlined[^>]*>([\s\S]{0,120}?)</g;
const ICON_EXPR = /\bicon\s*=\s*\{([^}]{0,160})\}/g;
const IDENT_INDEX = /([A-Za-z_$][\w$]*)\s*\[/g;

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

/** Read the values of `const NAME = { key: 'value', ... }` from every source file. */
function collectIconMaps(sources) {
  const maps = new Map();
  for (const { source } of sources) {
    for (const match of source.matchAll(/([A-Za-z_$][\w$]*)\s*(?::[^=]*)?=\s*\{([^{}]*)\}/g)) {
      const name = match[1];
      const body = match[2];
      const values = [];
      for (const entry of body.matchAll(/:\s*(?:"([a-z][a-z0-9_]*)"|'([a-z][a-z0-9_]*)')/g)) {
        values.push(entry[1] ?? entry[2]);
      }
      // A map is only treated as icon-bearing if every value looks like a
      // ligature, which keeps status/copy maps out of the subset.
      if (values.length > 0 && !maps.has(name)) maps.set(name, values);
    }
  }
  return maps;
}

const files = CONTENT_DIRS.flatMap((dir) => walk(join(ROOT, dir)));
const sources = files.map((file) => ({
  file,
  rel: relative(ROOT, file).replace(/\\/g, '/'),
  source: readFileSync(file, 'utf8'),
}));

const iconMaps = collectIconMaps(sources);
const found = new Map(); // name -> Set(files)

const note = (name, rel) => {
  if (!found.has(name)) found.set(name, new Set());
  found.get(name).add(rel);
};

for (const { rel, source } of sources) {
  for (const { re, group, groups } of PATTERNS) {
    for (const match of source.matchAll(re)) {
      const name = group ? match[group] : (groups ?? []).map((g) => match[g]).find(Boolean);
      if (name) note(name, rel);
    }
  }

  // Icons reached through a lookup: pull the map's values in. A conditional
  // inside the span body is also a literal, e.g.
  // {showPassword ? 'visibility_off' : 'visibility'}.
  for (const re of [SPAN_BODY, ICON_EXPR]) {
    for (const match of source.matchAll(re)) {
      for (const indexed of match[1].matchAll(IDENT_INDEX)) {
        const values = iconMaps.get(indexed[1]);
        if (values) for (const value of values) note(value, rel);
      }
      // The body of a material-symbols span or an `icon={...}` prop is always
      // an icon expression, so any ligature-shaped literal in it is an icon.
      for (const literal of match[1].matchAll(/['"]([a-z][a-z0-9_]*)['"]/g)) {
        note(literal[1], rel);
      }
    }
  }
}

const required = [...found.keys()].sort();

if (process.argv.includes('--emit')) {
  console.log(required.join('\n'));
  process.exit(0);
}

function readManifest() {
  if (!existsSync(join(ROOT, MANIFEST))) {
    console.error(
      `\nMISSING MANIFEST - ${MANIFEST} not found.\n` +
        `The icon subset cannot be verified without it.\n`
    );
    process.exit(1);
  }
  const names = new Set();
  for (const line of readFileSync(join(ROOT, MANIFEST), 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) names.add(trimmed);
  }
  return names;
}

const manifest = readManifest();
const missing = required.filter((name) => !manifest.has(name));
const stale = [...manifest].filter((name) => !found.has(name)).sort();

if (missing.length === 0 && stale.length === 0) {
  console.log(
    `OK - ${required.length} icon names across ${files.length} files. All present in the subset font.`
  );
  process.exit(0);
}

let failed = false;

if (missing.length > 0) {
  failed = true;
  console.log(
    `\nICONS NOT IN SUBSET (${missing.length}) - renders as the literal word, not an icon:\n`
  );
  for (const name of missing) {
    console.log(`  ${name}`);
    for (const file of found.get(name)) console.log(`      ${file}`);
  }
  console.log(
    `\n  Regenerate: node scripts/check-icons.mjs --emit  then follow the command in ${MANIFEST}\n`
  );
}

if (stale.length > 0) {
  failed = true;
  console.log(
    `\nSTALE MANIFEST ENTRIES (${stale.length}) - no longer used; keeps the subset honest:\n`
  );
  for (const name of stale) console.log(`  ${name}`);
}

if (failed) {
  console.log('');
  process.exit(1);
}
