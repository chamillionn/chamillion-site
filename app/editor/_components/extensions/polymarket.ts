import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    polymarket: {
      insertPolymarket: (args: { url: string }) => ReturnType;
    };
  }
}

/**
 * Convierte una URL de Polymarket en su equivalente embed oficial.
 *
 * Formato embed (confirmado en embed.polymarket.com):
 *   https://embed.polymarket.com/market?market=<slug>&theme=<dark|light>&volume=true
 *
 * Polymarket sólo soporta embeds de mercados individuales. Si se pasa una
 * URL de evento con un único mercado binario (ej. "will-jesus-christ-return-
 * before-2027"), el slug coincide y funciona. Para eventos con múltiples
 * mercados el user debe pegar el URL del mercado específico.
 *
 * Devuelve la URL original si no se puede parsear.
 */
export function polymarketEmbedUrl(url: string): string {
  try {
    const u = new URL(url);
    if (!/\bpolymarket\.com$/.test(u.hostname)) return url;
    const segments = u.pathname.split("/").filter(Boolean);
    const slug = segments[segments.length - 1];
    if (!slug) return url;
    const embed = new URL("https://embed.polymarket.com/market");
    embed.searchParams.set("market", slug);
    embed.searchParams.set("theme", "dark");
    return embed.toString();
  } catch {
    return url;
  }
}

export function isValidPolymarketUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return /\bpolymarket\.com$/.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Embed inline de un mercado/event de Polymarket. Atom block con una única
 * prop `url`. Se renderiza como iframe live del embed + link al market real
 * como fallback. Se serializa a markdown como fence `:::polymarket`.
 */
export const Polymarket = Node.create({
  name: "polymarket",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: "" },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="polymarket"]',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          return { url: el.getAttribute("data-url") ?? "" };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const url = (node.attrs.url as string) || "";
    const embed = polymarketEmbedUrl(url);
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "polymarket",
        "data-url": url,
        class: "editor-polymarket",
      }),
      ["div", { class: "editor-polymarket-label" }, "◈ POLYMARKET"],
      [
        "iframe",
        {
          src: embed,
          class: "editor-polymarket-iframe",
          title: `Polymarket embed: ${url}`,
        },
      ],
      [
        "a",
        {
          class: "editor-polymarket-link",
          href: url,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        url,
      ],
    ];
  },

  addCommands() {
    return {
      insertPolymarket:
        ({ url }) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { url },
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
          node: { attrs?: { url?: string | null } },
        ) {
          const url = (node?.attrs?.url ?? "").toString();
          state.write(":::polymarket");
          state.ensureNewLine();
          if (url) {
            state.write(url);
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
