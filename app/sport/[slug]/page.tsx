"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/useAuth";
import { enqueue, isNetworkError, uploadSubmission } from "@/lib/upload";
import { previewScore, ScoreRejected, ScoreResult } from "@/lib/scoring";
import type { Sport } from "@/lib/types";

const MAX_BYTES = 50 * 1024 * 1024;

function videoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
    v.onerror = () => resolve(NaN);
    v.src = URL.createObjectURL(file);
  });
}

export default function SportPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t, sport: sportName } = useI18n();
  const { user, profile, loading } = useAuth();
  const [sport, setSport] = useState<Sport | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const [estimate, setEstimate] = useState<ScoreResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const [extra, setExtra] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("sports").select("*").eq("slug", slug).maybeSingle().then(({ data }) => setSport(data as Sport | null));
  }, [slug]);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function onPick(f: File | null) {
    setMsg(null);
    setFile(null);
    if (!f || !sport) return;
    if (!f.type.startsWith("video/")) return setMsg({ kind: "error", text: "Please choose a video file." });
    if (f.size > MAX_BYTES) return setMsg({ kind: "error", text: "Video is larger than 50 MB. Record a shorter clip." });
    const d = await videoDuration(f);
    if (Number.isFinite(d) && d > sport.max_clip_seconds + 1) {
      return setMsg({ kind: "error", text: `Video is ${Math.round(d)}s. Keep it under ${sport.max_clip_seconds}s.` });
    }
    setFile(f);
  }

  function resetForm() {
    setFile(null);
    setNotes("");
    setResult("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || !sport || !file) return;
    setMsg(null);
    setExtra(null);
    setEstimate(null);

    const value = result.trim() === "" ? null : Number(result);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      return setMsg({ kind: "error", text: `${t("yourResult")}: enter a number like 7.5` });
    }

    setBusy(true);

    // 1. Ask the Java engine first. A clearly unrealistic result is refused before anything is uploaded.
    let est: ScoreResult | null = null;
    if (value !== null) {
      if (!profile?.age) {
        setExtra(t("needAge"));
      } else if (navigator.onLine) {
        try {
          est = await previewScore({ sport: sport.slug, age: profile.age, gender: profile.gender, value });
        } catch (err) {
          if (err instanceof ScoreRejected) {
            setMsg({ kind: "error", text: err.message });
            setBusy(false);
            return;
          }
          setExtra(t("serviceDown")); // service unreachable: upload anyway, score later
        }
      }
    }

    // 2. Upload (or queue when offline)
    const item = {
      userId: user.id, sportId: sport.id, notes, reportedValue: value,
      name: file.name, type: file.type, blob: file as Blob,
    };
    try {
      if (!navigator.onLine) throw new Error("offline");
      await uploadSubmission(item);
      setMsg({ kind: "ok", text: t("uploaded") });
      setEstimate(est);
      resetForm();
    } catch (err) {
      if (isNetworkError(err) || (err as Error).message === "offline") {
        try {
          await enqueue(item);
          setMsg({ kind: "ok", text: t("queued") });
          resetForm();
        } catch {
          setMsg({ kind: "error", text: "Could not save the video on this phone. Free up some storage and try again." });
        }
      } else {
        setMsg({ kind: "error", text: (err as Error).message });
      }
    }
    setBusy(false);
  }

  if (!sport) return <p className="muted">…</p>;

  return (
    <>
      <p><Link href="/">{t("back")}</Link></p>
      <h1>{sportName(sport.slug, sport.name)}</h1>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t("drill")}: {sport.drill_name}</h2>
        <p>{sport.drill_instructions}</p>
        <h2>{t("cameraTips")}</h2>
        <p>{sport.camera_tips}</p>
        <p className="muted">Max length: {sport.max_clip_seconds}s · Max size: 50 MB · Measured: {sport.metric_label} ({sport.metric_unit})</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>{t("step2")}</h2>
        {!loading && !user ? (
          <p>
            {t("needLogin")} <Link className="btn" href="/login">{t("login")}</Link>
          </p>
        ) : profile?.role === "scout" ? (
          <p className="muted">Scout accounts cannot upload videos.</p>
        ) : (
          <form onSubmit={submit}>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              capture="environment"
              onChange={(e) => onPick(e.target.files?.[0] ?? null)}
              aria-label={t("chooseVideo")}
            />
            {previewUrl && <video src={previewUrl} controls playsInline style={{ marginTop: 12 }} />}

            <label htmlFor="result">{t("yourResult")} ({sport.metric_unit})</label>
            <input
              id="result" type="number" inputMode="decimal" step="any" min="0"
              value={result} onChange={(e) => setResult(e.target.value)}
            />
            <div className="muted" style={{ fontSize: "0.9rem" }}>{t("resultHint")}</div>

            <label htmlFor="notes">{t("notes")}</label>
            <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            {msg && <div className={`notice ${msg.kind}`}>{msg.text}</div>}
            {extra && <div className="notice">{extra}</div>}
            <p>
              <button className="btn" type="submit" disabled={busy || !file}>
                {busy ? t("uploading") : t("upload")}
              </button>
            </p>
          </form>
        )}
        {user && profile && !profile.parent_consent && profile.role === "player" && (
          <div className="notice">
            Scouts can only see your videos after you give consent on your <Link href="/profile">{t("profile")}</Link> page.
          </div>
        )}
      </div>

      {estimate && (
        <div className="card estimate">
          <div className="muted">{t("estimatedScore")}</div>
          <div className="big">{Math.round(estimate.score)}<small className="muted" style={{ fontSize: "1.1rem" }}>/100</small></div>
          <div><strong>{estimate.bandLabel}</strong></div>
          <p className="muted" style={{ marginBottom: 0 }}>
            {estimate.ageBand} benchmark: 0 points at {estimate.floor} {sport.metric_unit}, 100 points at {estimate.elite} {sport.metric_unit}
          </p>
        </div>
      )}
    </>
  );
}
