#!/usr/bin/env python3
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent

COLORS = {"backend": "\033[36m", "frontend": "\033[35m", "nlp": "\033[33m"}
RESET = "\033[0m"


def nlp_python(nlp_dir):
    """Uses the NLP service's venv interpreter if it exists (see dependencies.py), else falls back to this one."""
    venv_dir = nlp_dir / ".venv"
    python = venv_dir / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    return str(python) if python.exists() else sys.executable


def stream_output(name, proc):
    color = COLORS.get(name, "")
    for line in proc.stdout:
        print(f"{color}[{name}]{RESET} {line}", end="")


def start(name, cmd, cwd):
    proc = subprocess.Popen(
        cmd, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1
    )
    threading.Thread(target=stream_output, args=(name, proc), daemon=True).start()
    return proc


def main():
    npm = shutil.which("npm")
    if not npm:
        print("npm not found on PATH")
        sys.exit(1)

    backend_dir = ROOT_DIR / "backend"
    frontend_dir = ROOT_DIR / "frontend"
    nlp_dir = ROOT_DIR / "nlp_service"

    procs = {
        "backend": start("backend", [npm, "run", "dev"], cwd=backend_dir),
        "frontend": start("frontend", [npm, "run", "dev"], cwd=frontend_dir),
        "nlp": start("nlp", [nlp_python(nlp_dir), "-m", "uvicorn", "main:app", "--port", "8000"], cwd=nlp_dir),
    }

    print("Starting backend, frontend, and NLP service -- press Ctrl+C to stop.\n")

    try:
        while all(p.poll() is None for p in procs.values()):
            time.sleep(0.5)
        exited = [name for name, p in procs.items() if p.poll() is not None]
        print(f"\n{', '.join(exited)} exited unexpectedly -- stopping the rest.")
    except KeyboardInterrupt:
        print("\nStopping all services...")
    finally:
        for p in procs.values():
            if p.poll() is None:
                p.terminate()
        for p in procs.values():
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()


if __name__ == "__main__":
    main()
