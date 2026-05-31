# Evaluation-Driven Development (EDD)

> **TDD for LLM agents.** Don't change an agent or workflow without a failing eval. Don't ship until all evals pass.

This repository is an EDD pilot prototype targeting the `spec-to-implementation` workflow from [Engineering-factory-ai](https://github.com/tim-dickey/Engineering-factory-ai). It provides a deterministic eval harness for a multi-agent pipeline — **Atlas → Dot → Gil → Dev → Reed** — and demonstrates how to write, run, and gate eval fixtures in CI.

---

## What is EDD?

Eval-Driven Development applies the discipline of test-driven development to LLM agent workflows:

1. **Capture** a regression or new requirement as an eval fixture first.
2. **Confirm** the fixture fails under current prompts/agent behaviour.
3. **Change** only prompts or wiring until the eval passes.
4. **Protect** all previous evals — none may regress.
5. **Gate** PRs on the full eval suite (via CI).

See [`EDD/Concepts-for-edd.md`](EDD/Concepts-for-edd.md) for the full conceptual guide and [`EDD/Step-by-step-implementation-EDD.md`](EDD/Step-by-step-implementation-EDD.md) for the implementation walkthrough.

---

## Repository Structure

```
evaluation-driven-development-project/
├── README.md
└── EDD/
    ├── atlas_entry.py                   # Mock Atlas agent (deterministic stand-in)
    ├── spec_to_impl_eval_runner.py      # Python eval harness (main runner)
    ├── run-evals.sh                     # Shell launcher (Linux / macOS)
    ├── run-evals.ps1                    # PowerShell launcher (Windows)
    ├── happy-path.json                  # Fixture: valid story, full pipeline pass
    ├── missing-tests.json               # Fixture: no tests → Reed requests changes
    ├── bad-spec.json                    # Fixture: ambiguous spec → Atlas escalates
    └── *.md                             # Design docs (concepts, structure, layers)
```

---

## Quick Start

**Requirements:** Python 3.9+, no third-party dependencies.

### Run a single fixture

```bash
cd EDD
python spec_to_impl_eval_runner.py happy-path.json
```

### Run all fixtures (Linux / macOS)

```bash
cd EDD
bash run-evals.sh
```

### Run all fixtures (Windows)

```powershell
cd EDD
./run-evals.ps1
```

### Debug: dump the parsed Atlas output

```bash
python spec_to_impl_eval_runner.py happy-path.json --dump-output
```

### Use a custom Atlas command

```bash
ATLAS_CMD="python /path/to/your/atlas_entry.py" python spec_to_impl_eval_runner.py happy-path.json
```

---

## Eval Fixtures

Each fixture is a JSON file with three sections:

| Key | Purpose |
|---|---|
| `name` | Human-readable label shown in pass/fail output |
| `input.story` | The user story fed into the pipeline |
| `expects` | Per-agent assertions (exact match, min-length, substring, enum) |

### Assertion suffixes

| Suffix | Behaviour |
|---|---|
| _(none)_ | Exact equality |
| `_min` | List length ≥ N |
| `_in` | Value is one of a list |
| `_contains` | String contains substring (case-insensitive) |

### Included fixtures

| Fixture | Scenario | Expected outcome |
|---|---|---|
| `happy-path.json` | Valid story with full acceptance criteria | All agent blocks present; `reed.status` approved |
| `missing-tests.json` | Valid story, `force_missing_tests: true` | `reed.status: "changes-requested"`, tech debt logged |
| `bad-spec.json` | Ambiguous story, no acceptance criteria | `atlas.action: "escalate"` |

---

## How the Pipeline Works

```
stdin JSON (workflow + fixture)
        │
        ▼
   atlas_entry.py
        │
        ├── Ambiguous story? → escalate to PO
        ├── Unknown workflow? → escalate to orchestrator
        │
        └── Valid story →
              ├── dot   (spec: story_id, acceptance_criteria, constraints, open_questions)
              ├── gil   (implementation plan: steps[])
              ├── dev   (code changes: files[], tests_added)
              └── reed  (review: status, tech_debt[])
```

The eval runner invokes `atlas_entry.py` as a subprocess, parses its JSON output (raw or fenced ` ```json ``` ` blocks), and asserts each `expects` rule. Results are printed as `PASS` or `FAIL` with per-field detail.

---

## Wiring into CI

To gate pull requests on the eval suite, add a GitHub Actions workflow:

```yaml
# .github/workflows/evals.yml
name: EDD Eval Suite
on: [pull_request]
jobs:
  evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - name: Run eval fixtures
        run: bash EDD/run-evals.sh
```

---

## Relation to Engineering-factory-ai

This prototype is designed to be migrated into [`tim-dickey/Engineering-factory-ai`](https://github.com/tim-dickey/Engineering-factory-ai) as:

- `evals/workflows/spec-to-implementation/` — fixture files
- `.factory/tests/` — runner scripts
- **Check 11: Eval fixtures** — added to `validate.sh` / `validate.ps1`

See [`EDD/Final-recommended-repo-tree.md`](EDD/Final-recommended-repo-tree.md) for the target directory layout.

---

## Roadmap

- [ ] Add `evals.yml` GitHub Actions workflow (CI gating)
- [ ] Expand fixtures to cover TDD cycle and architecture workflows
- [ ] Rewrite `spec_to_impl_eval_runner.cjs` as a proper Node.js runner
- [ ] Add a model-eval matrix (prompt eval vs. model A/B comparison)
- [ ] Migrate into Engineering-factory-ai as Check 11
