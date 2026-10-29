"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      {t("poweredByJava")} · <Link href="/about">{t("about")}</Link>
    </footer>
  );
}
