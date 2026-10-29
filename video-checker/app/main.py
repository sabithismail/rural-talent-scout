"""HTTP interface: POST a video, get a verdict. Handy for testing and for the website to call directly."""
import os
import tempfile

from fastapi import FastAPI, File, Form, UploadFile

from .checks import Limits, check_video, sha256_file

app = FastAPI(title="Rural Talent Scout video checker")
MAX_UPLOAD_BYTES = 60 * 1024 * 1024


@app.get("/health")
def health():
    return {"status": "ok", "service": "video-checker", "language": "Python"}


@app.post("/check")
async def check(file: UploadFile = File(...), max_seconds: float = Form(60.0)):
    suffix = os.path.splitext(file.filename or "")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        size = 0
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                tmp.close()
                os.unlink(tmp.name)
                return {"valid": False, "reasons": ["The file is larger than 60 MB."], "metrics": {}}
            tmp.write(chunk)
        path = tmp.name
    try:
        result = check_video(path, Limits(max_seconds=max_seconds))
        return {"valid": result.valid, "reasons": result.reasons, "metrics": result.metrics, "sha256": sha256_file(path)}
    finally:
        os.unlink(path)
