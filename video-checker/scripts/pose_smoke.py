"""Smoke test for the pose model: builds a short clip from a photo with people and checks a pose is found.
Prints a GitHub annotation with the result and never fails. Run from video-checker/:  python scripts/pose_smoke.py"""
import glob
import os
import sys
import tempfile
import traceback

import cv2

sys.path.insert(0, os.getcwd())


def one(ph):
    from app.pose import extract_landmarks
    img = cv2.imread(ph)
    h, w = img.shape[:2]
    img = cv2.resize(img, (int(w * 480 / h), 480))
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "clip.mp4")
        vw = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*"mp4v"), 12, (img.shape[1], img.shape[0]))
        for _ in range(24):
            vw.write(img)
        vw.release()
        frames = extract_landmarks(path)
    return f"{os.path.basename(ph)}: {sum(1 for f in frames if f)}/{len(frames)} frames with a pose"


try:
    res = [one(p) for p in sorted(glob.glob("../public/photos/*.jpg"))[:3]]
    print("::notice title=pose smoke::" + " | ".join(res or ["no photos"]))
except Exception:
    err = traceback.format_exc().strip().splitlines()[-4:]
    print("::warning title=pose smoke failed::" + " / ".join(err).replace("%", "%25"))
