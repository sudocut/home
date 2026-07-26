import type { ReactNode } from "react";

export type ActionButtonProps = {
  /**
   * Already resolved. For an internal route pass getPathname({href, locale})
   * from @/i18n/navigation so the locale prefix survives; for anything else
   * pass the full URL or a mailto:.
   */
  href: string;
  children: ReactNode;
};

/**
 * THE action. Cobalt lives here and nowhere else.
 *
 * soul.md: "One point of color marks the required action; everything else stays
 * monochrome." · "Every flow ends in one button." BRAND-KIT §4 makes it
 * concrete: cobalt appears AT MOST ONCE per view, and a second cobalt object is
 * a bug rather than a style choice.
 *
 * So: one ActionButton per page. If a page needs a second link, it is a plain
 * monochrome link — not another one of these. The header logo is single-ink for
 * the same reason (see Logo).
 *
 * Styling lives in .sc-action in app/globals.css: radius var(--sc-radius) = 0,
 * and the hard 6px/9px zero-blur offset shadow with the paired -2px lift, which
 * is the house signature (BRAND-KIT §7). Never a blurred shadow.
 */
export function ActionButton({ href, children }: ActionButtonProps) {
  return (
    <a className="sc-action" href={href}>
      {children}
    </a>
  );
}
