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
  return legalMetadata(locale, "terms");
}

/** /terms — content/legal/<locale>/terms.md, rendered. See LegalDoc. */
export default async function TermsPage({ params }: { params: Promise<LocaleParams> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalDoc locale={locale} slug="terms" />;
}
