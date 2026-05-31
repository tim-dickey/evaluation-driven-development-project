<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Summarize our chat exchange step-by-step so the I can hand over this information for GitHub CoPilot to build out in the repo.

Here is a complete handover summary you can paste directly into a GitHub Copilot prompt or issue.

***

## Engineering Factory AI — EDD Eval Harness Handover

### Context

This repo (`tim-dickey/Engineering-factory-ai`) is an AI-agent-driven software engineering factory. The goal of this work session was to introduce **Eval-Driven Development (EDD)** — a discipline modeled on TDD where no agent prompt or orchestration change ships without a covering eval fixture.

***

### Step 1 — Concepts agreed on

Four concepts were established as the design foundation:

- **Deterministic prompt evaluation** — repeatable, scriptable tests that feed fixed inputs to agents and assert on structured JSON outputs.
- **Eval-Driven Development (EDD)** — write a failing eval first, change agent prompts or orchestration until it passes, keep all prior evals green, gate PRs on the full eval suite.
- **Prompt vs model evaluation** — prompt evals run on every PR against a fixed model; model evals are a slower periodic job comparing backends on the same prompt contracts.
- **Validation and escalation logic in workflows** — Atlas, Vera, Reed, and Sage embed deterministic validation rules that produce structured `action: escalate` JSON blocks when upstream work is incomplete.

***

### Step 2 — Workflow contracts

A contract document was drafted for `.factory/contracts/spec-to-implementation.md` that defines required JSON output blocks for Dot, Gil, Dev, and Reed in the `/spec-to-implementation` workflow. Each agent has contracted fields:

- **Dot** — `story_id`, `acceptance_criteria[]`, `constraints[]`, `open_questions[]`
- **Gil** — `steps[]` each with `id`, `summary`, `owner`
- **Dev** — `changes[]`, `tests_added: bool`
- **Reed** — `status` (`approved` | `changes-requested`), `tech_debt[]`
- **Atlas** — escalation block `action`, `to`, `reason` when stories are invalid

***

### Step 3 — Python eval runner

File: `.factory/tests/spec_to_impl_eval_runner.py`

- Accepts a fixture JSON path and `--atlas-cmd` argument (defaults to `ATLAS_CMD` env var).
- Sends payload `{ workflow, fixture }` to Atlas via stdin.
- Accepts raw JSON or fenced ````json` block output from Atlas.
- Parses top-level keys `atlas`, `dot`, `gil`, `dev`, `reed`.
- Validates required contract fields per agent before running fixture-specific assertions.
- Fixture `expects` keys support four assertion types:
    - `field_min` — minimum list length
    - `field_in` — value must be one of a list
    - `field_contains` — substring match (case-insensitive)
    - `field` — exact equality
- Exits nonzero on any failure, prints `PASS` or `FAIL` per fixture with details.

***

### Step 4 — Three eval fixtures

All placed under `evals/workflows/spec-to-implementation/`:

**`happy-path.json`**

- Story: User can reset password via email link (`STORY-001`)
- Expects: Dot returns `story_id: STORY-001`, 3+ criteria, 1+ constraints; Gil returns 3+ steps; Dev returns `tests_added: true`, 1+ changes; Reed returns `status` in `["approved", "changes-requested"]`, 0+ tech debt.

**`missing-tests.json`**

- Story: Export transactions to CSV (`STORY-002`)
- Sets `force_missing_tests: true` in input.
- Expects: Dev returns `tests_added: false`; Reed returns `status: "changes-requested"` and 1+ tech debt entries.

**`bad-spec.json`**

- Story: "Improve performance / Make the app faster" with empty acceptance criteria (`STORY-003`)
- Expects: Atlas returns `action: "escalate"`, `to: "po"`, `reason` containing `"ambiguous"`.
- No downstream agent blocks expected or checked.

***

### Step 5 — Mock Atlas entry

File: `.factory/tests/atlas_entry.py`

- Reads payload from stdin as JSON.
- Detects ambiguous stories (empty `acceptance_criteria` or vague phrase match) and returns an escalation block.
- For valid stories, produces deterministic mock outputs for `dot`, `gil`, `dev`, and `reed` with story-content-aware data.
- Respects `force_missing_tests: true` to set `tests_added: false` and force Reed to return `changes-requested` with a tech-debt entry.
- Purpose: local end-to-end harness testing before the real Atlas orchestration exists; treat as temporary scaffolding.

***

### Step 6 — Shell and PowerShell launchers

Files: `.factory/tests/run-evals.sh` and `.factory/tests/run-evals.ps1`

Both scripts:

- Resolve repo root from their own script directory (two levels up from `.factory/tests/`).
- Look for the runner at `.factory/tests/spec_to_impl_eval_runner.py`.
- Look for Atlas mock at `.factory/tests/atlas_entry.py`.
- Read fixtures from `evals/workflows/spec-to-implementation/*.json`.
- Iterate all fixture files, call the Python runner with `--atlas-cmd "python .factory/tests/atlas_entry.py"`.
- Exit nonzero and print failure count if any fixture fails.
- Respect `PYTHON_BIN` environment variable override (default `python3` on bash, `python` on PowerShell).

**Note:** The originally generated launchers used a sibling `fixtures/` path. They need to be updated to the repo-aware paths above.

***

### Step 7 — Validator integration (Check 11)

In `.factory/tests/validate.sh` add:

```bash
check_11() {
  echo "Check 11: Eval fixtures"
  bash "$(dirname "$0")/run-evals.sh"
}
```

Add the analogous `Check-11` block in `.factory/tests/validate.ps1` calling `run-evals.ps1`.

Include `check_11` in the dispatcher list so it runs as part of `validate all`.

***

### Step 8 — GitHub Actions gate

In `.github/workflows/validate.yml`, confirm or add a step:

```yaml
- name: Run factory validator (includes evals)
  run: bash .factory/tests/validate.sh
```

Because Check 11 lives inside the validator, evals gate PRs automatically with no separate workflow job needed.

***

### Final repo tree

```text
Engineering-factory-ai/
├─ .factory/
│  ├─ agents/
│  │  ├─ orchestrator.md         # add Atlas validation/escalation rules
│  │  ├─ code-writer.md          # add Dev test-reporting contract
│  │  └─ code-reviewer.md        # add Reed decision/tech-debt contract
│  ├─ contracts/
│  │  └─ spec-to-implementation.md   # NEW
│  ├─ tests/
│  │  ├─ validate.sh             # update: add Check 11
│  │  ├─ validate.ps1            # update: add Check 11
│  │  ├─ run-evals.sh            # NEW
│  │  ├─ run-evals.ps1           # NEW
│  │  ├─ spec_to_impl_eval_runner.py  # NEW
│  │  └─ atlas_entry.py          # NEW (mock, temporary)
│  └─ workflows/
│     └─ (existing workflow docs)
├─ evals/
│  └─ workflows/
│     └─ spec-to-implementation/
│        ├─ happy-path.json       # NEW
│        ├─ missing-tests.json    # NEW
│        └─ bad-spec.json         # NEW
├─ .github/
│  └─ workflows/
│     └─ validate.yml             # update: confirm validator runs evals
└─ ROADMAP.md                     # update: add EDD Tier 1/2/3 plan
```


***

### EDD Roadmap to include in ROADMAP.md

- **Tier 1 (now):** Deterministic evals for `/spec-to-implementation` with mock Atlas entry, 3 fixtures, Check 11 wired into validator.
- **Tier 2:** Expand fixtures to cover all 15 agents; replace mock Atlas with real orchestration call; add eval coverage for `/tdd-cycle` and `/create-architecture` workflows.
- **Tier 3:** Model benchmarking pipeline — run eval suite against multiple LLM backends, capture pass rate, latency, and cost per model, write results to `HISTORY.md`.

