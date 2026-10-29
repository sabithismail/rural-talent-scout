"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import Logo from "./Logo";

/**
 * Arrival animation: the logo draws itself, pops, then the screen slides up and the site opens.
 * Plays once per browser session. A tiny inline script in layout.tsx adds "splash-seen" to <html>
 * before first paint on later visits so it never flashes.
 */
export default function Splash() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<"play" | "leave" | "gone">("play");

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("splash") === "1"; } catch {}
    if (seen) { setPhase("gone"); return; }

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t1 = setTimeout(() => setPhase("leave"), reduced ? 700 : 2900);
    const t2 = setTimeout(() => finish(), reduced ? 900 : 3700);
    function finish() {
      setPhase("gone");
      try { sessionStorage.setItem("splash", "1"); } catch {}
      document.documentElement.classList.add("splash-seen");
    }
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function skip() {
    setPhase("gone");
    try { sessionStorage.setItem("splash", "1"); } catch {}
    document.documentElement.classList.add("splash-seen");
  }

  if (phase === "gone") return null;
  return (
    <div className={`splash ${phase === "leave" ? "leaving" : ""}`} onClick={skip} role="presentation">
      <div className="splash-mark">
        <Logo size={150} animate />
        <div className="splash-word">{t("appName")}</div>
        <div className="splash-sub">{t("splashSub")}</div>
      </div>
    </div>
  );
}
