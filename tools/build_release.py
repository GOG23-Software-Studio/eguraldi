"""Create a HACS-compatible manual installation ZIP, without local data."""

import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]


def build(output_dir: Path | None = None):
    component = ROOT / "custom_components" / "euskalmet_local"
    version = json.loads((component / "manifest.json").read_text())["version"]
    files = [
        path
        for path in sorted(component.rglob("*"))
        if path.is_file() and "__pycache__" not in path.parts and path.suffix != ".pyc"
    ]
    forbidden = [
        path.name
        for path in files
        if path.suffix.lower() in {".pem", ".key"} or path.name.startswith(".env")
    ]
    if forbidden:
        raise ValueError(f"Credential files cannot be packaged: {', '.join(forbidden)}")
    output = (output_dir or ROOT / "dist") / f"eguraldi-{version}.zip"
    output.parent.mkdir(exist_ok=True)
    with ZipFile(output, "w", ZIP_DEFLATED) as archive:
        for path in files:
            archive.write(path, path.relative_to(ROOT).as_posix())
        for name in ("LICENSE", "THIRD_PARTY_NOTICES.md", "README.md"):
            archive.write(ROOT / name, name)
        for name in (
            "INSTALLATION.md",
            "preview.jpg",
            "preview-mobile.jpg",
            "preview-editor.jpg",
        ):
            path = ROOT / "docs" / name
            if path.is_file():
                archive.write(path, f"docs/{name}")
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix(".zip.sha256").write_text(f"{digest}  {output.name}\n")
    print(f"{output.name}: {digest}")
    return output


if __name__ == "__main__":
    build()
