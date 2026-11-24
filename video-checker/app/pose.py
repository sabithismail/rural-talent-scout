"""Pose-based cross-check of rep counts (MediaPipe pose landmarks).

For count-based drills (push-ups, sit-ups, pull-ups, skipping) we estimate the number of reps from joint
movement and compare it with what the player reported. We only ever LOWER an over-claim, with a generous
tolerance, because the estimate can miss reps (occlusion, odd camera angle). We never raise a score, and any
failure here is ignored: the video just keeps the number the player reported.

Landmark ids (MediaPipe): 0 nose, 11/12 shoulders, 13/14 elbows, 15/16 wrists, 23/24 hips, 25/26 knees.
"""
from __future__ import annotations

import math
import os
import urllib.request

SUPPORTED = {"push-ups", "sit-ups", "pull-ups", "skipping"}
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
MIN_DETECTED = 0.70      # share of sampled frames that must contain a pose
MIN_REPS = 3             # below this the estimate is too small to trust
TOLERANCE_X, TOLERANCE_ADD = 1.35, 3  # a claim up to est*1.35+3 is accepted as is
SAMPLE_FPS = 12
MAX_SECONDS = 90

# minimum movement (peak to peak) for a signal to count as real reps: degrees, or torso lengths for skipping
MIN_RANGE = {"push-ups": 35.0, "sit-ups": 40.0, "pull-ups": 0.25, "skipping": 0.06}


def count_cycles(signal: list[float], min_range: float) -> int:
    """Count down-strokes of an up/down signal with hysteresis. 0 when the movement is too small."""
    vals = sorted(signal)
    if len(vals) < 6:
        return 0
    lo, hi = vals[int(0.10 * (len(vals) - 1))], vals[int(0.90 * (len(vals) - 1))]
    rng = hi - lo
    if rng < min_range:
        return 0
    hi_th, lo_th = lo + 0.70 * rng, lo + 0.30 * rng
    smooth = [sum(signal[max(0, i - 1): i + 2]) / len(signal[max(0, i - 1): i + 2]) for i in range(len(signal))]
    state, count = None, 0
    for v in smooth:
        if v >= hi_th:
            state = "hi"
        elif v <= lo_th:
            if state == "hi":
                count += 1
            state = "lo"
    return count


def cap_reported(reported: float, est: int | None, detected: float) -> tuple[float, bool]:
    """(value to score, was it lowered). Only an over-claim backed by a confident estimate is lowered."""
    if est is None or est < MIN_REPS or detected < MIN_DETECTED:
        return reported, False
    allowed = math.ceil(est * TOLERANCE_X + TOLERANCE_ADD)
    if reported > allowed:
        return float(allowed), True
    return reported, False


def _angle(a, b, c) -> float:
    """Angle at b in degrees for points (x, y)."""
    v1, v2 = (a[0] - b[0], a[1] - b[1]), (c[0] - b[0], c[1] - b[1])
    n = math.hypot(*v1) * math.hypot(*v2)
    if n == 0:
        return 0.0
    return math.degrees(math.acos(max(-1.0, min(1.0, (v1[0] * v2[0] + v1[1] * v2[1]) / n))))


def _pt(lm, i, min_vis=0.5):
    p = lm[i]
    return (p[0], p[1]) if p[2] >= min_vis else None


def _side_angle(lm, a, b, c):
    """Mean of left/right angle where the three joints are visible."""
    out = []
    for da, db, dc in ((a, b, c), (a + 1, b + 1, c + 1)):
        pa, pb, pc = _pt(lm, da), _pt(lm, db), _pt(lm, dc)
        if pa and pb and pc:
            out.append(_angle(pa, pb, pc))
    return sum(out) / len(out) if out else None


def _mid(lm, i, j):
    p, q = _pt(lm, i), _pt(lm, j)
    if p and q:
        return ((p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
    return p or q


def signal_value(slug: str, lm) -> float | None:
    """One number per frame from 33 landmarks given as (x, y, visibility)."""
    if slug == "push-ups":          # elbow angle: shoulder 11/12, elbow 13/14, wrist 15/16
        return _side_angle(lm, 11, 13, 15)
    if slug == "sit-ups":           # hip angle: shoulder 11/12, hip 23/24, knee 25/26
        return _side_angle(lm, 11, 23, 25)
    sh, hip = _mid(lm, 11, 12), _mid(lm, 23, 24)
    if not sh or not hip:
        return None
    torso = math.hypot(sh[0] - hip[0], sh[1] - hip[1]) or None
    if not torso:
        return None
    if slug == "skipping":          # hip height in torso lengths
        return hip[1] / torso
    if slug == "pull-ups":          # wrists relative to nose in torso lengths (positive when chin is above the hands)
        nose, wr = _pt(lm, 0), _mid(lm, 15, 16)
        if nose and wr:
            return (wr[1] - nose[1]) / torso
    return None


def estimate_from_landmarks(slug: str, frames: list) -> dict | None:
    """frames: one entry per sampled frame, a list of 33 (x, y, visibility) tuples or None when nobody was found."""
    if slug not in SUPPORTED or not frames:
        return None
    detected = sum(1 for f in frames if f) / len(frames)
    sig = [v for v in (signal_value(slug, f) for f in frames if f) if v is not None]
    est = count_cycles(sig, MIN_RANGE[slug])
    return {"method": "mediapipe-pose-lite", "est": est, "detected": round(detected, 2), "frames": len(frames)}


def _model_path() -> str:
    path = os.environ.get("POSE_MODEL_PATH") or os.path.join(os.path.expanduser("~"), ".cache", "pose_landmarker_lite.task")
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        urllib.request.urlretrieve(MODEL_URL, path)
    return path


def extract_landmarks(video_path: str) -> list:
    """Run the pose model on ~12 frames per second of the clip. Imports are local so tests need no MediaPipe."""
    import cv2
    import mediapipe as mp
    from mediapipe.tasks import python as mpt
    from mediapipe.tasks.python import vision

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    stride = max(1, round(fps / SAMPLE_FPS))
    opts = vision.PoseLandmarkerOptions(
        base_options=mpt.BaseOptions(model_asset_path=_model_path()),
        running_mode=vision.RunningMode.VIDEO, num_poses=1)
    frames, idx, last_ts = [], 0, -1
    with vision.PoseLandmarker.create_from_options(opts) as landmarker:
        while len(frames) < MAX_SECONDS * SAMPLE_FPS:
            ok, bgr = cap.read()
            if not ok:
                break
            if idx % stride == 0:
                h, w = bgr.shape[:2]
                if w > 640:
                    bgr = cv2.resize(bgr, (640, int(h * 640 / w)))
                ts = max(last_ts + 1, int(idx / fps * 1000))
                last_ts = ts
                img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
                res = landmarker.detect_for_video(img, ts)
                frames.append([(p.x, p.y, p.visibility or 0.0) for p in res.pose_landmarks[0]] if res.pose_landmarks else None)
            idx += 1
    cap.release()
    return frames


def analyse(slug: str, video_path: str, reported: float | None) -> dict | None:
    """Pose summary for the submission, plus 'adjusted_to' when an over-claim was lowered. Never raises."""
    if slug not in SUPPORTED:
        return None
    try:
        info = estimate_from_landmarks(slug, extract_landmarks(video_path))
    except Exception as e:  # model missing, odd codec, ...: keep the reported value
        return {"method": "mediapipe-pose-lite", "error": str(e)[:120]}
    if info and reported is not None:
        value, lowered = cap_reported(float(reported), info["est"], info["detected"])
        info["reported"] = float(reported)
        info["adjusted_to"] = value if lowered else None
    return info
