import sys
from pathlib import Path

# Ensure repo root and backend directory are in sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"
backend_app_dir = backend_dir / "app"

for p in [str(root_dir), str(backend_dir), str(backend_app_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.main import app, health_check

__all__ = ["app", "health_check"]
