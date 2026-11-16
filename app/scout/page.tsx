"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import type { Sport } from "@/lib/types";

type FeedRow = {
  submission_id: string; player_id: string; full_name: string; age: number | null; village: string | null;
  district: string | null; state: string | null; sport_id: number; score: number; metric_value: number | null;
  created_at: string; email: string;
};

export default function ScoutDashboard() {
  const { t, sport } = useI18n();
  const { user, profile, loading } = useAuth();
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportId, setSportId] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [stateFilter, setStateFilter] = useState("");
  const [rows, setRows] = useState<FeedRow[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [videoUrl, setVideoUrl] = useState<Record<string, string>>({});

  const verified = !!profile?.verified_scout;

  useEffect(() => {
    supabase.from("sports").select("*").order("id").then(({ data }) => setSports((data as Sport[]) ?? []));
  }, []);

  const load = useCallback(async () => {
    if (!user || !verified) return;
    const { data } = await supabase.rpc("scout_feed", {
      p_sport: sportId ? Number(sportId) : null,
      p_min: Number(minScore) || 0,
      p_state: stateFilter.trim() || null,
      p_limit: 100,
    });
    setRows((data as FeedRow[]) ?? []);
    const sl = await supabase.from("shortlists").select("player_id").eq("scout_id", user.id);
    setSaved(new Set((sl.data ?? []).map((r: { player_id: string }) => r.player_id)));
  }, [user, verified, sportId, minScore, stateFilter]);

  useEffect(() => { load(); }, [load]);

  async function toggleShortlist(playerId: string) {
    if (!user) return;
    if (saved.has(playerId)) {
      await supabase.from("shortlists").delete().eq("scout_id", user.id).eq("player_id", playerId);
    } else {
      await supabase.from("shortlists").insert({ scout_id: user.id, player_id: playerId });
    }
    load();
  }

  async function showVideo(r: FeedRow) {
    const { data: sub } = await supabase.from("submissions").select("video_path").eq("id", r.submission_id).maybeSingle();
    if (!sub?.video_path) return;
    const { data } = await supabase.storage.from("videos").createSignedUrl(sub.video_path, 600);
    if (data?.signedUrl) setVideoUrl((p) => ({ ...p, [r.submission_id]: data.signedUrl }));
  }

  if (!loading && !user) return <p>{t("needLogin")} <Link href="/login">{t("login")}</Link></p>;
  if (profile && profile.role !== "scout") return <p className="muted">Scouts only.</p>;

  return (
    <>
      <h1>{t("feedTitle")}</h1>
      <p className="muted">{t("feedLede")}</p>
      {profile && !verified && <div className="notice">{t("notVerified")}</div>}
      {verified && (
        <>
          <div className="row card">
            <select value={sportId} onChange={(e) => setSportId(e.target.value)} aria-label={t("allSports")}>
              <option value="">{t("allSports")}</option>
              {sports.map((s) => <option key={s.id} value={s.id}>{sport(s.slug, s.name)}</option>)}
            </select>
            <input type="number" min={0} max={100} value={minScore} onChange={(e) => setMinScore(e.target.value)} aria-label={t("minScore")} placeholder={t("minScore")} />
            <input type="text" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} placeholder={t("state")} aria-label={t("state")} />
          </div>
          {rows.length === 0 && <p className="muted">{t("noResults")}</p>}
          {rows.map((r) => {
            const sp = sports.find((x) => x.id === r.sport_id);
            const spName = sp ? sport(sp.slug, sp.name) : "";
            const subject = t("emailSubject").replace("{sport}", spName);
            const body = t("emailBody").replace("{name}", r.full_name.split(" ")[0]).replace("{sport}", spName).replace("{score}", String(Math.round(r.score)));
            return (
              <div className="card" key={r.submission_id}>
                <div className="row">
                  <div>
                    <strong>{r.full_name}</strong>{r.age ? `, ${r.age}` : ""}
                    <div className="muted">{[r.village, r.district, r.state].filter(Boolean).join(", ")}</div>
                    <div>{spName}{r.metric_value != null && sp ? `, ${sp.metric_label}: ${r.metric_value} ${sp.metric_unit}` : ""}</div>
                  </div>
                  <div className="score">{Math.round(r.score)}<small>/100</small></div>
                  <button className={`btn ${saved.has(r.player_id) ? "" : "secondary"}`} onClick={() => toggleShortlist(r.player_id)}>
                    {saved.has(r.player_id) ? t("shortlisted") : t("shortlist")}
                  </button>
                </div>
                <p className="row">
                  <a className="btn" href={`mailto:${r.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>{t("emailPlayer")}</a>
                  {!videoUrl[r.submission_id] && <button className="btn secondary" onClick={() => showVideo(r)}>{t("watchVideo")}</button>}
                </p>
                {videoUrl[r.submission_id] && <video src={videoUrl[r.submission_id]} controls playsInline style={{ marginTop: 12 }} />}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
