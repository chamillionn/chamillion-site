import { Extension, InputRule } from "@tiptap/core";

/**
 * Slash-expansions. Cuando escribes `/h2 ` al principio de un párrafo,
 * se convierte al bloque correspondiente. Sin dependencias (no usa
 * @tiptap/suggestion para evitar traerse tippy.js).
 *
 * Cubiertos por expansión: h2, h3, quote, callout, divider.
 * Para insertar imagen/widget (necesitan datos), usar atajos/toolbar.
 */
export const SlashCommands = Extension.create({
  name: "slashCommands",

  addInputRules() {
    return [
      new InputRule({
        find: /^\/h2\s$/,
        handler: ({ chain, range }) => {
          chain()
            .deleteRange(range)
            .setNode("heading", { level: 2 })
            .run();
        },
      }),
      new InputRule({
        find: /^\/h3\s$/,
        handler: ({ chain, range }) => {
          chain()
            .deleteRange(range)
            .setNode("heading", { level: 3 })
            .run();
        },
      }),
      new InputRule({
        find: /^\/quote\s$/,
        handler: ({ chain, range }) => {
          chain().deleteRange(range).setBlockquote().run();
        },
      }),
      new InputRule({
        find: /^\/callout\s$/,
        handler: ({ chain, range }) => {
          chain().deleteRange(range).toggleCallout().run();
        },
      }),
      new InputRule({
        find: /^\/(divider|hr)\s$/,
        handler: ({ chain, range }) => {
          chain().deleteRange(range).setHorizontalRule().run();
        },
      }),
    ];
  },
});
