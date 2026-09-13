from src.domain.research import ExperimentDefinition

EXPERIMENT = ExperimentDefinition(
    id="project-tools",
    name="Project management landscape",
    category="Project management",
    brands=["Notion", "Asana", "Linear", "Monday"],
    prompts=[
        "Which project management tools would you recommend for a small team?",
        "Compare project management tools for a growing startup.",
        "What should a remote team consider when choosing a project tool?",
        "Recommend tools for planning a software team's weekly work.",
        "Which tools combine documentation and project management?",
        "Help a small team shortlist project management software.",
    ],
    repeats=10,
)
