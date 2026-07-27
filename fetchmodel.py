#!/usr/bin/env python3
"""Pre-downloads the NLP service's zero-shot classification model.

nlp_service/main.py downloads the same model automatically on first start if
it's missing, so running this script is optional -- it just lets you fetch
the weights ahead of time (e.g. before an offline deploy) instead of paying
the download cost on the service's first request.
"""
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
NLP_DIR = ROOT_DIR / "nlp_service"
MODEL_PATH = NLP_DIR / "local_model"
MODEL_NAME = "facebook/bart-large-mnli"


def venv_python():
    venv_dir = NLP_DIR / ".venv"
    python = venv_dir / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    if not python.exists():
        print("nlp_service/.venv not found. Run `python3 dependencies.py` first.")
        sys.exit(1)
    return python


def main():
    if MODEL_PATH.exists():
        print(f"Model already present at {MODEL_PATH}")
        return

    python = venv_python()
    print(f"Downloading {MODEL_NAME} to {MODEL_PATH}...")
    download_code = (
        "from transformers import AutoTokenizer, AutoModelForSequenceClassification\n"
        f"AutoTokenizer.from_pretrained({MODEL_NAME!r}).save_pretrained({str(MODEL_PATH)!r})\n"
        f"AutoModelForSequenceClassification.from_pretrained({MODEL_NAME!r}).save_pretrained({str(MODEL_PATH)!r})\n"
    )
    subprocess.run([str(python), "-c", download_code], check=True)
    print("Done.")


if __name__ == "__main__":
    main()
