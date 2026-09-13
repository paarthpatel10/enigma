# Plugin and skill plan

Status: **Provisional**

## Principle

Add a plugin only when Enigma needs an external account, service, or dataset that
the local repository and built-in tools cannot provide. Add a skill only when it
encodes a repeatable, project-specific workflow or constraint.

## Current decision

No external plugin is required for the discovery/specification milestone.
Installing multiple integrations now would create permissions and dependencies
before the stack and data sources are chosen.

The local Git and SSH setup already supports source control. A GitHub plugin may
be useful later for issue, pull-request, and repository automation, but is not a
runtime dependency of Enigma and should be connected only when that workflow is
requested.

Likely future integrations must be assessed after milestone-one choices:

| Need | Possible integration | Trigger for adding it |
| --- | --- | --- |
| Pull requests and issue automation | GitHub | When repository work is managed through issues/PRs from Codex |
| Research-paper discovery | SciSpace or Consensus | When the research protocol includes a formal literature review |
| Shared research data | Google Drive or Dropbox | When collaborators need an external shared dataset |
| Project tracking | Linear/Asana/Trello equivalent | When issue tracking outside GitHub is explicitly chosen |

## Local-only project skill

`enigma-research` captures the experimental invariants that should apply when
designing experiments, collecting model responses, defining metrics, or
interpreting results. It deliberately does not prescribe a framework or cloud
provider. It is personal Codex configuration under `.agents/` and is intentionally
excluded from Git.

Do not create separate skills for ordinary coding, Gitflow, testing, or writing;
the agent already supports those tasks and `AGENTS.md` contains the relevant
repository conventions.
