import math

from app.pose import cap_reported, count_cycles, estimate_from_landmarks, signal_value


def wave(n_reps, frames_per_rep=12, lo=70.0, hi=160.0, lead=6):
    out = [hi] * lead
    for _ in range(n_reps):
        out += [hi - (hi - lo) * (0.5 - 0.5 * math.cos(2 * math.pi * k / frames_per_rep)) for k in range(frames_per_rep)]
    return out + [hi] * lead


def test_counts_clean_reps():
    assert count_cycles(wave(10), 35) == 10
    assert count_cycles(wave(25, frames_per_rep=8), 35) == 25


def test_flat_or_tiny_movement_counts_zero():
    assert count_cycles([150.0] * 100, 35) == 0
    assert count_cycles(wave(10, lo=145, hi=160), 35) == 0
    assert count_cycles([1.0, 2.0], 35) == 0


def test_cap_only_lowers_confident_overclaims():
    assert cap_reported(60, 20, 0.9) == (30.0, True)       # 20*1.35+3 = 30
    assert cap_reported(28, 20, 0.9) == (28, False)         # within tolerance
    assert cap_reported(60, 2, 0.9) == (60, False)          # estimate too small to trust
    assert cap_reported(60, 20, 0.5) == (60, False)         # person seen in too few frames
    assert cap_reported(60, None, 0.9) == (60, False)


def _lm(elbow_deg):
    """Landmark list with a right arm bent at elbow_deg; everything else visible but static."""
    lm = [(0.5, 0.5, 1.0)] * 33
    lm = list(lm)
    sh, el = (0.5, 0.5), (0.6, 0.5)
    r = math.radians(elbow_deg)
    wr = (el[0] + 0.1 * math.cos(math.pi - r), el[1] - 0.1 * math.sin(math.pi - r))
    for i in (11, 12):
        lm[i] = (*sh, 1.0)
    for i in (13, 14):
        lm[i] = (*el, 1.0)
    for i in (15, 16):
        lm[i] = (*wr, 1.0)
    return lm


def test_push_up_signal_and_estimate_from_landmarks():
    straight, bent = signal_value("push-ups", _lm(170)), signal_value("push-ups", _lm(80))
    assert straight > 150 and bent < 100
    frames = [_lm(a) for a in wave(12)]
    info = estimate_from_landmarks("push-ups", frames)
    assert info["est"] == 12 and info["detected"] == 1.0


def test_missing_people_lower_detected_ratio():
    frames = [_lm(a) for a in wave(6)]
    frames = [None if i % 2 else f for i, f in enumerate(frames)]
    assert estimate_from_landmarks("push-ups", frames)["detected"] < 0.7
    assert estimate_from_landmarks("sprint", frames) is None
