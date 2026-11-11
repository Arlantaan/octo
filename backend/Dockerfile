FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app

# Everything the app writes lives in /data, a named volume, so leads, the spend ledgers and the
# voice ledger survive every rebuild and redeploy.
ENV DATABASE_URL=sqlite:////data/contact_messages.db \
    AI_LEDGER_PATH=/data/ai_usage.json \
    MUSE_LEDGER_PATH=/data/muse_usage.json \
    VOICE_LEDGER_PATH=/data/voice_usage.json \
    AI_TRUST_PROXY=true

# Run as an unprivileged user
RUN useradd --create-home --uid 10001 app && mkdir -p /data && chown app:app /data
USER app
VOLUME ["/data"]

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers", "--forwarded-allow-ips", "*"]
