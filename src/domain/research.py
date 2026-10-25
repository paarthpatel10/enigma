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
    mode: str = "synthetic-replay"
    research_metadata: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not re.fullmatch(r"[a-z0-9-]{1,64}", self.id):
            raise ValueError("Definition ID must use lowercase letters, numbers and hyphens")
        if not 1 <= self.repeats <= 20:
            raise ValueError("Repeats must be between 1 and 20")
        if not 2 <= len(self.brands) <= 5 or len(set(self.brands)) != len(self.brands):
            raise ValueError("Use 2 to 5 unique brands")
        if not self.prompts or len(self.prompts) > 12 or any(not p.strip() for p in self.prompts):
            raise ValueError("Use 1 to 12 nonempty prompts")
        if self.mode == "live-ungrounded":
            if self.models != ["gemini-3.1-flash-lite"] or self.repeats != 3:
                raise ValueError("Live pilot requires the fixed Gemini model and three repeats")
        elif self.mode != "synthetic-replay" or self.models != ["fixture-a", "fixture-b"]:
            raise ValueError("Only synthetic fixture targets are available in this prototype")

    def snapshot(self) -> dict[str, Any]:
        return {
            **asdict(self),
            "surface": self.mode,
            "settings": {"seed": 42}
            if self.mode == "synthetic-replay"
            else {"temperature": 1, "maxOutputTokens": 1024, "tools": [], "pacing_seconds": 10},
            "schema_version": "1.0",
            "metric_version": "live-descriptive-1.0" if self.mode == "live-ungrounded" else "1.0",
            "extractor_version": "live-context-1.0" if self.mode == "live-ungrounded" else "1.0",
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


def extract_live(text: str) -> dict[str, Any]:
    # Conservative lexical context, explicitly provisional until human review.
    patterns = {
        "Minimalist": (
            r"\bminimalist\s+" r"(?:marula|vitamin|ceramide|moisturi[sz]er|b12|sepicalm|brand)\b"
        ),
        "Simple": (
            r"\bsimple\s+"
            r"(?:kind\s+to\s+skin|replenishing|rich|hydrating|repair|moisturi[sz]er|brand)\b"
        ),
        "Dot & Key": r"\bdot\s*(?:&|and)\s*key\b",
    }
    clean = text.replace("**", "").replace("®", "")
    return {
        "mentions": [
            brand for brand, pattern in patterns.items() if re.search(pattern, clean, re.I)
        ],
        "recommendations": {},
        "citations": list(dict.fromkeys(re.findall(r"https?://[^\s<>]+", text))),
    }


def summarize(runs: list[dict[str, Any]], brands: list[str]) -> dict[str, Any]:
    live = any(r.get("synthetic") is False for r in runs)
    good = [r for r in runs if r["status"] == "succeeded"]
    parsed = [
        (r, extract_live(r["raw_text"]) if live else extract(r["raw_text"], brands)) for r in good
    ]
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
                "interval": None if live else wilson(count, len(group)),
            }
        rows.append(
            {
                "brand": brand,
                "mentions": n,
                "total": len(good),
                "probability": n / len(good) if good else None,
                "interval": None if live else wilson(n, len(good)),
                "recommendations": None if live else recommended,
                "by_model": by_model,
            }
        )
    return {
        "successful": len(good),
        "failed": sum(r["status"] == "failed" for r in runs),
        "excluded": sum(r["status"] == "excluded" for r in runs),
        "per_prompt": {
            variant: {
                "eligible": sum(r.get("prompt_variant") == variant for r in good),
                "mentions": {
                    brand: sum(
                        r.get("prompt_variant") == variant and brand in e["mentions"]
                        for r, e in parsed
                    )
                    for brand in brands
                },
            }
            for variant in sorted({str(r.get("prompt_variant", "unknown")) for r in runs})
        },
        "responses_with_citations": sum(bool(e["citations"]) for _, e in parsed),
        "brands": rows,
        "metric_version": "live-descriptive-1.0" if live else "1.0",
    }
