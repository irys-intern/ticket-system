from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import os

MODEL_PATH = "./local_model"
MODEL_NAME = "facebook/bart-large-mnli"

if not os.path.exists(MODEL_PATH):
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    print("Local model not detected. Downloading...")
    AutoTokenizer.from_pretrained(MODEL_NAME).save_pretrained(MODEL_PATH)
    AutoModelForSequenceClassification.from_pretrained(MODEL_NAME).save_pretrained(MODEL_PATH)

print("Loading pipeline...")
classifier = pipeline(
    "zero-shot-classification",
    model=MODEL_PATH,
    tokenizer=MODEL_PATH,
    local_files_only=True,
)

CRITICAL_MIN_SCORE = 0.5

LABEL_TO_PRIORITY = {
    "Minor inconvenience with no immediate impact on core work. The issue may be cosmetic, a documentation gap, a small UI inconsistency, a low-risk request, or something that can be ignored or worked around easily. Examples: typos, layout quirks, nonblocking help requests, questions about a feature without a deadline. This should be treated as low priority.": "low",
    "A real problem that interferes with the user's productivity but does not stop them completely. The issue is frustrating or slows down normal workflows, causes confusion, or makes a feature unreliable, but a workaround exists that is reasonably usable. Examples: unexpected behavior in a feature, slow performance, partial functionality loss, poor error handling, unclear guidance. This should be treated as medium priority.": "medium",
    "One or multiple users are significantly blocked in a core workflow or essential task. The problem is causing meaningful disruption and, if there is a workaround, it is available only with difficulty, extra steps, or loss of important functionality. Examples: a major feature is broken, data cannot be accessed in an important workflow, reports fail to generate, integrations stop working, essential approvals are blocked. This should be treated as high priority.": "high",
    "A severe issue that risks data loss, security exposure, or major operational failure. The situation is urgent and may affect all users, critical systems, or compliance. Examples: system outage, data corruption, inability to log in, security breach, exposed credentials, service downtime affecting business operations. This should be treated as critical priority. BE SURE IF YOU ARE GOING TO LABEL ANYTHING CRITICAL THAT IT IS ACTUALLY CRITICAL.": "critical",
}
LABELS = list(LABEL_TO_PRIORITY.keys())

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


class SuggestRequest(BaseModel):
    text: str


@app.post("/suggest")
def suggest(req: SuggestRequest):
    if not req.text.strip():
        return {"priority": None, "score": 0.0}
    result = classifier(req.text, candidate_labels=LABELS)
    top_label = result["labels"][0]
    top_score = result["scores"][0]

    if LABEL_TO_PRIORITY[top_label] == "critical" and top_score < CRITICAL_MIN_SCORE:
        top_label = result["labels"][1]
        top_score = result["scores"][1]

    return {"priority": LABEL_TO_PRIORITY[top_label], "score": round(top_score, 3)}
