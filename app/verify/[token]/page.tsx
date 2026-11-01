"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { UUID_RE } from "@/lib/federation";

type Proof = { first_name: string; district: string | null; state: string | null; sport: string; score: number; date: string };

export default function Verify() {
  const { t } = useI18n();
  const { token } = useParams<{ token: string }>();
  const [proof, setProof] = useState<Proof | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "invalid">("loading");

  useEffect(() => {
    if (!token || !UUID_RE.test(token)) { setState("invalid"); return; }
    supabase.rpc("verify_score", { p_token: token }).then(({ data, error }) => {
      if (error || !data) setState("invalid");
      else { setProof(data as Proof); setState("ok"); }
    });
  }, [token]);

  if (state === "loading") return <p className="muted">...</p>;
  if (state === "invalid" || !proof) return <div className="notice error">{t("verifyInvalid")}</div>;

  const where = [proof.district, proof.state].filter(Boolean).join(", ");
  return (
    <>
      <h1>{t("verifyTitle")}</h1>
      <div className="card">
        <div className="row">
          <strong>{proof.first_name}</strong>
          <span className="score">{proof.score}<small>/100</small></span>
        </div>
        <p className="muted">{t("verifySport")}: {proof.sport}</p>
        {where && <p className="muted">{t("verifyFrom")}: {where}</p>}
        <p className="muted">{t("verifyDate")}: {new Date(proof.date).toLocaleDateString()}</p>
      </div>
      <p>{t("verifyBy")}</p>
      <p className="muted">{t("verifyPrivacy")}</p>
    </>
  );
}
