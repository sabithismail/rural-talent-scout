from app.retention import below_target, is_protected, order_for_cleanup, should_clean

GB = 1024**3


def test_threshold():
    assert not should_clean(699, 1000)
    assert should_clean(700, 1000)
    assert below_target(599, 1000)
    assert not below_target(600, 1000)


def test_high_scores_are_protected():
    assert is_protected({"status": "scored", "score": 70})
    assert not is_protected({"status": "scored", "score": 69.9})
    assert not is_protected({"status": "rejected", "score": None})


def test_cleanup_order_rejected_first_then_oldest():
    rows = [
        {"id": "a", "status": "scored", "score": 40, "created_at": "2026-01-02"},
        {"id": "b", "status": "scored", "score": 90, "created_at": "2026-01-01"},
        {"id": "c", "status": "rejected", "created_at": "2026-01-05"},
        {"id": "d", "status": "scored", "score": 30, "created_at": "2026-01-01"},
        {"id": "e", "status": "scored", "score": 10, "created_at": "2026-01-01", "video_deleted_at": "x"},
    ]
    assert [r["id"] for r in order_for_cleanup(rows)] == ["c", "d", "a"]
