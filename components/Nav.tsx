"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n, Lang } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";
import { flushQueue, listQueue } from "@/lib/upload";
import Logo from "./Logo";

export default function Nav() {
  const { t, lang, setLang } = useI18n();
  const { user, profile } = useAuth();
  const [waiting, setWaiting] = useState(0);

  useEffect(() => {
    if (!user) { setWaiting(0); return; }
    const run = async () => {
      try {
        if (navigator.onLine) await flushQueue(user.id);
        const q = await listQueue();
        setWaiting(q.filter((i) => i.userId === user.id).length);
      } catch {}
    };
    run();
    window.addEventListener("online", run);
    const timer = setInterval(run, 20000);
    return () => { window.removeEventListener("online", run); clearInterval(timer); };
  }, [user]);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" className="brand"><Logo size={30} /> <span>Rural Talent Scout</span></Link>
        <Link href="/" className="link">{t("home")}</Link>
        <Link href="/about" className="link">{t("about")}</Link>
        {user && profile?.role === "player" && <Link href="/me" className="link">{t("mySubmissions")}</Link>}
        {user && profile?.role === "scout" && <Link href="/scout" className="link">{t("scoutDashboard")}</Link>}
        {user && <Link href="/profile" className="link">{t("profile")}</Link>}
        {user ? (
          <button className="link" onClick={() => supabase.auth.signOut()}>{t("logout")}</button>
        ) : (
          <Link href="/login" className="link">{t("login")}</Link>
        )}
        <select aria-label="Language" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="kn">ಕನ್ನಡ</option>
        </select>
      </div>
      {waiting > 0 && (
        <div className="nav-inner muted" style={{ paddingTop: 0 }}>
          {waiting} {t("pendingUploads")}
        </div>
      )}
    </header>
  );
}
