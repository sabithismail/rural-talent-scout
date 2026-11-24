"""Smoke test for the pose model: builds a short clip from a photo with people and checks a pose is found.
Prints a GitHub annotation with the result. Run from video-checker/:  python scripts/pose_smoke.py"""
import glob
import os
import sys
import tempfile

import cv2

sys.path.insert(0, os.getcwd())
from app.pose import extract_landmarks  # noqa: E402

photos = sorted(glob.glob("../public/photos/*.jpg"))
if not photos:
    print("::notice title=pose smoke::no photos found")
    sys.exit(0)
out = []
for ph in photos[:3]:
    img = cv2.imread(ph)
    h, w = img.shape[:2]
    scale = 480 / h
    img = cv2.resize(img, (int(w * scale), 480))
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "clip.mp4")
        vw = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*"mp4v"), 12, (img.shape[1], img.shape[0]))
        for _ in range(24):
            vw.write(img)
        vw.release()
        frames = extract_landmarks(path)
    found = sum(1 for f in frames if f)
    out.append(f"{os.path.basename(ph)}: {found}/{len(frames)} frames with a pose")
print("::notice title=pose smoke::" + " | ".join(out))
