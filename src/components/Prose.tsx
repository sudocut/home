import type { ReactNode } from "react";

export type ProseProps = {
  children: ReactNode;
  className?: string;
};

/**
 * A reading column, capped at a short measure. BRAND-KIT §12: "Say it, then
 * stop." The measure is part of that — a paragraph that will not fit is a
 * paragraph that needs cutting.
 */
export function Prose({ children, className }: ProseProps) {
  return <div className={className ? `sc-prose ${className}` : "sc-prose"}>{children}</div>;
}
