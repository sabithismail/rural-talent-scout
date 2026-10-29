"""Tests use synthetic clips written with OpenCV, so no real footage is needed."""
import os

import cv2
import numpy as np
import pytest

from app.checks import Limits, check_video, sha256_file


def make_video(path, frame_fn, seconds=6, fps=15, size=(640, 480)):
    w, h = size
    writer = cv2.VideoWriter(path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
    assert writer.isOpened(), "OpenCV could not open a video writer in this environment"
    for i in range(int(seconds * fps)):
        writer.write(frame_fn(i, w, h))
    writer.release()
    return path


def static_frame(i, w, h):
    return np.full((h, w, 3), (200, 170, 120), np.uint8)


def moving_box(i, w, h):
    f = np.full((h, w, 3), (210, 190, 160), np.uint8)
    x = int((i * 9) % (w - 80))
    cv2.rectangle(f, (x, 160), (x + 80, 320), (30, 120, 200), -1)
    return f


def test_static_video_is_rejected_as_a_still_image(tmp_path):
    p = make_video(str(tmp_path / "static.mp4"), static_frame)
    r = check_video(p)
    assert not r.valid
    assert any("still image" in x for x in r.reasons)


def test_moving_object_without_a_person_is_rejected(tmp_path):
    p = make_video(str(tmp_path / "box.mp4"), moving_box)
    r = check_video(p)
    assert not r.valid
    assert any("No person" in x for x in r.reasons)
    assert r.metrics["motion_score"] > 0.5  # it does move; the problem is that nobody is in it


def test_too_short_clip_is_rejected(tmp_path):
    p = make_video(str(tmp_path / "short.mp4"), moving_box, seconds=1)
    r = check_video(p)
    assert not r.valid
    assert any("long" in x for x in r.reasons)


def test_clip_longer_than_the_drill_allows_is_rejected(tmp_path):
    p = make_video(str(tmp_path / "long.mp4"), moving_box, seconds=15)
    r = check_video(p, Limits(max_seconds=10))
    assert any("at most 10s" in x for x in r.reasons)


def test_low_resolution_is_rejected(tmp_path):
    p = make_video(str(tmp_path / "tiny.mp4"), moving_box, size=(160, 120))
    r = check_video(p)
    assert any("resolution" in x for x in r.reasons)


def test_a_file_that_is_not_a_video_is_rejected(tmp_path):
    p = tmp_path / "fake.mp4"
    p.write_bytes(b"this is not a video at all" * 100)
    r = check_video(str(p))
    assert not r.valid and r.reasons


def test_sha256_is_stable_and_differs_between_files(tmp_path):
    a = make_video(str(tmp_path / "a.mp4"), moving_box)
    b = make_video(str(tmp_path / "b.mp4"), static_frame)
    assert sha256_file(a) == sha256_file(a)
    assert sha256_file(a) != sha256_file(b)


def test_a_person_moving_in_frame_is_accepted(tmp_path):
    """Positive path: pans and zooms a bundled test photograph of a person (never shipped with the app)."""
    data = pytest.importorskip("skimage.data")
    img = cv2.cvtColor(data.astronaut(), cv2.COLOR_RGB2BGR)  # 512x512

    def person_frame(i, w, h):
        zoom = 1.0 + 0.15 * np.sin(i / 8.0)
        dx = int(20 * np.sin(i / 5.0))
        M = np.float32([[zoom, 0, (1 - zoom) * w / 2 + dx], [0, zoom, (1 - zoom) * h / 2]])
        return cv2.warpAffine(cv2.resize(img, (w, h)), M, (w, h), borderMode=cv2.BORDER_REPLICATE)

    p = make_video(str(tmp_path / "person.mp4"), person_frame, seconds=6, size=(480, 480))
    r = check_video(p)
    assert r.metrics.get("person_frames_ratio", 0) >= 0.3, r
    assert r.valid, r.reasons
