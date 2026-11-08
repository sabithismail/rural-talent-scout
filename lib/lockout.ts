"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * Speed bumps for password and code attempts. After 5 wrong tries in a row the next try is locked for
 * 30 s, then 1 min, 5 min and 15 min. This lives in the browser, so it slows down honest mistakes and
 * lazy scripts; the real limit that stops an attacker is Supabase's own rate limiting on the server.
 */
const FREE_TRIES = 5;
const LOCK_SECONDS = [30, 60, 300, 900];

type Rec = { fails: number; until: number };
const K = (key: string) => `rts-lock:${key}`;

function read(key: string): Rec {
  try {
    const r = JSON.parse(localStorage.getItem(K(key)) ?? "null") as Rec | null;
    if (r && Number.isFinite(r.fails) && Number.isFinite(r.until)) return r;
  } catch {}
  return { fails: 0, until: 0 };
}
function write(key: string, r: Rec) {
  try { localStorage.setItem(K(key), JSON.stringify(r)); } catch {}
}

export const lockedFor = (key: string) => Math.max(0, Math.ceil((read(key).until - Date.now()) / 1000));

export function recordFail(key: string): number {
  const r = read(key);
  // a quiet hour resets the count, so one slip next week is not punished
  const fails = Date.now() - r.until > 3600_000 && r.until > 0 ? 1 : r.fails + 1;
  const wait = fails >= FREE_TRIES ? LOCK_SECONDS[Math.min(fails - FREE_TRIES, LOCK_SECONDS.length - 1)] : 0;
  write(key, { fails, until: wait ? Date.now() + wait * 1000 : r.until });
  return wait;
}

export function clearFails(key: string) {
  try { localStorage.removeItem(K(key)); } catch {}
}

/** "45 s" or "4 min 12 s" */
export function waitText(secs: number) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return m ? `${m} min${s ? ` ${s} s` : ""}` : `${s} s`;
}

/** Live lock state for one key. `secs` counts down; `fail` and `clear` update storage and state together. */
export function useLock(key: string) {
  const [secs, setSecs] = useState(0);
  useEffect(() => { setSecs(lockedFor(key)); }, [key]);
  useEffect(() => {
    if (secs <= 0) return;
    const id = setTimeout(() => setSecs(lockedFor(key)), 1000);
    return () => clearTimeout(id);
  }, [secs, key]);
  const fail = useCallback(() => setSecs(recordFail(key)), [key]);
  const clear = useCallback(() => { clearFails(key); setSecs(0); }, [key]);
  return { secs, fail, clear };
}

/** A cooldown that survives a page reload (used for "send another email"). */
export function useCooldown(key: string) {
  const [secs, setSecs] = useState(0);
  const left = useCallback(() => {
    try { return Math.max(0, Math.ceil((Number(localStorage.getItem(`rts-cd:${key}`) ?? 0) - Date.now()) / 1000)); } catch { return 0; }
  }, [key]);
  useEffect(() => { setSecs(left()); }, [left]);
  useEffect(() => {
    if (secs <= 0) return;
    const id = setTimeout(() => setSecs(left()), 1000);
    return () => clearTimeout(id);
  }, [secs, left]);
  const start = useCallback((n: number) => {
    try { localStorage.setItem(`rts-cd:${key}`, String(Date.now() + n * 1000)); } catch {}
    setSecs(n);
  }, [key]);
  return { secs, start };
}
