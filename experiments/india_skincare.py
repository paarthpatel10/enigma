"""Frozen neutral prompts; eligibility references are not supplied to the model."""
# ruff: noqa: E501 -- Keep frozen prompt strings directly comparable with the protocol.

from src.domain.research import ExperimentDefinition

EXPERIMENT = ExperimentDefinition(
    id="india-skincare",
    name="India skincare pilot",
    category="Facial moisturizers under INR 1,000",
    brands=["Minimalist", "Simple", "Dot & Key"],
    research_metadata={
        "reference_check_date": "2026-09-14",
        "eligibility_status": "approved_with_stock_limitation",
        "approval_note": "User approved tracking Simple despite official-store stock limitation on 2026-09-14. Brand mentions are not purchase eligibility or product endorsements.",
        "references_are_model_sources": False,
        "references": [
            {
                "brand": "Minimalist",
                "product": "Marula Oil 5% Face Moisturizer",
                "mrp_inr": 299,
                "url": "https://beminimalist.co/products/marula-05-moisturizer",
                "availability": "add_to_cart_shown; delivery_not_checked",
            },
            {
                "brand": "Simple",
                "product": "Replenishing Rich Moisturiser 125ml",
                "mrp_inr": 499,
                "url": "https://www.simpleskincare.in/products/replenishing-rich-moisturiser-with-glycerin-pro-vit-b5-125ml",
                "availability": "sold_out_on_official_site",
            },
            {
                "brand": "Dot & Key",
                "product": "Barrier Repair Moisturizer",
                "pack": "100g",
                "mrp_inr": 395,
                "url": "https://www.dotandkey.com/collections/face-moisturizer-day-cream",
                "availability": "100g_available_on_official_collection; delivery_not_checked",
            },
        ],
    },
    repeats=3,
    models=["gemini-3.1-flash-lite"],
    mode="live-ungrounded",
    geography="India (prompt context only)",
    persona="Adult cosmetic shopper; dry, sensitive skin",
    prompts=[
        "For an adult consumer in India with dry, sensitive skin, which facial moisturizers would you shortlist under INR 1,000 per pack? Give up to three products and briefly explain your choices. State uncertainty about current price or availability. This is a cosmetic shopping question, not treatment.",
        "Suggest up to three facial moisturizers costing less than INR 1,000 per pack for an adult with dry, sensitive skin shopping in India. Briefly explain each choice and flag uncertain prices or availability. Do not diagnose or prescribe treatment.",
        "An adult shopper in India wants a facial moisturizer for dry, sensitive skin and has a budget below INR 1,000 per pack. What shortlist of up to three products would you suggest, and why? Flag uncertain price or availability; keep the answer to cosmetic shopping, not medical treatment.",
        "Help an adult consumer choose among up to three facial moisturizers sold in India for dry, sensitive skin, each below INR 1,000 per pack. Explain your shortlist briefly and acknowledge uncertain current pricing or availability. Do not provide diagnosis or treatment advice.",
        "What would be your shortlist of up to three facial moisturizers for an adult with dry, sensitive skin in India, costing under INR 1,000 per pack? Give brief reasons and identify price or availability uncertainty. Limit the answer to cosmetic product selection, not treatment.",
        "For cosmetic shopping in India, name up to three facial moisturizers an adult with dry, sensitive skin could consider below INR 1,000 per pack. Explain the choices briefly, flag uncertain price or availability, and avoid diagnosis or treatment recommendations.",
    ],
)
