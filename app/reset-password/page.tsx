"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { passwordChecks } from "@/lib/password";

export default function ResetPassword() {
  const { t } = useI18n();
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ready" | "expired" | "done">("checking");
  const [pw, setPw] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  // The email link signs the person in with a short-lived recovery session. No session means the link is old or already used.
  useEffect(() => {
    let alive = true;
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (alive && event === "PASSWORD_RECOVERY" && session) setState("ready");
    });
    const timer = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (alive) setState((s) => (s === "checking" ? (data.session ? "ready" : "expired") : s));
    }, 800);
    return () => { alive = false; clearTimeout(timer); sub.subscription.unsubscribe(); };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!passwordChecks(pw).every((c) => c.ok)) return setMsg({ kind: "error", text: t("passwordWeak") });
    if (pw !== again) return setMsg({ kind: "error", text: t("passwordMismatch") });
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setBusy(false);
      return setMsg({ kind: "error", text: /same|different/i.test(error.message) ? t("samePassword") : t("err_generic") });
    }
    await supabase.auth.signOut({ scope: "others" }); // anyone holding an old session is signed out
    setBusy(false);
    setState("done");
    setMsg({ kind: "ok", text: t("passwordSaved") });
    setTimeout(() => router.push("/"), 1800);
  }

  if (state === "checking") return <p className="muted">…</p>;
  if (state === "expired") {
    return (
      <div className="card" style={{ maxWidth: 480, margin: "24px auto" }}>
        <h1>{t("resetTitle")}</h1>
        <div className="notice error" role="alert">{t("resetExpired")}</div>
        <p><Link className="btn" href="/login">{t("forgotPassword")}</Link></p>
      </div>
    );
  }
  return (
    <div className="card" style={{ maxWidth: 480, margin: "24px auto" }}>
      <h1>{t("resetTitle")}</h1>
      <form onSubmit={submit}>
        <label htmlFor="np">{t("newPassword")}</label>
        <input id="np" type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <ul className="rules">
          {passwordChecks(pw).map((c) => <li key={c.text} className={c.ok ? "ok" : ""}>{c.text}</li>)}
        </ul>
        <label htmlFor="cp">{t("confirmPassword")}</label>
        <input id="cp" type="password" required minLength={8} autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
        {msg && <div className={`notice ${msg.kind}`} role={msg.kind === "error" ? "alert" : "status"}>{msg.text}</div>}
        <p><button className="btn" type="submit" disabled={busy || state === "done"}>{t("changePassword")}</button></p>
      </form>
    </div>
  );
}
