"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";

type ScoutRow = { id: string; full_name: string; username: string | null; email: string; verified_scout: boolean; created_at: string };

export default function AdminPage() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ScoutRow[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc("admin_scouts");
    if (error) return setMsg(t("err_generic"));
    setRows((data as ScoutRow[]) ?? []);
  }, [t]);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("am_i_admin").then(({ data }) => {
      setAllowed(data === true);
      if (data === true) load();
    });
  }, [user, load]);

  async function setVerified(id: string, v: boolean) {
    setMsg("");
    const { error } = await supabase.rpc("admin_set_scout_verified", { p_user: id, p_verified: v });
    if (error) return setMsg(t("err_generic"));
    load();
  }

  if (!loading && !user) return <p>{t("needLogin")} <Link href="/login">{t("login")}</Link></p>;
  if (allowed === false) return <div className="notice error" role="alert">{t("adminNotAllowed")}</div>;
  if (allowed === null) return <p className="muted">…</p>;

  return (
    <>
      <h1>{t("adminTitle")}</h1>
      <p className="muted">{t("adminLede")}</p>
      {msg && <div className="notice error" role="alert">{msg}</div>}
      {rows.length === 0 && <p className="muted">{t("adminNoScouts")}</p>}
      {rows.map((r) => (
        <div className="card" key={r.id}>
          <div className="row">
            <div>
              <strong className="clamp">{r.full_name}</strong>
              <div className="muted clamp">{r.email}{r.username ? ` · ${r.username}` : ""}</div>
            </div>
            <span className={`badge ${r.verified_scout ? "scored" : "pending"}`}>{r.verified_scout ? t("adminApproved") : t("adminWaiting")}</span>
            <button className={`btn ${r.verified_scout ? "secondary" : ""}`} onClick={() => setVerified(r.id, !r.verified_scout)}>
              {r.verified_scout ? t("adminRevoke") : t("adminApprove")}
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
