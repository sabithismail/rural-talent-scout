"""Pipeline worker: pending upload -> checked -> 'validated' (the Java service then scores it) or 'rejected'.

Needs SUPABASE_URL and SUPABASE_SERVICE_KEY (the service key bypasses row-level security, so keep it on
the server only). Run once:    python -m app.worker --once
Run forever (every 30 s):      python -m app.worker
"""
import os
import sys
import tempfile
import time

import httpx

from .checks import Limits, check_video, sha256_file

BASE = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}


def pending(client: httpx.Client) -> list[dict]:
    r = client.get(
        f"{BASE}/rest/v1/submissions",
        params={"status": "eq.pending", "select": "id,player_id,video_path,created_at,sports(max_clip_seconds)", "order": "created_at.asc", "limit": "20"},
        headers=HEADERS,
    )
    r.raise_for_status()
    return r.json()


def download(client: httpx.Client, video_path: str, dest: str) -> None:
    with client.stream("GET", f"{BASE}/storage/v1/object/videos/{video_path}", headers=HEADERS) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_bytes(1024 * 1024):
                f.write(chunk)


def is_duplicate(client: httpx.Client, sub_id: str, digest: str) -> bool:
    r = client.get(
        f"{BASE}/rest/v1/submissions",
        params={"video_hash": f"eq.{digest}", "id": f"neq.{sub_id}", "select": "id", "limit": "1"},
        headers=HEADERS,
    )
    r.raise_for_status()
    return len(r.json()) > 0


def patch(client: httpx.Client, sub_id: str, body: dict) -> None:
    r = client.patch(f"{BASE}/rest/v1/submissions", params={"id": f"eq.{sub_id}"}, json=body,
                     headers={**HEADERS, "Prefer": "return=minimal"})
    r.raise_for_status()


def process(client: httpx.Client, row: dict) -> str:
    max_seconds = float((row.get("sports") or {}).get("max_clip_seconds") or 60)
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "clip")
        download(client, row["video_path"], path)
        digest = sha256_file(path)
        result = check_video(path, Limits(max_seconds=max_seconds))

    reasons = list(result.reasons)
    if result.valid and is_duplicate(client, row["id"], digest):
        reasons.append("This exact video was already uploaded.")

    analysis = {"validation": {"valid": not reasons, "reasons": reasons, **result.metrics}}
    if reasons:
        patch(client, row["id"], {"status": "rejected", "video_hash": digest, "analysis": analysis})
        return "rejected"
    patch(client, row["id"], {"status": "validated", "video_hash": digest, "analysis": analysis})
    return "validated"


def run_once() -> dict:
    if not BASE or not KEY:
        raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY first.")
    counts = {"validated": 0, "rejected": 0, "errors": 0}
    with httpx.Client(timeout=120) as client:
        for row in pending(client):
            try:
                counts[process(client, row)] += 1
            except Exception as e:  # leave it pending so the next run retries
                counts["errors"] += 1
                print(f"submission {row.get('id')}: {e}", file=sys.stderr)
    return counts


if __name__ == "__main__":
    if "--once" in sys.argv:
        print(run_once())
    else:
        while True:
            print(run_once(), flush=True)
            time.sleep(30)
