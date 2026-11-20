from app.notify import build


def test_scored_in_english():
    subject, body = build({"kind": "scored", "lang": "en", "full_name": "Asha Rao", "sport": "Kabaddi", "score": 84.6}, "https://x.test")
    assert subject == "Your video was scored"
    assert "Hello Asha" in body and "85/100" in body and "https://x.test/me" in body


def test_language_falls_back_to_english():
    subject, _ = build({"kind": "shortlisted", "lang": "fr", "full_name": "A"}, "https://x.test")
    assert subject == "A scout shortlisted you"


def test_unknown_kind_and_long_name():
    assert build({"kind": "nope"}) is None
    _, body = build({"kind": "rejected", "full_name": "A" * 300, "sport": "Kho kho"}, "https://x.test")
    assert len(body) < 300
