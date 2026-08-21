import sys
from pathlib import Path

# Add backend and backend/app to sys.path
backend_dir = Path(__file__).resolve().parent
app_dir = backend_dir / "app"
root_dir = backend_dir.parent

for p in [str(root_dir), str(backend_dir), str(app_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from app.main import app, health_check
except ImportError:
    from backend.app.main import app, health_check

__all__ = ["app", "health_check"]
