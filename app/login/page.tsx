"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { passwordChecks } from "@/lib/password";
import OtpInput from "@/components/OtpInput";
import { SITE_URL } from "@/lib/federation";
import { useCooldown, useLock, waitText } from "@/lib/lockout";

type Mode = "login" | "signup" | "verify" | "forgot";
type NameState = "idle" | "invalid" | "checking" | "free" | "taken";

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function Login() {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("mode") === "signup") setMode("signup");
  }, []);
  const [role, setRole] = useState<"player" | "scout">("player");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [nameState, setNameState] = useState<NameState>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeBad, setCodeBad] = useState(false);
  const [verified, setVerified] = useState(false);
  const verifying = useRef(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  // live "is this username taken?" check, 400 ms after the person stops typing
  useEffect(() => {
    if (mode !== "signup") return;
    if (!username) { setNameState("idle"); return; }
    if (!USERNAME_RE.test(username)) { setNameState("invalid"); return; }
    setNameState("checking");
    let alive = true;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc("username_available", { name: username });
      if (!alive) return;
      if (error) setNameState("idle");
      else setNameState(data ? "free" : "taken");
    }, 400);
    return () => { alive = false; clearTimeout(timer); };
  }, [username, mode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const mail = email.trim().toLowerCase();
  const loginLock = useLock(`login:${mail}`);
  const otpLock = useLock(`otp:${mail}`);
  const resetCd = useCooldown(`reset:${mail}`);
  const lockText = (secs: number) => t("tooManyTries").replace("{time}", waitText(secs));
  const pwOk = passwordChecks(password).every((c) => c.ok);

  async function sendReset() {
    setMsg(null);
    if (resetCd.secs > 0) return setMsg({ kind: "error", text: t("waitFor").replace("{time}", waitText(resetCd.secs)) });
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: `${SITE_URL}/reset-password` });
    setBusy(false);
    if (error && /rate|seconds|too many/i.test(error.message)) {
      resetCd.start(60);
      return setMsg({ kind: "error", text: t("tooManyEmails") });
    }
    resetCd.start(60);
    // the same answer whether or not the email has an account, so the form cannot be used to find accounts
    setMsg({ kind: "ok", text: t("resetSent") });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (mode === "signup") {
      if (nameState === "taken") return setMsg({ kind: "error", text: t("usernameTaken") });
      if (nameState !== "free") return setMsg({ kind: "error", text: t("usernameRule") });
      if (!pwOk) return setMsg({ kind: "error", text: t("passwordWeak") });
      setBusy(true);
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { role, full_name: fullName, username } },
      });
      setBusy(false);
      if (error) {
        const dbFailed = /database error/i.test(error.message);
        return setMsg({ kind: "error", text: dbFailed ? t("usernameTaken") : error.message });
      }
      if (data.session) return router.push(role === "scout" ? "/scout" : "/profile");
      setMode("verify");
      setCooldown(60);
      return;
    }

    if (mode === "forgot") return sendReset();
    if (mode === "verify") return verifyCode(code);

    if (loginLock.secs > 0) return setMsg({ kind: "error", text: lockText(loginLock.secs) });
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (/not confirmed/i.test(error.message)) {
        await supabase.auth.resend({ type: "signup", email });
        setMode("verify");
        setCooldown(60);
        return;
      }
      if (/rate|too many/i.test(error.message)) return setMsg({ kind: "error", text: t("tooManyEmails") });
      loginLock.fail();
      setPassword("");
      return setMsg({ kind: "error", text: t("loginWrong") });
    }
    loginLock.clear();
    router.push("/");
  }

  async function verifyCode(token: string) {
    if (verifying.current || token.length < 6) return;
    if (otpLock.secs > 0) { setCode(""); return setMsg({ kind: "error", text: lockText(otpLock.secs) }); }
    verifying.current = true;
    setMsg(null); setCodeBad(false); setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email, token, type: "signup" });
    setBusy(false);
    if (error) {
      verifying.current = false;
      otpLock.fail();
      setCode(""); setCodeBad(true);
      return setMsg({ kind: "error", text: t("otpWrong") });
    }
    otpLock.clear();
    setVerified(true);
    setTimeout(() => router.push("/profile"), 900);
  }

  async function resend() {
    setMsg(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) setMsg({ kind: "error", text: error.message });
    else { setCooldown(60); setCode(""); setCodeBad(false); setMsg({ kind: "ok", text: t("otpResent") }); }
  }

  const title = mode === "login" ? t("login") : mode === "signup" ? t("signup") : mode === "forgot" ? t("forgotTitle") : t("verifyTitle");

  return (
    <div className="card" style={{ maxWidth: 480, margin: "24px auto" }}>
      <h1>{title}</h1>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <>
            <label htmlFor="name">{t("fullName")}</label>
            <input id="name" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} />

            <label htmlFor="user">{t("username")}</label>
            <input id="user" type="text" required autoComplete="username" maxLength={20} value={username}
              onChange={(e) => setUsername(e.target.value.trim())} />
            <div className={`hint ${nameState === "free" ? "good" : nameState === "taken" || nameState === "invalid" ? "bad" : "muted"}`} aria-live="polite">
              {nameState === "free" && t("usernameFree")}
              {nameState === "taken" && t("usernameTaken")}
              {nameState === "checking" && "…"}
              {(nameState === "idle" || nameState === "invalid") && t("usernameRule")}
            </div>

            <label htmlFor="role">{t("iAmPlayer")} / {t("iAmScout")}</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as "player" | "scout")}>
              <option value="player">{t("iAmPlayer")}</option>
              <option value="scout">{t("iAmScout")}</option>
            </select>
          </>
        )}

        {mode === "forgot" ? (
          <>
            <p className="otp-lede">{t("forgotLede")}</p>
            <label htmlFor="email">{t("email")}</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </>
        ) : mode !== "verify" ? (
          <>
            <label htmlFor="email">{t("email")}</label>
            <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label htmlFor="pw">{t("password")}</label>
            <input id="pw" type="password" required minLength={8}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password} onChange={(e) => setPassword(e.target.value)} />
            {mode === "signup" && (
              <ul className="rules">
                {passwordChecks(password).map((c) => <li key={c.text} className={c.ok ? "ok" : ""}>{c.text}</li>)}
              </ul>
            )}
          </>
        ) : (
          <>
            <p className="otp-lede">{t("otpSent")}</p>
            <p className="otp-email">{email}</p>
            <OtpInput
              value={code}
              onChange={(v) => { setCode(v); if (codeBad) setCodeBad(false); }}
              onComplete={(v) => verifyCode(v)}
              disabled={busy || verified}
              invalid={codeBad}
              success={verified}
              groupLabel={t("otpGroup")}
              digitLabel={(n, total) => t("otpDigit").replace("{n}", String(n)).replace("{total}", String(total))}
            />
            <div className="otp-status" aria-live="polite">
              {verified ? t("otpVerified") : busy ? t("otpChecking") : t("otpExpires")}
            </div>
          </>
        )}

        {mode === "login" && loginLock.secs > 0 && <div className="notice error" role="status">{lockText(loginLock.secs)}</div>}
        {mode === "verify" && otpLock.secs > 0 && <div className="notice error" role="status">{lockText(otpLock.secs)}</div>}
        {msg && <div className={`notice ${msg.kind}`} role={msg.kind === "error" ? "alert" : "status"}>{msg.text}</div>}

        <p>
          <button className="btn" type="submit"
            disabled={busy || verified || (mode === "verify" && (code.length < 6 || otpLock.secs > 0)) || (mode === "login" && loginLock.secs > 0) || (mode === "forgot" && resetCd.secs > 0)}>
            {mode === "login" ? t("login") : mode === "signup" ? t("signup") : mode === "forgot" ? t("sendResetLink") : t("verify")}
            {mode === "forgot" && resetCd.secs > 0 ? ` (${resetCd.secs})` : ""}
          </button>
        </p>
        {mode === "login" && (
          <p><button type="button" className="link-btn" onClick={() => { setMsg(null); setMode("forgot"); }}>{t("forgotPassword")}</button></p>
        )}
      </form>

      {mode === "verify" ? (
        <button className="btn secondary" disabled={cooldown > 0} onClick={resend}>
          {t("resend")}{cooldown > 0 ? ` (${cooldown})` : ""}
        </button>
      ) : mode === "forgot" ? (
        <button className="btn secondary" onClick={() => { setMsg(null); setMode("login"); }}>{t("backToLogin")}</button>
      ) : (
        <button className="btn secondary" onClick={() => { setMsg(null); setMode(mode === "login" ? "signup" : "login"); }}>
          {mode === "login" ? t("signup") : t("login")}
        </button>
      )}
    </div>
  );
}
