"""Email notifications. Runs after scoring in the pipeline.

Sends one short email per new notification (video scored, video rejected, scout shortlisted you) to
players who have not turned emails off. Needs SMTP settings; without them it does nothing.

Env: SUPABASE_URL, SUPABASE_SERVICE_KEY, SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS, SMTP_FROM
Run:  python -m app.notify
"""
import os
import smtplib
import sys
from email.message import EmailMessage

import httpx

BASE = os.environ.get("SUPABASE_URL", "").rstrip("/")
KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
HEADERS = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}
SITE = os.environ.get("SITE_URL", "https://rural-talent-scout.vercel.app").rstrip("/")

TEXT = {
    "scored": {
        "en": ("Your video was scored", "Hello {name},\n\nYour {sport} video was scored: {score}/100.\nSee it here: {site}/me"),
        "hi": ("आपके वीडियो का स्कोर आ गया", "नमस्ते {name},\n\nआपके {sport} वीडियो का स्कोर {score}/100 है।\nयहाँ देखें: {site}/me"),
        "kn": ("ನಿಮ್ಮ ವೀಡಿಯೊ ಸ್ಕೋರ್ ಆಗಿದೆ", "ನಮಸ್ಕಾರ {name},\n\nನಿಮ್ಮ {sport} ವೀಡಿಯೊ ಸ್ಕೋರ್: {score}/100.\nಇಲ್ಲಿ ನೋಡಿ: {site}/me"),
    },
    "rejected": {
        "en": ("Your video could not be used", "Hello {name},\n\nYour {sport} video could not be used. Open the page to see why and try again: {site}/me"),
        "hi": ("आपका वीडियो इस्तेमाल नहीं हो सका", "नमस्ते {name},\n\nआपका {sport} वीडियो इस्तेमाल नहीं हो सका। कारण देखने और दोबारा कोशिश करने के लिए: {site}/me"),
        "kn": ("ನಿಮ್ಮ ವೀಡಿಯೊ ಬಳಸಲಾಗಲಿಲ್ಲ", "ನಮಸ್ಕಾರ {name},\n\nನಿಮ್ಮ {sport} ವೀಡಿಯೊ ಬಳಸಲಾಗಲಿಲ್ಲ. ಕಾರಣ ನೋಡಲು ಮತ್ತು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಲು: {site}/me"),
    },
    "shortlisted": {
        "en": ("A scout shortlisted you", "Hello {name},\n\nA verified scout shortlisted you on Rural Talent Scout. They may email you.\n{site}/me"),
        "hi": ("एक स्काउट ने आपको शॉर्टलिस्ट किया", "नमस्ते {name},\n\nRural Talent Scout पर एक सत्यापित स्काउट ने आपको शॉर्टलिस्ट किया है। वे आपको ईमेल कर सकते हैं।\n{site}/me"),
        "kn": ("ಒಬ್ಬ ಸ್ಕೌಟ್ ನಿಮ್ಮನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಿದ್ದಾರೆ", "ನಮಸ್ಕಾರ {name},\n\nRural Talent Scout ನಲ್ಲಿ ಪರಿಶೀಲಿತ ಸ್ಕೌಟ್ ನಿಮ್ಮನ್ನು ಶಾರ್ಟ್‌ಲಿಸ್ಟ್ ಮಾಡಿದ್ದಾರೆ. ಅವರು ನಿಮಗೆ ಇಮೇಲ್ ಮಾಡಬಹುದು.\n{site}/me"),
    },
}


def build(row: dict, site: str = SITE) -> tuple[str, str] | None:
    """(subject, body) for one notification row, or None if the kind is unknown."""
    by_lang = TEXT.get(row.get("kind", ""))
    if not by_lang:
        return None
    subject, body = by_lang.get(row.get("lang") or "en", by_lang["en"])
    first = (row.get("full_name") or "").split(" ")[0][:40] or "there"
    score = row.get("score")
    vals = {"name": first, "sport": row.get("sport") or "", "score": "" if score is None else str(round(float(score))), "site": site}
    return subject, body.format(**vals)


def send(msg: EmailMessage) -> None:
    host, port = os.environ["SMTP_HOST"], int(os.environ.get("SMTP_PORT", "587"))
    with smtplib.SMTP(host, port, timeout=30) as s:
        s.starttls()
        s.login(os.environ["SMTP_USER"], os.environ["SMTP_PASS"])
        s.send_message(msg)


def run() -> dict:
    if not BASE or not KEY:
        raise SystemExit("Set SUPABASE_URL and SUPABASE_SERVICE_KEY first.")
    if not all(os.environ.get(k) for k in ("SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM")):
        print("SMTP settings not set: skipping email notifications.")
        return {"sent": 0, "skipped": 0, "errors": 0, "configured": False}
    out = {"sent": 0, "skipped": 0, "errors": 0, "configured": True}
    with httpx.Client(timeout=60) as client:
        r = client.post(f"{BASE}/rest/v1/rpc/pending_email_notifications", json={}, headers=HEADERS)
        r.raise_for_status()
        done: list[str] = []
        for row in r.json():
            built = build(row) if row.get("wanted") else None
            if not built:
                out["skipped"] += 1
                done.append(row["id"])  # opted out or unknown kind: do not look at it again
                continue
            msg = EmailMessage()
            msg["Subject"], msg["From"], msg["To"] = built[0], os.environ["SMTP_FROM"], row["email"]
            msg.set_content(built[1])
            try:
                send(msg)
                out["sent"] += 1
                done.append(row["id"])
            except Exception as e:  # keep it for the next run
                out["errors"] += 1
                print(f"notification {row['id']}: {e}", file=sys.stderr)
        if done:
            client.post(f"{BASE}/rest/v1/rpc/mark_notifications_emailed", json={"p_ids": done}, headers=HEADERS).raise_for_status()
    return out


if __name__ == "__main__":
    print(run())
