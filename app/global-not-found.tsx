import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import "./globals.css";

// The root layout of this site is app/[locale]/layout.tsx, so an unmatched path
// never enters it and there is no layout for an ordinary not-found.tsx to render
// inside — Next falls back to its own unstyled error shell. This file is the
// whole document for any 404 and declares its own <html>. It needs
// experimental.globalNotFound in next.config.ts.
//
// It cannot know the requested locale (no [locale] segment matched), so it
// prints both, Korean first. That is the house order.
// Monochrome — a 404 has no required action, so it spends no cobalt.

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: routing.defaultLocale, namespace: "notFound" });
  return { title: t("title") };
}

export default async function GlobalNotFound() {
  const ko = await getTranslations({ locale: "ko", namespace: "notFound" });
  const en = await getTranslations({ locale: "en", namespace: "notFound" });

  return (
    <html lang="ko">
      <body>
        <section className="mx-auto w-full max-w-[var(--sc-measure)] px-6 py-24 md:px-10 md:py-32">
          <h1 className="text-4xl md:text-5xl">{ko("title")}</h1>
          <p className="mt-5 text-[color:var(--sc-content-muted)]">{ko("body")}</p>

          <p className="mt-12 text-2xl" lang="en">
            {en("title")}
          </p>
          <p className="mt-5 text-[color:var(--sc-content-muted)]" lang="en">
            {en("body")}
          </p>

          <p className="mt-14">
            <a href={`/${routing.defaultLocale}`}>
              {ko("back")} <span lang="en">/ {en("back")}</span>
            </a>
          </p>
        </section>
      </body>
    </html>
  );
}
