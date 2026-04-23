import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    widget: {
      insertWidget: (args: { name: string; description?: string }) => ReturnType;
    };
  }
}

/**
 * Widget placeholder — un bloque que representa un iframe/embed que se
 * creará más adelante. El usuario lo inserta cuando está redactando para
 * marcar "aquí irá un widget X" y luego pedirle a Claude que lo cree.
 *
 * Se serializa a markdown como bloque fenced:
 *
 *   :::widget name="nombre-del-widget"
 *   Descripción opcional de qué hace el widget
 *   :::
 */
export const Widget = Node.create({
  name: "widget",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      name: { default: "" },
      description: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="widget"]',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          return {
            name: el.getAttribute("data-name") ?? "",
            description: el.getAttribute("data-description") ?? "",
          };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const name = (node.attrs.name as string) || "sin-nombre";
    const desc = (node.attrs.description as string) || "";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "widget",
        "data-name": name,
        "data-description": desc,
        class: "editor-widget",
      }),
      ["span", { class: "editor-widget-label" }, "◧ WIDGET"],
      ["span", { class: "editor-widget-name" }, name],
      desc
        ? ["span", { class: "editor-widget-desc" }, desc]
        : ["span", { class: "editor-widget-desc" }, "(sin descripción — click para editar)"],
    ];
  },

  addCommands() {
    return {
      insertWidget:
        ({ name, description }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { name, description: description ?? "" },
          }),
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(
          state: {
            write: (s: string) => void;
            ensureNewLine: () => void;
            closeBlock: (n: unknown) => void;
          },
          node: { attrs: { name: string; description: string } },
        ) {
          const name = node.attrs.name || "sin-nombre";
          const desc = (node.attrs.description || "").trim();
          state.write(`:::widget name="${name}"\n`);
          if (desc) {
            state.write(desc);
            state.ensureNewLine();
          }
          state.write(":::");
          state.closeBlock(node);
        },
        parse: {},
      },
    };
  },
});
