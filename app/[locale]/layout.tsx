import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { routing } from "@/i18n/routing";
import "../globals.css";

// This is the root layout. There is no app/layout.tsx: with a locale-routed
// site the topmost layout in the tree lives under [locale], because <html lang>
// has to know the locale. The bare "/" is redirected to "/ko" in next.config.ts.
type LocaleParams = { locale: string };

export function generateStaticParams(): LocaleParams[] {
  return routing.locales.map((locale) => ({ locale }));
}

// Only ko and en exist. Anything else is a 404 at the router level, which keeps
// the whole site statically prerendered.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
    namespace: "meta",
  });
  return {
    title: t("title"),
    description: t("description"),
    icons: { icon: "/favicon.svg" },
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<LocaleParams>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <a className="sc-skip" href="#main">
            {t("skipToContent")}
          </a>
          <Nav />
          <main id="main">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
