import type { ReactNode } from "react";

export type SectionProps = {
  /** Micro label above the section. BRAND-KIT §5 — mono, uppercase, tracked. */
  label?: string;
  title?: string;
  id?: string;
  /** Hairline above the section. BRAND-KIT §6 — 1px var(--sc-rule). */
  rule?: boolean;
  children?: ReactNode;
};

/**
 * A band of content. Deliberately plain: this is structure, not layout. The
 * real spacing, rhythm and composition arrive with the selected design round
 * under design/ — see the header of app/globals.css.
 */
export function Section({ label, title, id, rule = true, children }: SectionProps) {
  return (
    <section id={id} className="w-full">
      {rule ? <hr /> : null}
      <div className="mx-auto w-full max-w-[var(--sc-measure)] px-6 py-16 md:px-10 md:py-24">
        {label ? <span className="sc-label mb-4">{label}</span> : null}
        {title ? <h2 className="mb-8 text-3xl md:text-4xl">{title}</h2> : null}
        {children}
      </div>
    </section>
  );
}
