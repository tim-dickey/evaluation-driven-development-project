# Roadmap — Evaluation-Driven Development (EDD)

This roadmap tracks the evolution of the EDD pilot from a local prototype into a production-grade eval layer integrated with [Engineering-factory-ai](https://github.com/tim-dickey/Engineering-factory-ai).

Work is organised into three tiers of increasing maturity, followed by a backlog of known issues identified during the initial assessment.

---

## Known Issues (Fix First)

These are bugs or structural problems identified in the current prototype that should be resolved before progressing through the tiers.

- [ ] **`spec_to_impl_eval_runner.cjs` is a duplicate** — the file is byte-for-byte identical to the `.py` runner (same blob SHA). It must be rewritten as a proper Node.js / CommonJS eval runner or removed entirely.
- [ ] **`JSON_BLOCK_RE` regex may fail on nested JSON** — the pattern `\{.*?\}` with `re.DOTALL` does not reliably capture deeply nested or multiline JSON objects extracted from fenced code blocks. Replace with a balanced-brace parser or `json.JSONDecoder.raw_decode`.
- [ ] **No input validation in `atlas_entry.py`** — missing keys (e.g. absent `workflow` field) raise unhandled exceptions instead of a structured error response.
- [ ] **Filename with spaces** — `EDD/EDD happy-path-json-missing-tests-json..md` has a non-standard name (spaces, double dot). Rename for shell and CI compatibility.
- [ ] **Typo in README title** — original README read "Evaluation *Diven* Development" (now fixed).

---

## Tier 1 — Solid Local Prototype

> **Goal:** A clean, runnable, self-contained eval harness that any contributor can use locally and that correctly validates the `spec-to-implementation` pipeline.

### 1.1 Fixes & Hardening
- [ ] Fix `JSON_BLOCK_RE` to handle multiline / nested JSON objects
- [ ] Add `try/except` around `json.loads` calls with actionable error messages
- [ ] Validate required keys (`workflow`, `fixture.input.story`) at entry and return structured errors
- [ ] Rename `spec_to_impl_eval_runner.cjs` → proper Node.js runner or delete

### 1.2 Fixture Coverage
- [ ] Expand `atlas_entry.py` routing beyond `password` and `csv` keywords (generalise story dispatch)
- [ ] Add fixture: story with `TODO` markers in acceptance criteria → Atlas escalates
- [ ] Add fixture: story routed to an unknown/unsupported workflow → Atlas escalates with reason
- [ ] Add fixture: `open_questions` populated when story title triggers clarification logic

### 1.3 Repository Hygiene
- [ ] Add `LICENSE` file (recommend MIT or Apache 2.0)
- [ ] Add `requirements.txt` (stdlib-only now, but documents Python version floor)
- [ ] Rename space-containing markdown file in `EDD/`
- [ ] Add `.gitignore` (Python cache, `__pycache__`, `.env`)

### 1.4 Unit Tests for the Runner Itself
- [ ] Add `tests/test_eval_runner.py` covering:
  - `get_path` / `maybe_get_path` edge cases
  - Each assertion helper (`expect_equal`, `expect_min_length`, `expect_in`, `expect_contains`)
  - `parse_atlas_output` with raw JSON and fenced block inputs
  - `evaluate_expectations` with a synthetic fixture + output pair

---

## Tier 2 — CI-Gated & Multi-Workflow Coverage

> **Goal:** Evals run automatically on every PR; coverage extends beyond the happy path to all agents and at least two workflows.

### 2.1 GitHub Actions Integration
- [ ] Add `.github/workflows/evals.yml` — runs `run-evals.sh` on every pull request
- [ ] Add `.github/workflows/evals-windows.yml` — runs `run-evals.ps1` on `windows-latest` to keep PowerShell parity
- [ ] Surface pass/fail counts as a PR check summary (use `::notice` / `::error` workflow commands)
- [ ] Fail the workflow (non-zero exit) if any fixture fails — block merge

### 2.2 Repo Structure Migration
- [ ] Migrate fixtures from `EDD/` into the canonical layout:
  ```
  evals/
  └── workflows/
      └── spec-to-implementation/
          ├── happy-path.json
          ├── missing-tests.json
          └── bad-spec.json
  ```
- [ ] Move runner scripts to `.factory/tests/` (aligning with Engineering-factory-ai Check 11)
- [ ] Update `run-evals.sh` / `run-evals.ps1` paths accordingly

### 2.3 Additional Workflow Coverage
- [ ] Add eval fixtures for the **TDD cycle** workflow (Red → Min → Blu agents)
- [ ] Add eval fixtures for **architecture generation** workflow
- [ ] Add eval fixtures for **sprint planning / backlog refinement** workflow
- [ ] Define contracted output fields (agent contracts) for at least 5 of the 15 factory agents

### 2.4 Soft Assertions (LLM-Graded)
- [ ] Design and document a `score` assertion type for non-deterministic outputs
- [ ] Add optional LLM-graded scorer (e.g. "does this plan mention security?") alongside hard assertions
- [ ] Clearly separate hard (CI-blocking) vs. soft (advisory) assertions in fixture schema and runner output

---

## Tier 3 — Model Benchmarking Pipeline

> **Goal:** Support A/B comparison of LLM backends against fixed agent contracts; produce a durable benchmark history.

### 3.1 Model Configuration Matrix
- [ ] Add `eval-config.yml` with a `models:` list (e.g. `gpt-4.1`, `claude-3-7-sonnet`, `local-llm`)
- [ ] Runner accepts `--model` flag; `ATLAS_CMD` is templated per model entry
- [ ] Matrix run produces per-model pass rates across all fixtures

### 3.2 Reporting & History
- [ ] Runner outputs a structured JSON report: pass/fail counts, failure details, latency, model
- [ ] Add `HISTORY.md` — append-only benchmark results, checked in after each model eval run
- [ ] Add a nightly/weekly GitHub Actions job that runs the model matrix and commits a report update

### 3.3 Drift Detection
- [ ] Track behaviour drift metrics over time (e.g. average `acceptance_criteria` count, escalation rate)
- [ ] Alert (workflow annotation or issue) when a model update changes soft-score averages by > threshold
- [ ] Document model-swap decision criteria in `HISTORY.md` template

---

## Integration Milestone — Engineering-factory-ai Check 11

> **Goal:** EDD is a first-class check in the Engineering Factory validate pipeline, not a separate repo.

- [ ] Open a PR in `tim-dickey/Engineering-factory-ai` adding:
  - `evals/` tree with Tier 1 + Tier 2 fixtures
  - `.factory/tests/run-evals.sh` and `.factory/tests/run-evals.ps1`
  - **Check 11: Eval fixtures** in `validate.sh` / `validate.ps1`
  - Updated `validate.yml` to run Check 11 on all PRs
- [ ] Archive or deprecate this standalone prototype repo once migrated
- [ ] Update Engineering-factory-ai `ROADMAP.md` with Tier 2 and Tier 3 items above

---

## Summary Table

| Tier | Theme | Status |
|---|---|---|
| Known Issues | Bug fixes from initial assessment | 🔴 Not started |
| Tier 1 | Solid local prototype | 🔴 Not started |
| Tier 2 | CI-gated, multi-workflow coverage | 🔴 Not started |
| Tier 3 | Model benchmarking pipeline | 🔴 Not started |
| Milestone | Migrate into Engineering-factory-ai | 🔴 Not started |
