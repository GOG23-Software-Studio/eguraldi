"""Check the actual distributable, including attribution and credential exclusion."""

import hashlib
import importlib.util
import json
from pathlib import Path
from zipfile import ZipFile

import pytest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "release_builder", ROOT / "tools/build_release.py"
)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


def test_public_package(tmp_path):
    output = builder.build(tmp_path)
    version = json.loads(
        (ROOT / "custom_components/euskalmet_local/manifest.json").read_text()
    )["version"]
    assert output.name == f"eguraldi-{version}.zip"
    assert (
        output.with_suffix(".zip.sha256").read_text().split()[0]
        == hashlib.sha256(output.read_bytes()).hexdigest()
    )
    with ZipFile(output) as archive:
        names = archive.namelist()
        for name in (
            "manifest.json",
            "LICENSE",
            "THIRD_PARTY_NOTICES.md",
            "brand/icon.png",
            "data/municipalities.jsonl.gz",
            "frontend/euskalmet-local-card.js",
        ):
            assert "custom_components/euskalmet_local/" + name in names
        for name in ("LICENSE", "THIRD_PARTY_NOTICES.md"):
            assert archive.read(name) == archive.read(
                "custom_components/euskalmet_local/" + name
            )
        assert all(
            "__pycache__" not in name and not name.endswith((".pem", ".key", ".pyc"))
            for name in names
        )


def test_credentials_prevent_packaging(tmp_path, monkeypatch):
    component = tmp_path / "custom_components/euskalmet_local"
    component.mkdir(parents=True)
    (component / "manifest.json").write_text('{"version":"0.0.0"}')
    (component / "privatekey.pem").write_text("TEST ONLY")
    monkeypatch.setattr(builder, "ROOT", tmp_path)
    with pytest.raises(ValueError, match="Credential files"):
        builder.build(tmp_path / "output")
    assert not (tmp_path / "output").exists()
