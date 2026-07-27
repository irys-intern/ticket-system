#!/usr/bin/env python3
import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent


def check_version(name, cmd, min_version):
    """Verifies `cmd` is on PATH and its --version output meets the major version floor."""
    path = shutil.which(cmd)
    if not path:
        print(f"Missing dependency: {name} (looked for '{cmd}' on PATH)")
        return False

    # Grab the first x.y.z-looking token from --version output (format varies by tool).
    result = subprocess.run([path, "--version"], capture_output=True, text=True)
    match = re.search(r"\d+(\.\d+)*", result.stdout + result.stderr)
    version = match.group(0) if match else "0"
    major = int(version.split(".")[0])
    min_major = int(min_version.split(".")[0])

    if major < min_major:
        print(f"{name} {version} found, but {min_version}+ is required")
        return False

    print(f"{name} {version} OK")
    return True


def check_on_path(name, cmd):
    """Postgres/Redis are external services, not something this script installs --
    just confirm their CLI clients are reachable."""
    if shutil.which(cmd):
        print(f"{name} client OK")
        return True
    print(f"Missing dependency: {name} (looked for '{cmd}' on PATH)")
    return False


def setup_env(service_dir):
    """Copies .env.example to .env for a service, unless one already exists (never overwrite)."""
    env_file = service_dir / ".env"
    if env_file.exists():
        print(f"{env_file} already exists, skipping")
    else:
        shutil.copyfile(service_dir / ".env.example", env_file)
        print(f"Created {env_file} from .env.example -- fill in the required values")


def run(cmd, cwd):
    subprocess.run(cmd, cwd=cwd, shell=(sys.platform == "win32"), check=True)


def setup_venv(service_dir):
    """Creates a virtual environment for the service if one doesn't already exist,
    and returns the path to its pip executable."""
    venv_dir = service_dir / ".venv"
    if not venv_dir.exists():
        subprocess.run([sys.executable, "-m", "venv", str(venv_dir)], check=True)

    if sys.platform == "win32":
        return venv_dir / "Scripts" / "pip.exe"
    return venv_dir / "bin" / "pip"


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--skip-service-checks",
        action="store_true",
        help=(
            "Skip the psql/redis-cli PATH checks. Use this if Postgres and Redis "
            "are running in Docker containers rather than installed on the host "
            "-- the script has no way to verify a containerized service is "
            "actually up, so this just takes your word for it."
        ),
    )
    return parser.parse_args()


def main():
    args = parse_args()

    print("== Checking prerequisites ==")
    checks = [
        check_version("Node.js", "node", "20"),
        check_version("Python", "python3" if shutil.which("python3") else "python", "3.10"),
    ]

    if args.skip_service_checks:
        print("Skipping PostgreSQL/Redis client checks (--skip-service-checks)")
    else:
        checks.append(check_on_path("PostgreSQL", "psql"))
        checks.append(check_on_path("Redis", "redis-cli"))

    if not all(checks):
        print()
        print("One or more prerequisites are missing. Install them before continuing.")
        sys.exit(1)

    backend_dir = ROOT_DIR / "backend"
    frontend_dir = ROOT_DIR / "frontend"
    nlp_dir = ROOT_DIR / "nlp_service"

    print()
    print("== Backend ==")
    run(["npm", "install"], cwd=backend_dir)
    setup_env(backend_dir)

    print()
    print("== Frontend ==")
    run(["npm", "install"], cwd=frontend_dir)
    setup_env(frontend_dir)

    print()
    print("== NLP service ==")
    # No .env file for this service -- config lives directly in nlp_service/main.py.
    pip = setup_venv(nlp_dir)
    run([str(pip), "install", "-r", "requirements.txt"], cwd=nlp_dir)

    print()
    print("Done. See the README for env var details and how to run each service.")
    print("NLP service dependencies were installed in nlp_service/.venv -- activate it before running the service.")


if __name__ == "__main__":
    main()
