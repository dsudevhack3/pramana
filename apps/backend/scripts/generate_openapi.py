"""Dumps the FastAPI-generated OpenAPI schema to docs/api/openapi.yaml — run in CI to keep docs in sync."""
import json
from pathlib import Path

import yaml

from src.app_factory import create_app

OUTPUT_PATH = Path(__file__).parent.parent.parent.parent / "docs" / "api" / "openapi.yaml"


def main() -> None:
    app = create_app()
    schema = app.openapi()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(yaml.dump(json.loads(json.dumps(schema)), sort_keys=False))
    print(f"OpenAPI schema written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()