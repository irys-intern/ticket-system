# syntax=docker/dockerfile:1
#
# Single-container build that runs all three app services (backend, frontend,
# nlp_service) plus a local Redis instance via start.sh. Postgres is NOT
# included here -- point DATABASE_URL at an external instance (e.g. Railway's
# managed Postgres plugin). Redis has no data worth persisting across
# restarts (sessions/cache), so running it in-container is fine.

FROM node:24-slim AS frontend-build
WORKDIR /frontend
ARG PUBLIC_BACKEND_URL=http://localhost:5172
ENV PUBLIC_BACKEND_URL=${PUBLIC_BACKEND_URL}
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM node:24-slim AS backend-build
WORKDIR /backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ .
RUN npm run build

FROM python:3.11-slim AS final
WORKDIR /app

# Node is needed alongside Python in this stage since backend/frontend are
# SvelteKit (Node) apps and nlp_service is FastAPI (Python). redis-server
# provides Redis locally instead of relying on an external instance.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl gnupg ca-certificates redis-server \
    && curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# ---- nlp_service ----
WORKDIR /app/nlp_service
COPY nlp_service/requirements.txt .
# CPU-only torch build -- the default PyPI wheel pulls in unneeded CUDA libs.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt
COPY nlp_service/main.py .
# Bake the model in at build time so the container needs no Hugging Face
# network access at runtime.
RUN python -c "\
from transformers import AutoTokenizer, AutoModelForSequenceClassification; \
AutoTokenizer.from_pretrained('facebook/bart-large-mnli').save_pretrained('./local_model'); \
AutoModelForSequenceClassification.from_pretrained('facebook/bart-large-mnli').save_pretrained('./local_model')"

# ---- backend ----
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /backend/build ./build
COPY --from=backend-build /backend/drizzle.config.ts ./drizzle.config.ts
COPY --from=backend-build /backend/src/db ./src/db
COPY --from=backend-build /backend/src/config ./src/config

# ---- frontend ----
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=frontend-build /frontend/build ./build

WORKDIR /app
COPY start.sh .
RUN chmod +x start.sh

ENV NODE_ENV=production
ENV NLP_PORT=8000
ENV BACKEND_PORT=5172
# Railway (and similar PaaS) inject PORT for the service's primary public
# port -- the frontend is what that should point at.
ENV PORT=5173
ENV REDIS_URL=redis://localhost:6379

EXPOSE 5173 5172 8000

CMD ["./start.sh"]
