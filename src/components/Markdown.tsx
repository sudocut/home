import type { Components } from "react-markdown";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders a help document's markdown body. CommonMark plus GitHub tables,
 * strikethrough and task lists.
 *
 * Raw HTML in the source is escaped, not rendered: `rehype-raw` is deliberately
 * not installed. A help document is prose, and letting it carry its own markup
 * would let it carry its own colours, radii and shadows — the one thing the
 * constitution does not allow anywhere in this repo.
 *
 * Everything else is styled by descendant selectors under `.sc-doc` in
 * globals.css. Only two elements need a component override, and both are
 * structural rather than decorative.
 */
const COMPONENTS: Components = {
  // Tables reuse the pricing page's scroll frame rather than inventing a second
  // one. A wide table on a 390px screen is otherwise a horizontal page scroll.
  table({ children }) {
    return (
      <div className="sc-tablewrap">
        <table>{children}</table>
      </div>
    );
  },

  a({ href, children }) {
    const external = /^https?:\/\//i.test(href ?? "");
    return (
      <a href={href} {...(external ? { rel: "noreferrer", target: "_blank" } : {})}>
        {children}
      </a>
    );
  },
};

export function DocBody({ children }: { children: string }) {
  return (
    <Markdown components={COMPONENTS} remarkPlugins={[remarkGfm]}>
      {children}
    </Markdown>
  );
}
