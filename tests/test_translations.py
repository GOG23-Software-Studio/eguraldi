"""Keep HA translation keys and substitution tokens aligned."""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def leaves(value, prefix=""):
    result = {}
    for key, item in value.items():
        path = prefix + "." + key
        if isinstance(item, dict):
            result.update(leaves(item, path))
        else:
            result[path] = item
    return result


def test_basque_keys_and_placeholders():
    directory = ROOT / "custom_components/euskalmet_local/translations"
    es = leaves(json.loads((directory / "es.json").read_text(encoding="utf-8")))
    eu = leaves(json.loads((directory / "eu.json").read_text(encoding="utf-8")))
    assert es.keys() == eu.keys()
    for key, text in es.items():
        assert set(re.findall(r"\{\w+\}", text)) == set(
            re.findall(r"\{\w+\}", eu[key])
        ), key
    assert eu[".config.step.locality.title"] == "Zure herria"
    assert eu[".options.step.station.title"] == "Behaketa-estazioa"
