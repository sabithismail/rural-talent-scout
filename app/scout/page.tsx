"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import type { Sport, Submission } from "@/lib/types";

export default function ScoutDashboard() {
  const { t, sport } = useI18n();
  const { user, profile, loading } = useAuth();
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportId, setSportId] = useState("");
  const [minScore, setMinScore] = useState("0");
  const [stateFilter, setStateFilter] = useState("");
  const [rows, setRows] = useState<Submission[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [videoUrl, setVideoUrl] = useState<Record<string, string>>({});

  const verified = !!profile?.verified_scout;

  useEffect(() => {
    supabase.from("sports").select("*").order("id").then(({ data }) => setSports((data as Sport[]) ?? []));
  }, []);

  const load = useCallback(async () => {
    if (!user || !verified) return;
    let q = supabase
      .from("submissions")
      .select("*, sports(name, slug, metric_label, metric_unit), profiles(full_name, age, village, district, state)")
      .eq("status", "scored")
      .gte("score", Number(minScore) || 0)
      .order("score", { ascending: false })
      .limit(100);
    if (sportId) q = q.eq("sport_id", Number(sportId));
    const { data } = await q;
    let list = (data as unknown as Submission[]) ?? [];
    if (stateFilter.trim()) {
      const s = stateFilter.trim().toLowerCase();
      list = list.filter((r) => r.profiles?.state?.toLowerCase().includes(s));
    }
    setRows(list);
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

  async function showVideo(r: Submission) {
    const { data } = await supabase.storage.from("videos").createSignedUrl(r.video_path, 600);
    if (data?.signedUrl) setVideoUrl((p) => ({ ...p, [r.id]: data.signedUrl }));
  }

  if (!loading && !user) return <p>{t("needLogin")} <Link href="/login">{t("login")}</Link></p>;
  if (profile && profile.role !== "scout") return <p className="muted">Scouts only.</p>;

  return (
    <>
      <h1>{t("scoutDashboard")}</h1>
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
          {rows.map((r) => (
            <div className="card" key={r.id}>
              <div className="row">
                <div>
                  <strong>{r.profiles?.full_name}</strong>{r.profiles?.age ? `, ${r.profiles.age}` : ""}
                  <div className="muted">
                    {[r.profiles?.village, r.profiles?.district, r.profiles?.state].filter(Boolean).join(", ")}
                  </div>
                  <div>{r.sports ? sport(r.sports.slug, r.sports.name) : ""}
                    {r.metric_value != null && r.sports ? ` · ${r.sports.metric_label}: ${r.metric_value} ${r.sports.metric_unit}` : ""}
                  </div>
                </div>
                <div className="score">{r.score != null ? Math.round(r.score) : "–"}<small>/100</small></div>
                <button className={`btn ${saved.has(r.player_id) ? "" : "secondary"}`} onClick={() => toggleShortlist(r.player_id)}>
                  {saved.has(r.player_id) ? t("shortlisted") : t("shortlist")}
                </button>
              </div>
              {videoUrl[r.id]
                ? <video src={videoUrl[r.id]} controls playsInline style={{ marginTop: 12 }} />
                : <p><button className="btn secondary" onClick={() => showVideo(r)}>Watch video</button></p>}
            </div>
          ))}
        </>
      )}
    </>
  );
}
