/**
 * Tiny class-name joiner. Avoids pulling in clsx/tailwind-merge for the few
 * conditional strings this app needs, and keeps a single place to extend if
 * conflict-aware merging becomes necessary.
 */
export type ClassValue = string | number | null | undefined | false | ClassValue[];

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];

  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }

  return out.join(' ');
}
