import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Monochrome on purpose: a 404 has no required action, so it spends no cobalt.
export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <section className="mx-auto w-full max-w-[var(--sc-measure)] px-6 py-24 md:px-10 md:py-32">
      <h1 className="text-4xl md:text-5xl">{t("title")}</h1>
      <p className="mt-6 text-[color:var(--sc-content-muted)]">{t("body")}</p>
      <p className="mt-10">
        <Link href="/">{t("back")}</Link>
      </p>
    </section>
  );
}
