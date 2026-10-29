"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { passwordChecks } from "@/lib/password";

type Mode = "login" | "signup" | "verify";
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

  const pwOk = passwordChecks(password).every((c) => c.ok);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (mode === "signup") {
      if (nameState === "taken") return setMsg({ kind: "error", text: t("usernameTaken") });
      if (nameState !== "free") return setMsg({ kind: "error", text: t("usernameRule") });
      if (!pwOk) return setMsg({ kind: "error", text: "Password is too weak. Follow the rules below the field." });
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
      setCooldown(30);
      return setMsg({ kind: "ok", text: t("verifyBody") });
    }

    if (mode === "verify") {
      setBusy(true);
      const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: "signup" });
      setBusy(false);
      if (error) return setMsg({ kind: "error", text: "That code is wrong or has expired. Ask for a new one." });
      return router.push("/profile");
    }

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (/not confirmed/i.test(error.message)) {
        await supabase.auth.resend({ type: "signup", email });
        setMode("verify");
        setCooldown(30);
        return setMsg({ kind: "ok", text: t("verifyBody") });
      }
      return setMsg({ kind: "error", text: error.message });
    }
    router.push("/");
  }

  async function resend() {
    setMsg(null);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) setMsg({ kind: "error", text: error.message });
    else { setCooldown(30); setMsg({ kind: "ok", text: t("verifyBody") }); }
  }

  const title = mode === "login" ? t("login") : mode === "signup" ? t("signup") : t("verifyTitle");

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

        {mode !== "verify" ? (
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
            <p className="muted">{email}</p>
            <label htmlFor="code">{t("verifyBody")}</label>
            <input id="code" className="otp" type="text" inputMode="numeric" autoComplete="one-time-code"
              pattern="[0-9]*" maxLength={6} required value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </>
        )}

        {msg && <div className={`notice ${msg.kind}`}>{msg.text}</div>}

        <p>
          <button className="btn" disabled={busy || (mode === "verify" && code.length < 6)} type="submit">
            {mode === "login" ? t("login") : mode === "signup" ? t("signup") : t("verify")}
          </button>
        </p>
      </form>

      {mode === "verify" ? (
        <button className="btn secondary" disabled={cooldown > 0} onClick={resend}>
          {t("resend")}{cooldown > 0 ? ` (${cooldown})` : ""}
        </button>
      ) : (
        <button className="btn secondary" onClick={() => { setMsg(null); setMode(mode === "login" ? "signup" : "login"); }}>
          {mode === "login" ? t("signup") : t("login")}
        </button>
      )}
    </div>
  );
}
