"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import Logo from "./Logo";
import PhotoSlider from "./PhotoSlider";

/** First thing visitors read: what the site is and why it exists. Slides up to reveal the sports page. */
export default function Intro() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<"show" | "leave" | "gone">("show");

  useEffect(() => {
    try { if (sessionStorage.getItem("intro") === "1") setPhase("gone"); } catch {}
  }, []);

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
      <div className="intro-top"><Logo size={30} /> <span>Rural Talent Scout</span></div>
      <div className="intro-inner">
        <div className="intro-hero">
          <span className="eyebrow">{t("whatTitle")}</span>
          <h1>Rural Talent Scout</h1>
          <p>{t("whatBody")}</p>
        </div>

        <PhotoSlider />

        <div className="intro-why">
          <div className="glass">
            <h2>{t("whyTitle")}</h2>
            <p>{t("whyBody")}</p>
          </div>
        </div>

        <div className="intro-cta">
          <button className="btn" onClick={open}>{t("selectSport")}</button>
        </div>
      </div>
    </section>
  );
}
