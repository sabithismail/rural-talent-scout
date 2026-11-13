"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import type { Submission } from "@/lib/types";
import { whatsappUrl, proofUrl } from "@/lib/share";

export default function MySubmissions() {
  const { t, sport } = useI18n();
  const { user, profile, loading } = useAuth();
  const [rows, setRows] = useState<Submission[]>([]);
  const [revoked, setRevoked] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("submissions")
      .select("id, player_id, sport_id, video_path, notes, status, metric_value, score, analysis, created_at, reported_value, video_hash, sports(name, slug, metric_label, metric_unit)")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as unknown as Submission[]) ?? []));
  }, [user]);

  async function revoke(id: string) {
    setMsg("");
    const { error } = await supabase.rpc("revoke_share_link", { p_submission: id });
    if (error) setMsg(t("err_generic")); else setRevoked((r) => [...r, id]);
  }

  async function shareWa(r: Submission) {
    setMsg("");
    const { data, error } = await supabase.rpc("get_share_token", { p_submission: r.id });
    if (error || !data) return setMsg(t("err_generic"));
    const name = r.sports ? sport(r.sports.slug, r.sports.name) : "";
    const text = t("waMessage").replace("{sport}", name).replace("{score}", String(Math.round(r.score ?? 0))).replace("{link}", proofUrl(String(data)));
    window.open(whatsappUrl(text), "_blank", "noopener,noreferrer");
  }

  if (!loading && !user) return <p>{t("needLogin")} <Link href="/login">{t("login")}</Link></p>;

  return (
    <>
      <h1>{t("mySubmissions")}</h1>
      {msg && <div className="notice error" role="alert">{msg}</div>}
      {rows.length === 0 && <p className="muted">{t("noResults")}</p>}
      {rows.map((r) => (
        <div className="card" key={r.id}>
          <div className="row">
            <strong>{r.sports ? sport(r.sports.slug, r.sports.name) : ""}</strong>
            <span className={`badge ${r.status}`}>{t(r.status)}</span>
            <span className="muted">{new Date(r.created_at).toLocaleDateString()}</span>
            {r.score != null && <span className="score">{Math.round(r.score)}<small>/100</small></span>}
          </div>
          {(r.metric_value ?? r.reported_value) != null && r.sports && (
            <p className="muted">
              {r.metric_value != null ? r.sports.metric_label : t("reportedResult")}: {r.metric_value ?? r.reported_value} {r.sports.metric_unit}
            </p>
          )}
          {r.notes && <p>{r.notes}</p>}
          {r.status === "scored" && Math.round(r.score ?? 0) >= 70 && (
            profile?.parent_consent ? (
              <>
                <p className="muted">{t("contactFedHint")}</p>
                <p><Link className="btn" href={`/contact/${r.id}`}>{t("contactFed")}</Link></p>
                {revoked.includes(r.id)
                  ? <p className="muted" role="status">{t("fedRevoked")}</p>
                  : <p><button className="link-btn" onClick={() => revoke(r.id)}>{t("fedRevoke")}</button></p>}
                {!revoked.includes(r.id) && (
                  <>
                    <p><button className="btn secondary" onClick={() => shareWa(r)}>{t("waShare")}</button></p>
                    <p className="muted">{t("waHint")}</p>
                  </>
                )}
              </>
            ) : (
              <p className="muted">{t("needConsentHint")} <Link href="/profile">{t("profile")}</Link></p>
            )
          )}
        </div>
      ))}
    </>
  );
}
