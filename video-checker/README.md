# Video checker (Python)

Checks that an uploaded clip is a real video: opens, sensible length, enough resolution and frame rate,
not a still image, and a person visible (OpenCV HOG). It does not measure the drill result.

    python -m venv .venv && . .venv/bin/activate
    pip install -r requirements.txt
    pytest                                  # 8 tests, synthetic clips
    uvicorn app.main:app --port 8000        # POST /check (multipart file)
    SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python -m app.worker --once

Worker flow: `pending` -> download -> check -> duplicate hash check -> `validated` or `rejected`.
The Java service then moves `validated` rows to `scored`.
