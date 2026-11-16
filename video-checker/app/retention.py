"""Storage cleanup. Runs after scoring. Does nothing until the videos bucket is at least 70% full.

Videos that scored 70 or more are never touched. Every other video (scored below 70, or rejected) is
compressed first (oldest first). If the bucket is still at or above the limit, the oldest of those
videos are deleted; the submission row and its score stay, only the video goes.

Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, STORAGE_QUOTA_BYTES (default 1 GiB, the Supabase free plan).
Run:  python -m app.retention
"""
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone

import httpx

BASE = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
QUOTA = int(os.environ.get("STORAGE_QUOTA_BYTES", str(1024**3)))
START_AT = 0.70   # begin cleaning when usage reaches this share of the quota
STOP_AT = 0.60    # stop once usage is back under this share
KEEP_SCORE = 70
COMPRESSIBLE = (".mp4", ".mov", ".m4v")


def should_clean(used: int, quota: int = QUOTA) -> bool:
    return quota > 0 and used / quota >= START_AT


def below_target(used: int, quota: int = QUOTA) -> bool:
    return used / quota < STOP_AT


def is_protected(row: dict) -> bool:
    """A scored video at or above the keep score is never compressed or deleted."""
    return row.get("status") == "scored" and float(row.get("score") or 0) >= KEEP_SCORE


def order_for_cleanup(rows: list[dict]) -> list[dict]:
    """Candidates only (not protected, still stored), rejected first, then oldest first."""
    cands = [r for r in rows if not is_protected(r) and not r.get("video_deleted_at")]
    return sorted(cands, key=lambda r: (r.get("status") != "rejected", r.get("created_at") or ""))


def candidates(client: httpx.Client) -> list[dict]:
    r = client.get(
        f"{BASE}/rest/v1/submissions",
        params={"status": "in.(scored,rejected)", "video_deleted_at": "is.null",
                "select": "id,video_path,status,score,created_at,video_compressed_at", "order": "created_at.asc", "limit": "500"},
        headers=HEADERS,
    )
    r.raise_for_status()
    return order_for_cleanup(r.json())


def usage(client: httpx.Client) -> int:
    r = client.post(f"{BASE}/rest/v1/rpc/storage_usage", json={}, headers=HEADERS)
    r.raise_for_status()
    return int(r.json())


def download(client: httpx.Client, path: str, dest: str) -> None:
    with client.stream("GET", f"{BASE}/storage/v1/object/videos/{path}", headers=HEADERS) as r:
        r.raise_for_status()
        with open(dest, "wb") as f:
            for chunk in r.iter_bytes(1024 * 1024):
                f.write(chunk)


def compress(src: str, dst: str) -> bool:
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vf", "scale=-2:'min(480,ih)'",
           "-c:v", "libx264", "-crf", "32", "-preset", "veryfast", "-c:a", "aac", "-b:a", "64k", "-movflags", "+faststart", dst]
    return subprocess.run(cmd, capture_output=True, timeout=300).returncode == 0


def patch(client: httpx.Client, sub_id: str, body: dict) -> None:
    r = client.patch(f"{BASE}/rest/v1/submissions", params={"id": f"eq.{sub_id}"}, json=body,
                     headers={**HEADERS, "Prefer": "return=minimal"})
    r.raise_for_status()


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def run() -> dict:
    if not BASE or not KEY:
        raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY first.")
    out = {"used_before": 0, "compressed": 0, "deleted": 0, "used_after": 0}
    with httpx.Client(timeout=300) as client:
        used = usage(client)
        out["used_before"] = used
        if not should_clean(used):
            out["used_after"] = used
            return out
        rows = candidates(client)
        # stage 1: compress
        if shutil.which("ffmpeg"):
            for row in rows:
                if below_target(used):
                    break
                path = row["video_path"]
                if row.get("video_compressed_at") or not path.lower().endswith(COMPRESSIBLE):
                    continue
                try:
                    with tempfile.TemporaryDirectory() as tmp:
                        src, dst = os.path.join(tmp, "in" + os.path.splitext(path)[1]), os.path.join(tmp, "out.mp4")
                        download(client, path, src)
                        before = os.path.getsize(src)
                        if not compress(src, dst) or os.path.getsize(dst) >= before:
                            patch(client, row["id"], {"video_compressed_at": now()})  # not worth retrying
                            continue
                        after = os.path.getsize(dst)
                        with open(dst, "rb") as f:
                            up = client.put(f"{BASE}/storage/v1/object/videos/{path}", content=f.read(),
                                            headers={**HEADERS, "content-type": "video/mp4", "x-upsert": "true"})
                        up.raise_for_status()
                    patch(client, row["id"], {"video_compressed_at": now()})
                    used -= before - after
                    out["compressed"] += 1
                except Exception as e:
                    print(f"compress {row.get('id')}: {e}", file=sys.stderr)
        # stage 2: delete, only if still too full
        if should_clean(used):
            for row in rows:
                if below_target(used):
                    break
                try:
                    d = client.delete(f"{BASE}/storage/v1/object/videos/{row['video_path']}", headers=HEADERS)
                    if d.status_code not in (200, 204, 404):
                        d.raise_for_status()
                    patch(client, row["id"], {"video_deleted_at": now(), "visibility": "private"})
                    out["deleted"] += 1
                    used = usage(client)
                except Exception as e:
                    print(f"delete {row.get('id')}: {e}", file=sys.stderr)
        out["used_after"] = usage(client)
    return out


if __name__ == "__main__":
    print(run())
