"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/** On phones, offers to install the site as an app (Android) or explains how (iPhone). */
export default function InstallPrompt() {
  const { t } = useI18n();
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try { if (localStorage.getItem("install-dismissed") === "1") return; } catch {}
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
    const phone = matchMedia("(max-width: 760px)").matches;
    if (standalone || !phone) return;

    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) { setIos(true); setHidden(false); }
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); setHidden(false); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    setHidden(true);
    try { localStorage.setItem("install-dismissed", "1"); } catch {}
  }
  async function install() {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    setEvt(null);
    dismiss();
  }

  if (hidden) return null;
  return (
    <div className="install" role="dialog" aria-label={t("installApp")}>
      <div>
        <strong>{t("installApp")}</strong>
        <div className="muted" style={{ fontSize: "0.9rem" }}>{ios ? t("installIos") : t("installHint")}</div>
      </div>
      {evt && <button className="btn" onClick={install}>{t("install")}</button>}
      <button className="btn secondary" onClick={dismiss}>{t("notNow")}</button>
    </div>
  );
}
