"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import { UUID_RE, gmailUrl, mailtoUrl, matchFederation, templateDraft, type Federation } from "@/lib/federation";

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

  useEffect(() => {
    if (!user || !id || !UUID_RE.test(id)) return;
    supabase
      .from("submissions")
      .select("id, status, score, sports(name, slug)")
      .eq("id", id)
      .eq("player_id", user.id)
      .maybeSingle()
      .then(({ data }) => setSub((data as unknown as Sub) ?? null));
    supabase
      .from("federations")
      .select("id, state, keys, body_name, email, kind, confidence, source_url, note")
      .order("state")
      .then(({ data }) => setFeds((data as Federation[]) ?? []));
  }, [user, id]);

  // Pre-select the federation that matches the state written on the profile.
  useEffect(() => {
    if (fedId !== "" || !feds.length) return;
    const m = matchFederation(feds, profile?.state);
    if (m) setFedId(m.id);
  }, [feds, profile, fedId]);

  const fed = useMemo(() => feds.find((f) => f.id === fedId) ?? null, [feds, fedId]);
  const minor = profile?.age == null || (profile?.age ?? 99) < 18;

  if (!loading && !user) return <p>{t("needLogin")} <Link href="/login">{t("login")}</Link></p>;
  if (!UUID_RE.test(id ?? "")) return <div className="notice error">{t("err_generic")}</div>;

  const eligible = !!sub && sub.status === "scored" && (sub.score ?? 0) >= 70 && profile?.parent_consent === true;

  const errText = (e: unknown) => {
    const m = String((e as { message?: string })?.message ?? "");
    const hit = ["not_eligible_score", "not_eligible_consent", "guardian_needed", "rate_limited"].find((c) => m.includes(c));
    return t(hit ? `err_${hit}` : "err_generic");
  };

  async function prepare() {
    if (!fed || !sub) return;
    setBusy(true); setErr(""); setRevoked(false);
    try {
      const { data, error } = await supabase.rpc("prepare_outreach", {
        p_submission: sub.id, p_federation: fed.id, p_guardian_ok: guardian,
      });
      if (error) throw error;
      const p = data as Prepared;
      const link = `${window.location.origin}/verify/${p.token}`;
      let draft = { ...templateDraft({ name: p.name, age: p.age, village: p.village, district: p.district, state: p.state, sport: p.sport, score: p.score, date: p.date }, link), source: "template" as "ai" | "template" };
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const r = await fetch("/api/draft", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token ?? ""}` },
          body: JSON.stringify({ ...p, link, fedBody: p.federation.body_name }),
        });
        if (r.ok) draft = await r.json();
      } catch {}
      setPrep(p); setSubject(draft.subject); setBody(draft.body); setSource(draft.source);
    } catch (e) {
      setErr(errText(e));
    } finally {
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
          <p><button className="btn ghost" onClick={revoke}>{t("fedRevoke")}</button></p>
        </div>
      )}
    </>
  );
}
