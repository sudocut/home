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
 * Styling lives in .sc-btn in app/globals.css: radius var(--sc-radius) = 0, and
 * the hard 6px/9px zero-blur offset shadow with the paired lift, which is the
 * house signature (BRAND-KIT §7). Never a blurred shadow.
 *
 * UNUSED as of the r4 port (2026-07-27). The winning variant's only action is the
 * waitlist link inside WaitlistCta, so nothing renders this today. It was
 * pointing at `.sc-action`, a class the port removed, which would have rendered
 * an unstyled link the first time anyone reached for it — repointed at .sc-btn
 * rather than left as a trap. Delete it, Prose, and Section together if the next
 * round confirms they are not coming back.
 */
export function ActionButton({ href, children }: ActionButtonProps) {
  return (
    <a className="sc-btn" href={href}>
      {children}
    </a>
  );
}
