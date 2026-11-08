"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import { passwordChecks } from "@/lib/password";
import { useLock, waitText } from "@/lib/lockout";

export default function ProfilePage() {
  const { t, setLang } = useI18n();
  const { user, profile, loading, refresh } = useAuth();
  const [f, setF] = useState({
    full_name: "", age: "", gender: "", village: "", district: "", state: "", school_or_club: "", parent_consent: false,
  });
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [cur, setCur] = useState("");
  const [nw, setNw] = useState("");
  const [cf, setCf] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const lock = useLock(`reauth:${user?.id ?? ""}`);

  useEffect(() => {
    if (!profile) return;
    setF({
      full_name: profile.full_name ?? "",
      age: profile.age?.toString() ?? "",
      gender: profile.gender ?? "",
      village: profile.village ?? "",
      district: profile.district ?? "",
      state: profile.state ?? "",
      school_or_club: profile.school_or_club ?? "",
      parent_consent: profile.parent_consent,
    });
  }, [profile]);

  if (!loading && !user) return <p>{t("needLogin")} <Link href="/login">{t("login")}</Link></p>;
  if (!profile) return <p className="muted">…</p>;

  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: f.full_name,
        age: f.age ? Number(f.age) : null,
        gender: f.gender || null,
        village: f.village || null,
        district: f.district || null,
        state: f.state || null,
        school_or_club: f.school_or_club || null,
        parent_consent: f.parent_consent,
      })
      .eq("id", user!.id);
    if (error) setMsg({ kind: "error", text: error.message });
    else { setMsg({ kind: "ok", text: t("saved") }); refresh(); }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (lock.secs > 0) return setPwMsg({ kind: "error", text: t("tooManyTries").replace("{time}", waitText(lock.secs)) });
    if (!passwordChecks(nw).every((c) => c.ok)) return setPwMsg({ kind: "error", text: t("passwordWeak") });
    if (nw !== cf) return setPwMsg({ kind: "error", text: t("passwordMismatch") });
    if (nw === cur) return setPwMsg({ kind: "error", text: t("samePassword") });
    setPwBusy(true);
    // prove it is really the account owner: the current password must be right before anything changes
    const { error: authErr } = await supabase.auth.signInWithPassword({ email: user!.email ?? "", password: cur });
    if (authErr) {
      setPwBusy(false);
      lock.fail();
      setCur("");
      return setPwMsg({ kind: "error", text: /rate|too many/i.test(authErr.message) ? t("tooManyEmails") : t("currentWrong") });
    }
    lock.clear();
    const { error } = await supabase.auth.updateUser({ password: nw });
    if (error) {
      setPwBusy(false);
      return setPwMsg({ kind: "error", text: /same|different/i.test(error.message) ? t("samePassword") : t("err_generic") });
    }
    await supabase.auth.signOut({ scope: "others" });
    setPwBusy(false);
    setCur(""); setNw(""); setCf("");
    setPwMsg({ kind: "ok", text: t("passwordSaved") });
  }

  const isPlayer = profile.role === "player";

  return (
    <>
    <div className="card" style={{ maxWidth: 560, margin: "16px auto" }}>
      <h1>{t("profile")}</h1>
      <form onSubmit={save}>
        <label htmlFor="n">{t("fullName")}</label>
        <input id="n" type="text" required value={f.full_name} onChange={(e) => set("full_name", e.target.value)} />
        {isPlayer && (
          <>
            <label htmlFor="a">{t("age")}</label>
            <input id="a" type="number" min={8} max={60} value={f.age} onChange={(e) => set("age", e.target.value)} />
            <label htmlFor="g">{t("gender")}</label>
            <select id="g" value={f.gender} onChange={(e) => set("gender", e.target.value)}>
              <option value="">{t("preferNot")}</option>
              <option value="male">{t("male")}</option>
              <option value="female">{t("female")}</option>
            </select>
          </>
        )}
        <label htmlFor="v">{t("village")}</label>
        <input id="v" type="text" value={f.village} onChange={(e) => set("village", e.target.value)} />
        <label htmlFor="d">{t("district")}</label>
        <input id="d" type="text" value={f.district} onChange={(e) => set("district", e.target.value)} />
        <label htmlFor="s">{t("state")}</label>
        <input id="s" type="text" value={f.state} onChange={(e) => set("state", e.target.value)} />
        <label htmlFor="c">{t("school")}</label>
        <input id="c" type="text" value={f.school_or_club} onChange={(e) => set("school_or_club", e.target.value)} />
        {isPlayer && (
          <label className="check" style={{ marginTop: 18 }}>
            <input type="checkbox" checked={f.parent_consent} onChange={(e) => set("parent_consent", e.target.checked)} />
            <span>{t("consent")}</span>
          </label>
        )}
        {msg && <div className={`notice ${msg.kind}`}>{msg.text}</div>}
        <p><button className="btn" type="submit">{t("save")}</button></p>
      </form>
    </div>

    <div className="card" style={{ maxWidth: 560, margin: "16px auto" }}>
      <h2>{t("changePassword")}</h2>
      <form onSubmit={changePassword}>
        <label htmlFor="cur">{t("currentPassword")}</label>
        <input id="cur" type="password" required autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
        <label htmlFor="nw">{t("newPassword")}</label>
        <input id="nw" type="password" required minLength={8} autoComplete="new-password" value={nw} onChange={(e) => setNw(e.target.value)} />
        <ul className="rules">
          {passwordChecks(nw).map((c) => <li key={c.text} className={c.ok ? "ok" : ""}>{c.text}</li>)}
        </ul>
        <label htmlFor="cf">{t("confirmPassword")}</label>
        <input id="cf" type="password" required minLength={8} autoComplete="new-password" value={cf} onChange={(e) => setCf(e.target.value)} />
        {lock.secs > 0 && <div className="notice error" role="status">{t("tooManyTries").replace("{time}", waitText(lock.secs))}</div>}
        {pwMsg && <div className={`notice ${pwMsg.kind}`} role={pwMsg.kind === "error" ? "alert" : "status"}>{pwMsg.text}</div>}
        <p><button className="btn" type="submit" disabled={pwBusy || lock.secs > 0}>{t("changePassword")}</button></p>
      </form>
    </div>
    </>
  );
}
