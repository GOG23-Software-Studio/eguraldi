"""Hourly risk boundaries, invalid data and local quiet hours."""

import importlib.util
from datetime import UTC, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

PATH = (
    Path(__file__).resolve().parents[1]
    / "custom_components/euskalmet_local/laundry_model.py"
)
spec = importlib.util.spec_from_file_location("laundry_model", PATH)
model = importlib.util.module_from_spec(spec)
spec.loader.exec_module(model)
NOW = datetime(2026, 11, 18, 10, 40, tzinfo=UTC)


def document(hour=11, **values):
    return {
        "at": NOW.isoformat(),
        "for": NOW.isoformat(),
        "trends": {
            "set": [
                {
                    "range": f"[{hour}:00..{hour + 1}:00)",
                    "precipitation": {"value": 0},
                    "windspeed": {"value": 2},
                    **values,
                }
            ]
        },
    }


def test_defaults_disabled_and_no_target():
    assert model.DEFAULTS["laundry_enabled"] is False
    assert model.DEFAULTS["laundry_target"] == ""


def test_lead_active_block_and_expired_block():
    options = {**model.DEFAULTS, "laundry_lead_minutes": 15}
    rain = {"precipitation": {"value": 1}}
    assert not model.risks(document(**rain), NOW, options)
    options["laundry_lead_minutes"] = 30
    assert model.risks(document(**rain), NOW, options)[0]["kinds"] == ["rain"]
    assert model.risks(document(10, **rain), NOW, options)
    assert not model.risks(document(9, **rain), NOW, options)


def test_wind_converts_provider_metres_per_second_and_respects_options():
    doc = document(windspeed={"value": 30 / 3.6})
    assert model.risks(doc, NOW, model.DEFAULTS)[0]["kinds"] == ["wind"]
    assert not model.risks(doc, NOW, {**model.DEFAULTS, "laundry_wind": False})
    doc = document(symbolSet={"weather": {"id": "16"}})
    assert model.risks(doc, NOW, model.DEFAULTS)
    assert not model.risks(doc, NOW, {**model.DEFAULTS, "laundry_rain": False})


def test_invalid_measurements_never_invent_rain_or_wind():
    for value in (None, "", True, -1, float("nan"), float("inf"), "unknown"):
        assert not model.risks(
            document(precipitation={"value": value}, windspeed={"value": value}),
            NOW,
            model.DEFAULTS,
        )
    for patch in (
        {"range": "broken"},
        {"_forecast_date": "bad"},
        {"range": "[25:00..26:00)"},
    ):
        assert not model.risks(
            document(precipitation={"value": 1}, **patch), NOW, model.DEFAULTS
        )


def test_forecast_date_and_freshness_are_mandatory():
    doc = document(precipitation={"value": 1}, _forecast_date="2026-11-19")
    assert not model.risks(doc, NOW, model.DEFAULTS)
    for at in (
        None,
        "bad",
        "2026-11-18T10:00:00",
        (NOW - timedelta(hours=13)).isoformat(),
        (NOW + timedelta(hours=1)).isoformat(),
    ):
        doc = document(precipitation={"value": 1})
        doc["at"] = at
        assert not model.risks(doc, NOW, model.DEFAULTS)


def test_quiet_hours_include_overnight_and_ha_timezone():
    local = NOW.astimezone(ZoneInfo("Europe/Paris"))
    assert model.allowed_time(local, "08:00:00", "22:00:00")
    assert not model.allowed_time(local, "22:00:00", "08:00:00")
    assert model.allowed_time(local.replace(hour=23), "22:00:00", "08:00:00")
    assert model.allowed_time(local, "08:00:00", "08:00:00")
    assert not model.allowed_time(
        local.replace(hour=22, minute=0), "08:00:00", "22:00:00"
    )


def test_notifications_use_natural_speech_and_the_users_locality():
    for kinds, risk in (
        (["rain"], "lluvia"),
        (["wind"], "viento fuerte"),
        (["wind", "rain"], "lluvia y viento fuerte"),
    ):
        verb = "Se esperan" if len(kinds) == 2 else "Se espera"
        assert model.notification_message("Bilbao", kinds) == (
            f"{verb} {risk} próximamente en Bilbao. "
            "Si tienes ropa tendida, conviene recogerla."
        )
    assert model.notification_message("Ortuella", ["rain"]) == (
        "Se espera lluvia próximamente en Ortuella. "
        "Si tienes ropa tendida, conviene recogerla."
    )
    for kinds, risk in (
        (["rain"], "euria"),
        (["wind"], "haize zakarra"),
        (["rain", "wind"], "euria eta haize zakarra"),
    ):
        assert model.notification_message("Durango", kinds, "eu-ES") == (
            f"Laster {risk} espero da Durango inguruan. "
            "Arropa kanpoan baduzu, jasotzea komeni da."
        )
