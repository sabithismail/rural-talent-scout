FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi "uvicorn[standard]" python-multipart opencv-python-headless numpy httpx
COPY app ./app
EXPOSE 8000
# API:    uvicorn app.main:app --host 0.0.0.0 --port 8000
# Worker: python -m app.worker   (needs SUPABASE_URL and SUPABASE_SERVICE_KEY)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
