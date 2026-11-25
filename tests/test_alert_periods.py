"""Official alert headings, not a generated interpretation of their body."""

import importlib.util
from datetime import datetime
from pathlib import Path

spec = importlib.util.spec_from_file_location(
    "alert_periods",
    Path(__file__).parents[1] / "custom_components/euskalmet_local/alert_periods.py",
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
parse = module.alert_period


def test_individual_level_and_midnight_follow_the_official_local_day():
    result = parse(
        "- Aviso Amarillo por viento desde las 12 hasta las 24 hora local. "
        "Rachas de 100 km/h.",
        "2026-11-24T23:00:00Z",
    )
    assert result["level"] == "yellow"
    assert result["starts_at"] == "2026-11-25T12:00:00+01:00"
    assert result["ends_at"] == "2026-11-26T00:00:00+01:00"


def test_body_times_and_unverified_headings_do_not_create_a_period():
    for heading in [
        "Alerta Naranja por lluvia. Desde las 09 hasta las 24 hora local.",
        "Alerta Naranja desde las 24 hasta las 09 hora local.",
        "Alerta Naranja desde las 18 hasta las 09 hora local.",
        "Alerta Naranja desde las 12 hasta las 24:30 hora local.",
        "Alerta Naranja desde las 12:70 hasta las 18 hora local.",
    ]:
        assert parse(heading, "2026-11-24T23:00:00Z")["starts_at"] is None
    assert parse("Un aviso rojo en el cuerpo", "invalid")["level"] is None
    assert parse("Aviso Amarillo", "2026-11-25")["starts_at"] is None


def test_next_day_rain_and_dst_are_calendar_based():
    rain = parse(
        "Alerta Naranja por lluvia desde las 00 hasta las 09 hora local.",
        "2026-11-25T23:00:00Z",
    )
    assert rain["starts_at"] == "2026-11-26T00:00:00+01:00"
    dst = parse(
        "Aviso Amarillo desde las 00 hasta las 24 hora local.",
        "2026-03-28T23:00:00Z",
    )
    start = datetime.fromisoformat(dst["starts_at"])
    end = datetime.fromisoformat(dst["ends_at"])
    assert (end - start).total_seconds() == 23 * 3600
