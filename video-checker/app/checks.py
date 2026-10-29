"""Video validity checks. Pure functions, no network, so they can be tested with synthetic clips.

A clip is accepted only if it:
  1. opens as a real video with frames,
  2. has a sensible length for the drill,
  3. is not tiny or very low frame-rate,
  4. is not a still image or frozen video,
  5. shows a person in enough sampled frames (OpenCV HOG detector).

These checks make fake uploads harder. They do NOT measure the drill result: the number the player types
is still self-reported until pose-based measurement is added.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass, field

import cv2
import numpy as np


@dataclass(frozen=True)
class Limits:
    min_seconds: float = 3.0
    max_seconds: float = 60.0
    min_pixels: int = 320 * 240
    min_fps: float = 10.0
    min_motion: float = 0.5          # median mean-abs-difference (0-255 grey scale) between samples
    min_person_ratio: float = 0.30   # share of sampled frames that must contain a person
    motion_samples: int = 60
    person_samples: int = 12


@dataclass
class CheckResult:
    valid: bool
    reasons: list[str] = field(default_factory=list)
    metrics: dict = field(default_factory=dict)


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


class PersonDetector:
    """Finds a person in one BGR frame using OpenCV's built-in HOG people detector.

    It needs no model download, so it works anywhere. A pose model (MediaPipe PoseLandmarker) can replace it
    later by implementing the same has_person() method; that is also the first step to measuring the drill itself.
    """

    name = "opencv-hog"

    def __init__(self) -> None:
        self._hog = cv2.HOGDescriptor()
        self._hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

    def has_person(self, frame_bgr: np.ndarray) -> bool:
        h, w = frame_bgr.shape[:2]
        scale = 480.0 / max(h, w) if max(h, w) > 480 else 1.0
        small = cv2.resize(frame_bgr, None, fx=scale, fy=scale) if scale != 1.0 else frame_bgr
        rects, _ = self._hog.detectMultiScale(small, winStride=(8, 8), padding=(8, 8), scale=1.05)
        return len(rects) > 0


_detector: PersonDetector | None = None


def get_detector() -> PersonDetector:
    global _detector
    if _detector is None:
        _detector = PersonDetector()
    return _detector


def check_video(path: str, limits: Limits | None = None, detector: PersonDetector | None = None) -> CheckResult:
    limits = limits or Limits()
    reasons: list[str] = []
    metrics: dict = {}

    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        return CheckResult(False, ["The file could not be opened as a video."], metrics)

    try:
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = float(cap.get(cv2.CAP_PROP_FPS) or 0)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        if frame_count <= 0 or fps <= 0 or width <= 0 or height <= 0:
            return CheckResult(False, ["The video has no readable frames."], metrics)

        duration = frame_count / fps
        metrics.update(duration_s=round(duration, 2), fps=round(fps, 1), width=width, height=height, frames=frame_count)

        if duration < limits.min_seconds:
            reasons.append(f"The clip is only {duration:.1f}s long. Record at least {limits.min_seconds:.0f}s.")
        if duration > limits.max_seconds + 1:
            reasons.append(f"The clip is {duration:.0f}s long. This drill allows at most {limits.max_seconds:.0f}s.")
        if width * height < limits.min_pixels:
            reasons.append("The video resolution is too low to see the drill. Record at 480p or better.")
        if fps < limits.min_fps:
            reasons.append("The video frame rate is too low.")

        # ---- sample frames evenly across the clip ----
        n_samples = min(limits.motion_samples, frame_count)
        indices = sorted(set(np.linspace(0, frame_count - 1, n_samples).astype(int).tolist()))
        grey_samples: list[np.ndarray] = []
        frames_for_person: list[np.ndarray] = []
        person_idx = set(np.linspace(0, len(indices) - 1, min(limits.person_samples, len(indices))).astype(int).tolist())

        for k, frame_index in enumerate(indices):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
            ok, frame = cap.read()
            if not ok or frame is None:
                continue
            small = cv2.resize(frame, (160, 90))
            grey_samples.append(cv2.cvtColor(small, cv2.COLOR_BGR2GRAY).astype(np.float32))
            if k in person_idx:
                frames_for_person.append(frame)

        if len(grey_samples) < 3:
            reasons.append("Too few frames could be read from the video.")
            return CheckResult(False, reasons, metrics)

        diffs = [float(np.mean(np.abs(a - b))) for a, b in zip(grey_samples, grey_samples[1:])]
        motion = float(np.median(diffs))
        metrics["motion_score"] = round(motion, 2)
        if motion < limits.min_motion:
            reasons.append("The video looks like a still image or a frozen frame. Record the drill live.")

        # ---- is there a person? (skipped when the video is already static, to save time) ----
        if motion >= limits.min_motion:
            det = detector or get_detector()
            hits = sum(1 for f in frames_for_person if det.has_person(f))
            ratio = hits / max(1, len(frames_for_person))
            metrics.update(person_detector=det.name, person_frames_ratio=round(ratio, 2))
            if ratio < limits.min_person_ratio:
                reasons.append("No person could be seen in the video. Keep your whole body in frame.")
    finally:
        cap.release()

    return CheckResult(valid=not reasons, reasons=reasons, metrics=metrics)
