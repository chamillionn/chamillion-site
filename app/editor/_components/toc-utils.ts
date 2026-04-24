import type { Node as PMNode } from "@tiptap/pm/model";

export interface TocEntry {
  id: string;
  label: string;
  sub?: boolean;
  readTime?: number;
}

/**
 * Slugifica el texto de una heading para usar como anchor id.
 * Misma lógica para:
 *   - app/editor/_components/extensions/heading-with-id.ts (render)
 *   - extractTocEntries()                                  (TOC)
 * Así ambos coinciden siempre.
 */
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Recorre el doc y produce la lista de entries del TOC a partir de las
 * headings de nivel 2 y 3. Las H3 se marcan como `sub`.
 */
export function extractTocEntries(doc: PMNode): TocEntry[] {
  const entries: TocEntry[] = [];
  doc.descendants((node) => {
    if (node.type.name !== "heading") return;
    const level = node.attrs.level as number | undefined;
    if (level !== 2 && level !== 3) return;
    const label = node.textContent.trim();
    if (!label) return;
    const id = slugifyHeading(label);
    if (!id) return;
    entries.push({ id, label, sub: level === 3 });
  });
  return entries;
}
