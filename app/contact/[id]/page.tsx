"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import { whatsappUrl, proofUrl } from "@/lib/share";
import { UUID_RE, SITE_URL, gmailUrl, mailtoUrl, matchFederation, templateDraft, type Federation } from "@/lib/federation";

type Sub = { id: string; status: string; score: number | null; sports: { name: string; slug: string } | null };
type Prepared = {
  token: string; score: number; sport: string; name: string; age: number | null;
  village: string | null; district: string | null; state: string | null; date: string;
  federation: { id: number; state: string; body_name: string; email: string; confidence: "official" | "closest" };
};

export default function Contact() {
  const { t, sport } = useI18n();
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading } = useAuth();
  const [sub, setSub] = useState<Sub | null>(null);
  const [feds, setFeds] = useState<Federation[]>([]);
  const [fedId, setFedId] = useState<number | "">("");
  const [guardian, setGuardian] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [prep, setPrep] = useState<Prepared | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [source, setSource] = useState<"ai" | "template">("template");
  const [copied, setCopied] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [loadErr, setLoadErr] = useState(false);
  const [repOpen, setRepOpen] = useState(false);
  const [repMsg, setRepMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [subLoaded, setSubLoaded] = useState(false);
  const preselected = useRef(false);
  const working = useRef(false);

  useEffect(() => {
    if (!user || !id || !UUID_RE.test(id)) return;
    supabase
      .from("submissions")
      .select("id, status, score, sports(name, slug)")
      .eq("id", id)
      .eq("player_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => { if (error) setLoadErr(true); setSub((data as unknown as Sub) ?? null); setSubLoaded(true); });
    supabase
      .from("federations")
      .select("id, state, keys, body_name, email, kind, confidence, source_url, note")
      .order("state")
      .then(({ data, error }) => { if (error) setLoadErr(true); setFeds((data as Federation[]) ?? []); });
  }, [user, id]);

  // Pre-select the federation that matches the state written on the profile.
  useEffect(() => {
    if (preselected.current || !feds.length || !profile) return;
    preselected.current = true; // only once, so a later choice by the player is never overwritten
    const m = matchFederation(feds, profile.state);
    if (m) setFedId(m.id);
  }, [feds, profile]);

  const fed = useMemo(() => feds.find((f) => f.id === fedId) ?? null, [feds, fedId]);
  const minor = profile?.age == null || (profile?.age ?? 99) < 18;

  if (!loading && !user) return <p>{t("needLogin")} <Link href="/login">{t("login")}</Link></p>;
  if (!UUID_RE.test(id ?? "")) return <div className="notice error">{t("err_generic")}</div>;

  const eligible = !!sub && sub.status === "scored" && Math.round(sub.score ?? 0) >= 70 && profile?.parent_consent === true;

  const errText = (e: unknown) => {
    const m = String((e as { message?: string })?.message ?? "");
    const hit = ["not_eligible_score", "not_eligible_consent", "guardian_needed", "rate_limited"].find((c) => m.includes(c));
    return t(hit ? `err_${hit}` : "err_generic");
  };

  async function report(reason: "bounced" | "wrong_body" | "other") {
    if (!prep) return;
    setRepMsg(null);
    const { error } = await supabase.rpc("report_federation_email", { p_federation: prep.federation.id, p_reason: reason });
    if (error && !String(error.message).includes("rate_limited")) return setRepMsg({ kind: "error", text: t("reportFailed") });
    setRepOpen(false);
    setRepMsg({ kind: "ok", text: error ? t("err_rate_limited") : t("reportSent") });
  }

  async function prepare() {
    if (!fed || !sub || working.current) return;
    working.current = true;
    setBusy(true); setErr(""); setRevoked(false);
    try {
      const { data, error } = await supabase.rpc("prepare_outreach", {
        p_submission: sub.id, p_federation: fed.id, p_guardian_ok: guardian,
      });
      if (error) throw error;
      const p = data as Prepared;
      const link = `${SITE_URL}/verify/${p.token}`;
      let draft = { ...templateDraft({ name: p.name, age: p.age, village: p.village, district: p.district, state: p.state, sport: p.sport, score: p.score, date: p.date }, link), source: "template" as "ai" | "template" };
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const r = await fetch("/api/draft", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token ?? ""}` },
          body: JSON.stringify({ token: p.token }),
        });
        if (r.ok) draft = await r.json();
      } catch {}
      setPrep(p); setSubject(draft.subject); setBody(draft.body); setSource(draft.source);
    } catch (e) {
      setErr(errText(e));
    } finally {
      working.current = false;
      setBusy(false);
    }
  }

  async function revoke() {
    if (!sub) return;
    const { error } = await supabase.rpc("revoke_share_link", { p_submission: sub.id });
    if (error) setErr(t("err_generic")); else { setRevoked(true); setPrep(null); }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(`To: ${prep?.federation.email}\nSubject: ${subject}\n\n${body}`);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <>
      <p><Link href="/me">{t("backToMine")}</Link></p>
      <h1>{t("fedTitle")}</h1>
      <p>{t("fedIntro")}</p>

      {loadErr && <div className="notice error" role="alert">{t("loadFailed")}</div>}
      {subLoaded && !sub && !loadErr && <div className="notice error">{t("err_generic")}</div>}
      {sub && !eligible && <div className="notice error">{profile?.parent_consent ? t("fedNotEligible") : t("err_not_eligible_consent")}</div>}
      {revoked && <div className="notice ok">{t("fedRevoked")}</div>}

      {eligible && !prep && (
        <div className="card">
          <p><strong>{sub?.sports ? sport(sub.sports.slug, sub.sports.name) : ""}</strong> <span className="score">{Math.round(sub?.score ?? 0)}<small>/100</small></span></p>
          <label htmlFor="fed">{t("fedStateLabel")}</label>
          <select id="fed" value={fedId} onChange={(e) => setFedId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">{t("fedPickState")}</option>
            {feds.map((f) => <option key={f.id} value={f.id}>{f.state}</option>)}
          </select>
          {fed && (
            <div className={`notice ${fed.confidence === "closest" ? "error" : ""}`}>
              <strong>{fed.body_name}</strong><br />
              {fed.email}<br />
              {fed.confidence === "closest" ? t("fedClosestNote") : t("fedOfficialNote")}
              {fed.note && <><br /><span className="muted">{fed.note}</span></>}
              {fed.source_url && <><br /><a href={fed.source_url} target="_blank" rel="noopener noreferrer">{t("fedSource")}</a></>}
            </div>
          )}
          {minor && (
            <label className="check">
              <input type="checkbox" checked={guardian} onChange={(e) => setGuardian(e.target.checked)} />
              <span>{t("fedGuardian")}</span>
            </label>
          )}
          {err && <div className="notice error">{err}</div>}
          <p>
            <button className="btn" onClick={prepare} disabled={!fed || busy || (minor && !guardian)}>
              {busy ? t("fedPreparing") : t("fedPrepare")}
            </button>
          </p>
        </div>
      )}

      {prep && (
        <div className="card">
          <label htmlFor="to">{t("fedTo")}</label>
          <input id="to" type="text" readOnly value={`${prep.federation.body_name} <${prep.federation.email}>`} />
          <label htmlFor="su">{t("fedSubject")}</label>
          <input id="su" type="text" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} />
          <label htmlFor="bd">{t("fedBody")}</label>
          <textarea id="bd" rows={14} value={body} onChange={(e) => setBody(e.target.value)} />
          <p className="muted">{t("fedEditHint")} {source === "ai" ? t("fedAiNote") : t("fedTemplateNote")}</p>
          {prep.federation.confidence === "closest" && <div className="notice error">{t("fedClosestNote")}</div>}
          <div className="row">
            <a className="btn" href={gmailUrl(prep.federation.email, subject, body)} target="_blank" rel="noopener noreferrer">{t("fedOpenGmail")}</a>
            <a className="btn secondary" href={mailtoUrl(prep.federation.email, subject, body)}>{t("fedOpenMail")}</a>
            <button className="btn secondary" onClick={copy}>{copied ? t("fedCopied") : t("fedCopy")}</button>
          </div>
          <p>
            <a className="btn secondary" href={whatsappUrl(t("waMessage").replace("{sport}", prep.sport).replace("{score}", String(Math.round(prep.score))).replace("{link}", proofUrl(prep.token)))} target="_blank" rel="noopener noreferrer">{t("waShare")}</a>
          </p>
          <p><button className="btn ghost" onClick={revoke}>{t("fedRevoke")}</button></p>
          <p><button className="link-btn" aria-expanded={repOpen} onClick={() => setRepOpen((o) => !o)}>{t("reportEmail")}</button></p>
          {repOpen && (
            <div className="row">
              <button className="btn secondary" onClick={() => report("bounced")}>{t("reportBounced")}</button>
              <button className="btn secondary" onClick={() => report("wrong_body")}>{t("reportWrongBody")}</button>
              <button className="btn secondary" onClick={() => report("other")}>{t("reportOther")}</button>
            </div>
          )}
          {repMsg && <div className={`notice ${repMsg.kind}`} role={repMsg.kind === "error" ? "alert" : "status"}>{repMsg.text}</div>}
        </div>
      )}
    </>
  );
}
