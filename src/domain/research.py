"""Versioned definitions and descriptive metrics; never infer causal influence."""

import math
import re
from dataclasses import asdict, dataclass, field
from typing import Any


@dataclass(frozen=True)
class ExperimentDefinition:
    id: str
    name: str
    category: str
    brands: list[str]
    prompts: list[str]
    repeats: int = 10
    models: list[str] = field(default_factory=lambda: ["fixture-a", "fixture-b"])
    geography: str = "US English (prompt context only)"
    persona: str = "Small-team buyer"
    version: str = "1.0"

    def __post_init__(self) -> None:
        if not re.fullmatch(r"[a-z0-9-]{1,64}", self.id):
            raise ValueError("Definition ID must use lowercase letters, numbers and hyphens")
        if not 1 <= self.repeats <= 20:
            raise ValueError("Repeats must be between 1 and 20")
        if not 2 <= len(self.brands) <= 5 or len(set(self.brands)) != len(self.brands):
            raise ValueError("Use 2 to 5 unique brands")
        if not self.prompts or len(self.prompts) > 12 or any(not p.strip() for p in self.prompts):
            raise ValueError("Use 1 to 12 nonempty prompts")
        if self.models != ["fixture-a", "fixture-b"]:
            raise ValueError("Only synthetic fixture targets are available in this prototype")

    def snapshot(self) -> dict[str, Any]:
        return {
            **asdict(self),
            "surface": "synthetic-replay",
            "settings": {"seed": 42},
            "schema_version": "1.0",
            "metric_version": "1.0",
            "extractor_version": "1.0",
        }


def extract(text: str, brands: list[str]) -> dict[str, Any]:
    mentions = [
        brand
        for brand in brands
        if re.search(rf"(?<!\w){re.escape(brand)}(?!\w)", text, re.IGNORECASE)
    ]
    recommendations = {}
    for line in text.splitlines():
        match = re.match(r"^\s*(\d+)\.\s+(.+)$", line)
        if match:
            for brand in mentions:
                if re.match(rf"{re.escape(brand)}(?!\w)", match[2], re.IGNORECASE):
                    recommendations[brand] = int(match[1])
    citations = list(dict.fromkeys(re.findall(r"https?://[^\s<>]+", text)))
    return {"mentions": mentions, "recommendations": recommendations, "citations": citations}


def wilson(successes: int, total: int) -> list[float] | None:
    """95% Wilson binomial interval; null for no eligible observations."""
    if not total:
        return None
    z = 1.959963984540054
    p = successes / total
    denominator = 1 + z * z / total
    center = (p + z * z / (2 * total)) / denominator
    radius = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / denominator
    return [max(0, center - radius), min(1, center + radius)]


def summarize(runs: list[dict[str, Any]], brands: list[str]) -> dict[str, Any]:
    good = [r for r in runs if r["status"] == "succeeded"]
    parsed = [(r, extract(r["raw_text"], brands)) for r in good]
    rows = []
    for brand in brands:
        n = sum(brand in e["mentions"] for _, e in parsed)
        recommended = sum(brand in e["recommendations"] for _, e in parsed)
        by_model = {}
        for model in sorted({r["model"] for r in runs}):
            group = [e for r, e in parsed if r["model"] == model]
            count = sum(brand in e["mentions"] for e in group)
            by_model[model] = {
                "count": count,
                "total": len(group),
                "probability": count / len(group) if group else None,
                "interval": wilson(count, len(group)),
            }
        rows.append(
            {
                "brand": brand,
                "mentions": n,
                "total": len(good),
                "probability": n / len(good) if good else None,
                "interval": wilson(n, len(good)),
                "recommendations": recommended,
                "by_model": by_model,
            }
        )
    return {
        "successful": len(good),
        "failed": len(runs) - len(good),
        "responses_with_citations": sum(bool(e["citations"]) for _, e in parsed),
        "brands": rows,
        "metric_version": "1.0",
    }
