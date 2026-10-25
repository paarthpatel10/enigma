import pytest

from src.domain.research import ExperimentDefinition, extract, summarize, wilson


def test_brand_boundaries_and_numbered_recommendations():
    result = extract(
        "1. Notion is flexible.\n2. Asana tracks work. Notional is unrelated.",
        ["Notion", "Asana", "Linear"],
    )
    assert result["mentions"] == ["Notion", "Asana"]
    assert result["recommendations"] == {"Notion": 1, "Asana": 2}
    assert extract("Notional and linearity", ["Notion", "Linear"])["mentions"] == []


def test_failed_runs_are_excluded_from_mention_denominator():
    runs = [
        {"status": "succeeded", "raw_text": "1. Notion", "model": "fixture-a"},
        {"status": "succeeded", "raw_text": "No suitable tool", "model": "fixture-a"},
        {"status": "failed", "raw_text": "", "model": "fixture-a"},
    ]
    report = summarize(runs, ["Notion"])
    assert report["successful"] == 2
    assert report["failed"] == 1
    assert report["brands"][0]["mentions"] == 1
    assert report["brands"][0]["probability"] == 0.5


def test_empty_metrics_are_unknown_not_zero():
    report = summarize([], ["Notion"])
    assert report["brands"][0]["probability"] is None
    assert wilson(0, 0) is None


def test_wilson_interval_has_nonzero_width_at_extremes():
    low, high = wilson(0, 10)
    assert low == pytest.approx(0)
    assert 0.27 < high < 0.29


def test_definition_rejects_excessive_repeat_count():
    with pytest.raises(ValueError):
        ExperimentDefinition(
            id="test",
            name="Test",
            category="Tools",
            brands=["A", "B"],
            prompts=["Compare"],
            repeats=10001,
        )
