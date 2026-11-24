"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import type { Sport } from "@/lib/types";

type Row = { rank: number; first_name: string; district: string | null; state: string | null; age_band: string; score: number };

export default function LeaderboardPage() {
  const { t, sport } = useI18n();
  const { user, loading } = useAuth();
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportId, setSportId] = useState("");
  const [state, setState] = useState("");
  const [band, setBand] = useState("");
  const [gender, setGender] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    supabase.from("sports").select("*").order("id").then(({ data }) => {
      const list = (data as Sport[]) ?? [];
      setSports(list);
      if (list[0]) setSportId(String(list[0].id));
    });
  }, []);

  useEffect(() => {
    if (!user || !sportId) return;
    setMsg("");
    supabase.rpc("leaderboard", { p_sport: Number(sportId), p_state: state.trim() || null, p_band: band || null, p_gender: gender || null, p_limit: 50 })
      .then(({ data, error }) => {
        if (error) return setMsg(t("err_generic"));
        setRows((data as Row[]) ?? []);
      });
  }, [user, sportId, state, band, gender, t]);

  if (!loading && !user) return <p>{t("needLogin")} <Link href="/login">{t("login")}</Link></p>;

  return (
    <>
      <h1>{t("lbTitle")}</h1>
      <p className="muted">{t("lbLede")}</p>
      <div className="card">
        <label htmlFor="lbs">{t("lbSport")}</label>
        <select id="lbs" value={sportId} onChange={(e) => setSportId(e.target.value)}>
          {sports.map((s) => <option key={s.id} value={s.id}>{sport(s.slug, s.name)}</option>)}
        </select>
        <label htmlFor="lbst">{t("lbState")}</label>
        <input id="lbst" type="text" maxLength={80} value={state} onChange={(e) => setState(e.target.value)} />
        <label htmlFor="lbb">{t("lbAge")}</label>
        <select id="lbb" value={band} onChange={(e) => setBand(e.target.value)}>
          <option value="">{t("lbAny")}</option>
          <option value="u14">Under 14</option>
          <option value="14-17">14-17</option>
          <option value="18+">18+</option>
        </select>
        <label htmlFor="lbg">{t("lbGender")}</label>
        <select id="lbg" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option value="">{t("lbAny")}</option>
          <option value="male">{t("male")}</option>
          <option value="female">{t("female")}</option>
        </select>
      </div>
      {msg && <div className="notice error" role="alert">{msg}</div>}
      {rows.length === 0 && !msg && <p className="muted">{t("lbEmpty")}</p>}
      {rows.map((r) => (
        <div className="card" key={r.rank}>
          <div className="row">
            <strong>#{r.rank}</strong>
            <div>
              <strong className="clamp">{r.first_name}</strong>
              <div className="muted clamp">{[r.district, r.state].filter(Boolean).join(", ")} · {r.age_band}</div>
            </div>
            <div className="score">{Math.round(r.score)}<small>/100</small></div>
          </div>
        </div>
      ))}
    </>
  );
}
