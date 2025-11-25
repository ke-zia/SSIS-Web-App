"""Main application entry point.

Serves both the backend Flask app and the frontend (Vite) build from a single process.
If the frontend build is missing this script will attempt to run:
  npm ci && npm run build
inside the frontend/ directory. Set SKIP_FRONTEND_BUILD=1 to skip the build step.
"""

import os
import sys
import subprocess
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"Loaded environment from: {env_path}")
else:
    print("No .env file found. Using default/OS environment variables.")

from app import create_app
from flask import send_from_directory, abort

app = create_app()

# ---------- Frontend build & static serving setup ----------
# Paths (this file lives in backend/, frontend is sibling)
THIS_DIR = os.path.dirname(__file__)
REPO_ROOT = os.path.normpath(os.path.join(THIS_DIR, ".."))
FRONTEND_DIR = os.path.join(REPO_ROOT, "frontend")
# Vite default build output is "dist"
FRONTEND_DIST = os.path.join(FRONTEND_DIR, "dist")

def build_frontend():
    """Run npm ci && npm run build inside frontend dir. Raises SystemExit on failure."""
    # Allow skipping build (useful in CI or when dist is already present)
    if os.environ.get("SKIP_FRONTEND_BUILD", "0") == "1":
        print("SKIP_FRONTEND_BUILD=1 -- skipping frontend build step.")
        return

    if not os.path.exists(FRONTEND_DIR):
        print(f"Frontend directory not found at: {FRONTEND_DIR}. Skipping build.")
        return

    print("Frontend build not found — running npm ci && npm run build ...")
    # First install dependencies
    try:
        r = subprocess.run(["npm", "ci"], cwd=FRONTEND_DIR, check=True)
    except FileNotFoundError:
        print("npm not found. Please install Node.js and npm to build the frontend.")
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        print(f"npm ci failed with exit code {e.returncode}")
        sys.exit(e.returncode)

    # Then build
    try:
        r = subprocess.run(["npm", "run", "build"], cwd=FRONTEND_DIR, check=True)
    except subprocess.CalledProcessError as e:
        print(f"npm run build failed with exit code {e.returncode}")
        sys.exit(e.returncode)

    if not os.path.exists(FRONTEND_DIST):
        print("Frontend build completed but dist directory not found.")
        sys.exit(1)

# Only build if the dist directory is missing
if not os.path.exists(FRONTEND_DIST):
    build_frontend()
else:
    print(f"Found frontend build at: {FRONTEND_DIST} — skipping build step.")

# Add routes to serve the SPA build (static assets + index.html fallback)
# This allows frontend + backend to be served by the same Flask process.
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path: str):
    """
    Serve a built frontend from frontend/dist.
    - If the requested file exists in dist, serve it.
    - Otherwise, serve dist/index.html so the SPA router can handle the route.
    """
    # normalized path to file in dist
    if path != "" and os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    index_path = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_path):
        return send_from_directory(FRONTEND_DIST, "index.html")
    # If we can't find an index.html (maybe frontend not present and build skipped),
    # return a helpful error.
    abort(404, description=(
        "Frontend build not found. Expected index.html at: "
        f"{index_path}. You can build the frontend by running `npm ci && npm run build` "
        f"in {FRONTEND_DIR}, or remove SKIP_FRONTEND_BUILD to allow this script to build it."
    ))

# ---------- Run server ----------
if __name__ == "__main__":
    # Use PORT env var if set, otherwise 5000
    port = int(os.environ.get("PORT", 5000))
    # By default keep debug on for local dev; in production set FLASK_ENV=production or set debug to False.
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(debug=debug, host="0.0.0.0", port=port)