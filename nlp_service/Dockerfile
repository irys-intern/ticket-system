# syntax=docker/dockerfile:1

FROM python:3.11-slim
WORKDIR /app

COPY requirements.txt .

# Install the CPU-only torch build first -- the plain PyPI "torch" wheel
# pulls in CUDA libraries that are dead weight on a CPU-only host and add
# several GB to the image. requirements.txt still lists "torch" unpinned,
# so the second install is a no-op once it's already satisfied.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

COPY main.py .

# Bake the model into the image at build time so the container never needs
# network access to Hugging Face at runtime.
RUN python -c "\
from transformers import AutoTokenizer, AutoModelForSequenceClassification; \
AutoTokenizer.from_pretrained('facebook/bart-large-mnli').save_pretrained('./local_model'); \
AutoModelForSequenceClassification.from_pretrained('facebook/bart-large-mnli').save_pretrained('./local_model')"

EXPOSE 8000
ENV PORT=8000

# Shell form so $PORT expands -- lets platforms like Railway that inject
# their own PORT override the default via env var.
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT}
