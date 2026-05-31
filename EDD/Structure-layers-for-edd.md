<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Excellent. Begin work on these concepts and apply them to the repository.

I can’t directly modify the GitHub repo, but I can specify concrete files, content, and steps so you can apply EDD and deterministic evals to Engineering Factory immediately.[^1]

## 1. New structure to add

Add an eval layer at the repo root:

- `evals/`
    - `agents/`
        - `atlas/`
        - `dot/`
        - `gil/`
        - `dev/`
        - `reed/`
    - `workflows/`
        - `spec-to-implementation/`
- `.factory/tests/run-evals.sh`
- `.factory/tests/run-evals.ps1`[^1]

These mirror the existing `.factory/tests` pattern and fit with your cross‑platform validation approach.[^1]

***

## 2. First target: `/spec-to-implementation`

Define the **contract** for the spec→plan→code→review pipeline in one short doc:

Create `.factory/contracts/spec-to-implementation.md`:

```md
# Contract: /spec-to-implementation

## Scope
Atlas orchestrates Dot, Gil, Dev, and Reed to take a single story and produce:
- A technical spec
- An implementation plan
- Code changes
- A code review outcome and, when applicable, tech-debt log entries

## Contracted outputs
Atlas must ensure that for a valid story:

1. Dot produces a JSON block:
   {
     "story_id": "<string>",
     "acceptance_criteria": ["..."],
     "constraints": ["..."],
     "open_questions": ["..."]
   }

2. Gil produces:
   {
     "steps": [
       { "id": "step-1", "summary": "...", "owner": "Dev" }
     ]
   }

3. Dev produces:
   {
     "changes": [
       { "file": "path/to/file", "description": "..." }
     ],
     "tests_added": true
   }

4. Reed produces:
   {
     "status": "approved" | "changes-requested",
     "tech_debt": [
       { "id": "TD-...", "summary": "..." }
     ]
   }

Agents may add natural language around these blocks, but the blocks themselves are required.
```

This gives the eval runner something deterministic to assert on without constraining all free‑form text.[^1]

***

## 3. Deterministic eval fixtures

Create a **happy path** and two **validation/escalation** fixtures.

1) `evals/workflows/spec-to-implementation/happy-path.json`:
```json
{
  "name": "happy-path-basic-story",
  "description": "Simple story flows cleanly through spec, plan, code, review.",
  "input": {
    "story": {
      "id": "STORY-001",
      "title": "User can reset password via email link",
      "description": "As a user, I want to reset my password via a secure email link so that I can regain access.",
      "acceptance_criteria": [
        "User requests reset with registered email",
        "System sends one-time link that expires in 15 minutes",
        "User can set a new password that meets complexity rules"
      ]
    }
  },
  "expects": {
    "dot": {
      "story_id": "STORY-001",
      "acceptance_criteria_min": 3,
      "constraints_min": 1
    },
    "gil": {
      "steps_min": 3
    },
    "dev": {
      "tests_added": true
    },
    "reed": {
      "status_in": ["approved", "changes-requested"]
    }
  }
}
```

2) `evals/workflows/spec-to-implementation/missing-tests.json`:
```json
{
  "name": "missing-tests-should-escalate",
  "description": "Dev omits tests; Reed must escalate instead of silently approving.",
  "input": {
    "story": {
      "id": "STORY-002",
      "title": "Export transactions to CSV",
      "description": "As an accountant, I want to export transactions so I can reconcile in Excel.",
      "acceptance_criteria": [
        "Export includes date, amount, description",
        "Export uses comma-separated format",
        "Export only includes transactions for selected date range"
      ]
    },
    "force_missing_tests": true
  },
  "expects": {
    "dev": {
      "tests_added": false
    },
    "reed": {
      "status": "changes-requested"
    }
  }
}
```

3) `evals/workflows/spec-to-implementation/bad-spec.json`:
```json
{
  "name": "incomplete-spec-should-escalate",
  "description": "Story is ambiguous; Atlas/Dot must refuse to proceed and escalate.",
  "input": {
    "story": {
      "id": "STORY-003",
      "title": "Improve performance",
      "description": "Make the app faster.",
      "acceptance_criteria": []
    }
  },
  "expects": {
    "atlas": {
      "action": "escalate",
      "to": "po",
      "reason_contains": "ambiguous"
    }
  }
}
```

These encode the deterministic expectations without over‑specifying wording.[^1]

***

## 4. Validation \& escalation behavior in prompts

Update the relevant agent specs under `.factory/agents` (filenames are illustrative; adjust to your actual layout):[^1]

1) **Atlas** (orchestrator), e.g. `.factory/agents/orchestrator.md`:

Add a “Validation \& escalation rules” section:

```md
## Validation & escalation rules

Before delegating work:

- Validate input stories:
  - If acceptance criteria are empty or clearly ambiguous (e.g. "make it faster", "improve UX"), DO NOT proceed to Dot, Gil, Dev, or Reed.
  - Instead, produce a JSON control block:
    {
      "action": "escalate",
      "to": "po",
      "reason": "<short explanation of why the story is not ready>"
    }
  - You may also include natural language, but this JSON block is mandatory in escalation scenarios.

- When driving the /spec-to-implementation workflow:
  - Require the contracted JSON blocks from Dot, Gil, Dev, and Reed as described in `contracts/spec-to-implementation.md`.
  - If an agent fails to produce the required block, ask them once to correct it.
  - If they still fail, escalate with:
    {
      "action": "escalate",
      "to": "<agent-name>",
      "reason": "Could not obtain contracted output from <agent-name>"
    }
```

2) **Dev** (code writer), e.g. `.factory/agents/code-writer.md`:
```md
## TDD and tests

- Always add or update automated tests when implementing a story.
- Reflect test status in this JSON block:

  {
    "changes": [
      { "file": "<path>", "description": "<what changed>" }
    ],
    "tests_added": true | false
  }

- If you are explicitly instructed not to add tests (e.g. for eval scenarios), set `"tests_added": false` and explain why in natural language.
```

3) **Reed** (code reviewer), e.g. `.factory/agents/code-reviewer.md`:
```md
## Review decisions, escalation, and tech debt

- Always output a JSON decision block:

  {
    "status": "approved" | "changes-requested",
    "tech_debt": [
      { "id": "TD-<short-id>", "summary": "<one sentence>" }
    ]
  }

- If tests are missing or inadequate for the changes:
  - Set "status": "changes-requested".
  - Add at least one tech_debt entry explaining the gap.
```

These changes make the eval expectations align with agent behavior.[^1]

***

## 5. Eval runner scripts (Check 11)

Add `.factory/tests/run-evals.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[^0]}")/../.." && pwd)"
EVALS_DIR="$ROOT_DIR/evals"
FAILURES=0

echo "Running Engineering Factory evals..."

run_spec_to_impl_eval() {
  local fixture="$1"
  echo "  - spec-to-implementation: $(basename "$fixture")"

  node "$ROOT_DIR/tests/spec_to_impl_eval_runner.cjs" "$fixture" || FAILURES=$((FAILURES+1))
}

for fixture in "$EVALS_DIR/workflows/spec-to-implementation/"*.json; do
  [ -e "$fixture" ] || continue
  run_spec_to_impl_eval "$fixture"
done

if [ "$FAILURES" -ne 0 ]; then
  echo "Evals failed: $FAILURES failing fixtures."
  exit 1
fi

echo "All evals passed."
```

And PowerShell `.factory/tests/run-evals.ps1`:

```powershell
#!/usr/bin/env pwsh
param()

$ErrorActionPreference = "Stop"

$rootDir  = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$evalsDir = Join-Path $rootDir "evals"
$failures = 0

Write-Host "Running Engineering Factory evals..."

function Run-SpecToImplEval($fixture) {
    Write-Host "  - spec-to-implementation: $(Split-Path $fixture -Leaf)"
    try {
        node (Join-Path $rootDir "tests/spec_to_impl_eval_runner.cjs") $fixture
    } catch {
        $script:failures++
    }
}

Get-ChildItem (Join-Path $evalsDir "workflows/spec-to-implementation") -Filter *.json | ForEach-Object {
    Run-SpecToImplEval $_.FullName
}

if ($failures -ne 0) {
    Write-Host "Evals failed: $failures failing fixtures."
    exit 1
}

Write-Host "All evals passed."
```

You can implement `tests/spec_to_impl_eval_runner.cjs` however you like (Node/TypeScript/Python); the key is that it:[^1]

- Loads the fixture.
- Calls your local AI IDE / agent entry point for `/spec-to-implementation`.
- Parses the JSON control blocks.
- Checks the `expects` section and returns non‑zero on failure.

Finally, wire this into the validator as **Check 11**:

In `.factory/tests/validate.sh`, add near the end:[^1]

```bash
check_11() {
  echo "Check 11: Eval fixtures"
  . "$(dirname "$0")/run-evals.sh"
}
```

And include it in the dispatcher list / help output.[^1]

In `.factory/tests/validate.ps1`, add analogous `Check-11` wrapping `run-evals.ps1`.[^1]

***

## 6. GitHub Actions integration (EDD gate)

Update `.github/workflows/validate.yml` to make sure evals run on every PR (if they don’t already) by ensuring your validate scripts are the single source of truth:[^1]

- Confirm there’s a job step:

```yaml
- name: Run factory validator
  run: bash .factory/tests/validate.sh
```

and for Windows (if you keep a matrix), the PowerShell equivalent.[^1]

Because Check 11 runs inside `validate`, any failing eval blocks merges, which is your EDD gate.

***

If you’d like, next step I can sketch `spec_to_impl_eval_runner.cjs` to show exactly how to call Atlas and assert on Dot/Gil/Dev/Reed outputs—what language/runtime do you prefer for that runner (Node, Python, or something else)?

<div align="center">⁂</div>

[^1]: https://github.com/tim-dickey/Engineering-factory-ai

