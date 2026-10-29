"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import type { Submission } from "@/lib/types";

export default function MySubmissions() {
  const { t, sport } = useI18n();
  const { user, loading } = useAuth();
  const [rows, setRows] = useState<Submission[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("submissions")
      .select("*, sports(name, slug, metric_label, metric_unit)")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows((data as unknown as Submission[]) ?? []));
  }, [user]);

  if (!loading && !user) return <p>{t("needLogin")} <Link href="/login">{t("login")}</Link></p>;

  return (
    <>
      <h1>{t("mySubmissions")}</h1>
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
        </div>
      ))}
    </>
  );
}
