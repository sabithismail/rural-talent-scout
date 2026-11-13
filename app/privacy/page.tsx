"use client";
import { useI18n } from "@/lib/i18n";
import { PRIVACY } from "@/lib/privacy-text";

export default function PrivacyPage() {
  const { t, lang } = useI18n();
  const c = PRIVACY[lang];
  return (
    <article className="card" style={{ maxWidth: 680, margin: "16px auto" }}>
      <h1>{t("privacy")}</h1>
      <p>{c.intro}</p>
      {c.sections.map(([h, ps]) => (
        <section key={h}>
          <h2>{h}</h2>
          {ps.map((p) => <p key={p}>{p}</p>)}
        </section>
      ))}
      <p className="muted">{c.contact}</p>
    </article>
  );
}
