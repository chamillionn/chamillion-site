import { mergeAttributes } from "@tiptap/core";
import Heading, { type Level } from "@tiptap/extension-heading";
import { slugifyHeading } from "../toc-utils";

/**
 * Heading que emite un `id` derivado slugificando su texto.
 *
 * Permite que el TocSidebar (mismo componente que la newsletter real)
 * funcione con `document.getElementById` + anchor href `#slug`.
 *
 * Se recomputa en cada render (ProseMirror rerenderiza al cambiar el
 * contenido), así que el id se mantiene sincronizado con el texto.
 */
export const HeadingWithId = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const rawLevel = node.attrs.level as Level;
    const level: Level = this.options.levels.includes(rawLevel)
      ? rawLevel
      : this.options.levels[0];
    const id = slugifyHeading(node.textContent) || undefined;
    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { id }),
      0,
    ];
  },
});
