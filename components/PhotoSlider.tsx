"use client";
import { useI18n } from "@/lib/i18n";
import { useCallback, useEffect, useRef, useState } from "react";

/** Add more pictures: drop the file in public/photos, add a line here (label is a key from lib/i18n-extra.ts, add cap7 there). */
export const SLIDES = [
  { src: "/photos/p1.jpg", label: "cap1" },
  { src: "/photos/p2.jpg", label: "cap2" },
  { src: "/photos/p3.jpg", label: "cap3" },
  { src: "/photos/p4.jpg", label: "cap4" },
  { src: "/photos/p5.jpg", label: "cap5" },
  { src: "/photos/p6.jpg", label: "cap6" },
];

/** Time between automatic slides, in milliseconds. 2 minutes = 120000. */
const AUTO_MS = 2 * 60 * 1000;

export default function PhotoSlider() {
  const { t } = useI18n();
  const [i, setI] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const n = SLIDES.length;

  const start = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setI((v) => (v + 1) % n), AUTO_MS);
  }, [n]);

  useEffect(() => {
    start();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [start]);

  function go(next: number) {
    setI(((next % n) + n) % n);
    start(); // restart the countdown after a manual move
  }

  return (
    <div
      className="slider"
      role="region"
      aria-roledescription="carousel"
      aria-label={t("photosRegion")}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "ArrowLeft") go(i - 1); if (e.key === "ArrowRight") go(i + 1); }}
    >
      <div className="slides" style={{ transform: `translateX(-${i * 100}%)` }}>
        {SLIDES.map((s, k) => (
          <figure className="slide" key={s.src} aria-hidden={k !== i}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt={t(s.label)} loading={k === 0 ? "eager" : "lazy"} draggable={false} />
            <figcaption>{t(s.label)}</figcaption>
          </figure>
        ))}
      </div>
      <button className="arrow prev" aria-label={t("prevPhoto")} onClick={() => go(i - 1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <button className="arrow next" aria-label={t("nextPhoto")} onClick={() => go(i + 1)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
      </button>
      <div className="dots">
        {SLIDES.map((s, k) => (
          <button key={s.src} className={k === i ? "on" : ""} aria-label={`${t("photoN")} ${k + 1}`} onClick={() => go(k)} />
        ))}
      </div>
    </div>
  );
}
