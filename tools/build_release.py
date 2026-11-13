"""Create a HACS-compatible manual installation ZIP, without local data."""

import hashlib
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

ROOT = Path(__file__).resolve().parents[1]
VERSION = "0.1.0b1"


def build():
    output = ROOT / "dist" / f"euskalmet-local-{VERSION}.zip"
    output.parent.mkdir(exist_ok=True)
    with ZipFile(output, "w", ZIP_DEFLATED) as archive:
        for path in sorted((ROOT / "custom_components" / "euskalmet_local").rglob("*")):
            if (
                path.is_file()
                and "__pycache__" not in path.parts
                and path.suffix != ".pyc"
            ):
                assert path.suffix not in {".pem", ".key"}
                archive.write(path, path.relative_to(ROOT).as_posix())
        for name in ("LICENSE", "THIRD_PARTY_NOTICES.md", "README.md"):
            archive.write(ROOT / name, name)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix(".zip.sha256").write_text(f"{digest}  {output.name}\n")
    print(f"{output.name}: {digest}")


if __name__ == "__main__":
    build()
