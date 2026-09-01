import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalDoc, legalMetadata } from "@/components/LegalDoc";

type LocaleParams = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<LocaleParams>;
}): Promise<Metadata> {
  const { locale } = await params;
  return legalMetadata(locale, "privacy");
}

/** /privacy — content/legal/<locale>/privacy.md, rendered. See LegalDoc. */
export default async function PrivacyPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalDoc locale={locale} slug="privacy" />;
}
