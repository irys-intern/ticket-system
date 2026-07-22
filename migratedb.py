#!/usr/bin/env python3
import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent


def main():
    npx = shutil.which("npx")
    if not npx:
        print("npx not found on PATH")
        sys.exit(1)

    backend_dir = ROOT_DIR / "backend"
    print("Applying database migrations...")
    subprocess.run([npx, "drizzle-kit", "migrate"], cwd=backend_dir, check=True)


if __name__ == "__main__":
    main()
