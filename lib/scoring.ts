/** Client for the Java Spring Boot scoring service (see /scoring-service). */
export const SCORING_URL = (process.env.NEXT_PUBLIC_SCORING_URL || "http://localhost:8080").replace(/\/$/, "");

export type ScoreResult = {
  sport: string;
  ageBand: string;
  gender: string;
  value: number;
  score: number;
  band: string;
  bandLabel: string;
  floor: number;
  elite: number;
};

/** The service understood the request but refused it (unknown sport, unrealistic result...). */
export class ScoreRejected extends Error {}

/** Returns a score, throws ScoreRejected for a 400, and a plain Error if the service is unreachable. */
export async function previewScore(input: {
  sport: string;
  age: number;
  gender: string | null;
  value: number;
}): Promise<ScoreResult> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(`${SCORING_URL}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal: ctrl.signal,
    });
    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      throw new ScoreRejected(body.error || "The scoring service could not accept this result.");
    }
    if (!res.ok) throw new Error(`Scoring service error ${res.status}`);
    return (await res.json()) as ScoreResult;
  } finally {
    clearTimeout(timer);
  }
}
