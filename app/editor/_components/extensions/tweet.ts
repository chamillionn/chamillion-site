import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TweetView } from "../tweet-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tweet: {
      insertTweet: (args: { url: string }) => ReturnType;
    };
  }
}

/**
 * Extrae el ID del tweet de una URL de twitter.com o x.com.
 * Formato canónico: `.../status/<id>` o `.../statuses/<id>`.
 */
export function tweetIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/\b(twitter|x)\.com$/.test(u.hostname)) return null;
    const m = u.pathname.match(/\/(?:status|statuses)\/(\d+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function isValidTweetUrl(url: string): boolean {
  return tweetIdFromUrl(url) !== null;
}

/**
 * Embed inline de un tweet, renderizado con `react-tweet` (Vercel) como
 * HTML estático auto-sized. Sin iframe, sin scroll, con tema dark nativo.
 * Serializa a fence `:::tweet`.
 */
export const Tweet = Node.create({
  name: "tweet",
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
        tag: 'div[data-type="tweet"]',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false;
          return { url: el.getAttribute("data-url") ?? "" };
        },
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "tweet",
        "data-url": (node.attrs.url as string) || "",
        class: "editor-tweet",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TweetView);
  },

  addCommands() {
    return {
      insertTweet:
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
          state.write(":::tweet");
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
