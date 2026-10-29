"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n, Lang } from "@/lib/i18n";
import Logo from "./Logo";
import PhotoSlider from "./PhotoSlider";

/** First thing visitors read: what the site is and why it exists. Slides up to reveal the sports page. */
export default function Intro() {
  const { t, lang, setLang } = useI18n();
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");

  useEffect(() => {
    try { if (sessionStorage.getItem("intro") === "1") setPhase("gone"); } catch {}
  }, []);

  /** Leaving the intro for another page (About, Login): mark it as seen so it does not cover that page. */
  function skip() {
    setPhase("gone");
    try { sessionStorage.setItem("intro", "1"); } catch {}
    document.documentElement.classList.add("intro-seen");
  }

  function open() {
    setPhase("leave");
    setTimeout(() => {
      setPhase("gone");
      try { sessionStorage.setItem("intro", "1"); } catch {}
      document.documentElement.classList.add("intro-seen");
      window.scrollTo({ top: 0 });
    }, 750);
  }

  if (phase === "gone") return null;
  return (
    <section className={`intro ${phase === "leave" ? "leaving" : ""}`} aria-label={t("whatTitle")}>
      <div className="topbar intro-top">
        <span className="pill-logo"><Logo size={30} /></span>
        <span className="pill-name">{t("appName")}</span>
        <nav className="pill-links" aria-label="Main">
          <Link href="/about#docs" onClick={skip}>{t("docs")}</Link>
          <Link href="/about#architecture" onClick={skip}>{t("architecture")}</Link>
          <Link href="/about" onClick={skip}>{t("about")}</Link>
          <Link href="/login?mode=signup" onClick={skip}>{t("signup")}</Link>
          <Link href="/login" onClick={skip} className="cta">{t("login")}</Link>
          <select aria-label={t("languageLabel")} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="kn">ಕನ್ನಡ</option>
          </select>
        </nav>
      </div>
      <div className="intro-inner">
        <div className="intro-hero">
          <p className="kicker"><span className="rule" />{t("whatTitle")}</p>
          <h1>{t("appName")}</h1>
          <p className="lede">{t("whatBody")}</p>
        </div>

        <PhotoSlider />

        <div className="intro-why">
          <div className="glass">
            <p className="kicker"><span className="rule" />{t("whyTitle")}</p>
            <p className="lede">{t("whyBody")}</p>
          </div>
        </div>

        <div className="intro-cta">
          <button className="btn ghost" onClick={open}>{t("selectSport")} <span aria-hidden>&rarr;</span></button>
        </div>
      </div>
    </section>
  );
}
