"""App entrypoint wrapper for uvicorn app.main:app compatibility."""
import sys
from pathlib import Path

# Ensure root and backend directories are in sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

for p in [str(root_dir), str(backend_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)
