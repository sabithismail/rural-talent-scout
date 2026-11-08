"use client";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import type { Sport } from "@/lib/types";
import Intro from "@/components/Intro";
import Tilt from "@/components/Tilt";
import CategoryIcon from "@/components/CategoryIcon";

export default function Home() {
  const { t, sport, cat: catName } = useI18n();
  const [sports, setSports] = useState<Sport[]>([]);
  const [err, setErr] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [tries, setTries] = useState(0);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  useEffect(() => {
    setErr(""); setLoaded(false);
    supabase
      .from("sports")
      .select("*")
      .order("category")
      .order("name")
      .then(({ data, error }) => {
        if (error) setErr(t("loadSportsError"));
        else setSports((data as Sport[]) ?? []);
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tries]);

  const categories = useMemo(() => Array.from(new Set(sports.map((s) => s.category))), [sports]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sports.filter((s) => {
      if (cat !== "all" && s.category !== cat) return false;
      if (!needle) return true;
      return [s.name, sport(s.slug, s.name), s.category, catName(s.category), s.drill_name].some((x) => x.toLowerCase().includes(needle));
    });
  }, [sports, q, cat, sport]);

  return (
    <>
      <Intro />

      <section className="select-page">
        <h1>{t("selectSport")}</h1>

        <div className="searchbar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
          />
          {q && <button className="clear" onClick={() => setQ("")} aria-label={t("clearSearch")}>×</button>}
        </div>

        <div className="chips" role="group" aria-label={t("categoryLabel")}>
          <button className={`chip ${cat === "all" ? "on" : ""}`} aria-pressed={cat === "all"} onClick={() => setCat("all")}>{t("allCategories")}</button>
          {categories.map((c) => (
            <button key={c} className={`chip ${cat === c ? "on" : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>{catName(c)}</button>
          ))}
        </div>

        {err && (
          <div className="notice error" role="alert">
            {err} <button className="link-btn" onClick={() => setTries((n) => n + 1)}>{t("tryAgain")}</button>
          </div>
        )}
        {loaded && !err && <p className="muted count" aria-live="polite">{shown.length} / {sports.length} {t("sportsCount")}</p>}

        {!loaded ? (
          <div className="grid" aria-hidden>
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="tile skeleton" />)}
          </div>
        ) : shown.length === 0 && sports.length > 0 ? (
          <div className="notice">{t("noSport")}</div>
        ) : (
          <div className="grid">
            {shown.map((s, i) => (
              <div key={s.id} className="float" style={{ ["--i" as string]: i % 8 }}>
                <Tilt href={`/sport/${s.slug}`} className="tile">
                  <span className="ico"><CategoryIcon category={s.category} /></span>
                  <span className="label">{sport(s.slug, s.name)}</span>
                  <span className="sub">{catName(s.category)}</span>
                </Tilt>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
