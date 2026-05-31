<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# I would like to discuss and enable these concepts:

Deterministic Prompt Evaluation: Michael inquired about the use of deterministic prompt evaluation frameworks, confirming that no one present was actively using such a framework, and Kevin introduced the concept of eval-driven development (EDD) inspired by test-driven development.

Eval-Driven Development (EDD): Kevin described EDD as a method for evolving deterministic and non-deterministic spaces in LLM orchestration, particularly relevant for maintaining quality during agent orchestration changes.

Prompt and Model Evaluation: Michael distinguished between evaluating prompts and evaluating models, noting the importance of measuring improvements and planning to incorporate these practices into upcoming training.

Validation Logic in Agent Workflows: Michael explained their approach of embedding validation and escalation logic within agents, allowing orchestrators to handle workflow interruptions and delegate tasks based on agent feedback.

You can wire all four of those concepts directly into Engineering Factory as a first‑class “eval layer” and then evolve toward full eval‑driven development over time.[^1]

## Proposed end state in plain English

- Deterministic prompt evaluation: every important workflow (spec → plan → code, TDD cycle, architecture generation, sprint events) has a repeatable, scriptable test harness that feeds in fixed inputs and asserts on structured outputs.[^1]
- Eval‑driven development (EDD): you don’t change an agent, workflow, or orchestrator unless there is a failing eval that justifies the change, and you don’t ship a change unless all existing evals stay green.[^1]
- Prompt vs model eval: prompts are tested as “behavior contracts” for your 15 agents; model eval is treated as A/B of backends under those fixed contracts.[^1]
- Validation logic in workflows: Atlas and the other orchestrator‑ish agents run validation and escalation logic as part of their normal flow, and the evals assert that they actually do so in tricky scenarios.[^1]

Below is a concrete way to enable this inside your current repo.

***

## 1. Deterministic prompt evaluation

**Goal:** for a given agent, workflow, and input fixture, you can re‑run the interaction and get the “same enough” structured behavior to assert on.

Minimal pattern for Factory:

1. Add an `evals/` tree aligned to `.factory`:

- `evals/agents/<agent-name>/fixtures/*.json` (inputs + expectations).
- `evals/workflows/<workflow-name>/*.json` (multi‑step flows).

2. For each agent, define **contracted output fields** in its system prompt and/or a sidecar spec (e.g. `ANALYST_CONTRACT.md`). You already have role clarity; just make 2–3 outputs machine‑checkable.[^1]

Example for Dot (spec‑writer):

- Must output a top‑level JSON object with: `story_id`, `acceptance_criteria[]`, `constraints[]`, `open_questions[]`.
- Natural language around it can vary; the JSON block is canonical.

3. Add deterministic harness scripts under `.factory/tests/evals` that:

- Load a fixture (input + expected partial JSON).
- Call the agent via your chosen LLM client with:
    - Fixed `temperature = 0`.
    - Fixed model name.
    - Fixed “system” and “tools” configuration from `.factory/agents/…`.[^1]
- Extract the JSON block and run assertions (exact match or tolerant comparisons).

4. Integrate into `validate.sh` / `validate.ps1` as **Check 11: Prompt contracts**:

- Fail if any eval fixture fails.
- Summarise by agent + workflow with a short report alongside the 10 existing checks.[^1]

***

## 2. Eval‑Driven Development (EDD) as a workflow

Think “TDD, but the unit under test is an agent or workflow, and the test is an eval scenario.”

### Lifecycle for an agent change

1. **Capture a regression or new need as an eval first.**

- E.g. “Dot mishandled a story with multiple external dependencies; Atlas did not escalate when QA flagged missing DoD; Nix produced overlapping tests in a TDD cycle.”[^1]
- Encode that scenario as a new fixture under `evals/…`.

2. **Run the eval suite.**

- Confirm that the new fixture fails under current prompts/models.

3. **Change only prompts / wiring until eval passes.**

- You can change:
    - System prompt or agent spec.
    - Orchestration parameters (e.g. which agent Atlas calls, ordering).
- You cannot edit agent behavior code or prompts without a covering eval.

4. **Re‑run full eval suite.**

- All previous evals must remain green.
- If anything regresses, either:
    - Adjust the new change, or
    - Accept the behavior change and **update the old eval** with a rationale (like changing an old test when requirements change).

5. **Gate PRs on eval suite.**

- Your GitHub Action `validate.yml` can be extended:
    - Step `run-evals` (bash and PowerShell variants).
    - PR cannot merge unless all factory checks + evals pass.[^1]

This gives you the “EDD muscle” without boiling the ocean: every behavior tweak is justified by a failing eval and protected by existing ones.

***

## 3. Prompt vs model evaluation

You can very explicitly separate:

- **Prompt eval:** “Given this agent contract and this model, does the agent behavior meet our expectations?”
- **Model eval:** “Keeping the prompt and task constant, which model backend performs best on our eval suite?”


### Prompt eval implementation

- Use the deterministic harness above.
- When you modify:
    - `.factory/agents/*.md` (prompts).
    - `.factory/workflows/*.md` (orchestration descriptions).
- You run the evals with a single baseline model.

Results you care about:

- Pass/fail counts by agent and workflow.
- Behavior drift metrics (e.g. fewer acceptance criteria generated, more hallucinated dependencies).


### Model eval implementation

- Add a configuration matrix, e.g.:

```yaml
models:
  - claude-3-sonnet-20240229
  - gpt-4.1
  - local-llm-1
```

- For each model:
    - Run a subset of evals (say, “core engineering workflows”: PRD creation, architecture, spec→code, TDD cycle, QA increment).[^1]
    - Capture:
        - Pass rate on hard assertions.
        - Soft scores (LLM‑graded, see next section).
        - Latency and cost.
- Output a small markdown or JSON report that can be checked into `HISTORY.md` and referenced when you decide to switch models.[^1]

In practice, “prompt eval” is run on every PR; “model eval” is a periodic, slower job (nightly / weekly or on demand).

***

## 4. Validation \& escalation logic inside workflows

You already have a natural place for validation and escalation: Atlas (orchestrator), Sage (Scrum Master), Vera (QA), and Reed (code reviewer).[^1]

### Embed validation logic

Examples:

- Atlas should:
    - Validate that a spec from Dot is structurally complete (non‑empty `acceptance_criteria`, no `TODO` markers).
    - If incomplete, **route back** to Dot with a structured error summary instead of moving on to Gil/Dev.[^1]
- Vera should:
    - Refuse to sign off an Increment if there is no traceable link to TDD tests (Nix/Red/Min/Blu artifacts).
    - If missing, escalate back to Sage to adjust Sprint scope.[^1]
- Reed should:
    - Refuse to approve code that deviates from architecture or spec constraints.
    - Log technical debt into `/tech-debt-log` when accepting imperfect situations.[^1]

You can codify these as **simple, deterministic rules** in the agent prompts:

- “If condition X is not met, do not proceed; instead produce a JSON block: `action: "escalate"`, `to: "<agent-name>"`, `reason: "<short>"`.”


### Eval scenarios for validation

For each validation rule, you create an eval fixture that:

- Feeds in deliberately broken artifacts:
    - Spec missing constraints.
    - Stories with ambiguous acceptance criteria.
    - Code without tests.
- Asserts that:
    - Atlas/Vera/Reed **do not** proceed.
    - They produce a structured escalation payload referencing the right agent and rationale.

These evals test the **workflow** (not just a single agent) and give you confidence that safety rails hold as you add more autonomy.

***

## 5. How this fits your current repo

Given what’s already in `Engineering-factory-ai`:[^1]

- `.factory/tests/validate.sh` / `.factory/tests/validate.ps1` already exist with 10 checks and a root validator.[^1]
- You can:
    - Add `Check 11: Eval fixtures` there.
    - Create `evals/` alongside `.factory/` for fixtures.
    - Extend `ROADMAP.md` with an “Eval‑Driven Development” section listing:
        - Tier 1: Basic deterministic evals for 3–5 core workflows.
        - Tier 2: Full agent coverage.
        - Tier 3: Model benchmarking pipeline.[^1]

A minimal first slice that is small but valuable:

1. Pick **one** high‑leverage workflow, e.g. `/spec-to-implementation` (Atlas → Dot → Gil → Dev → Reed).[^1]
2. Define:
    - One “happy path” eval fixture.
    - Two “validation/escalation” fixtures (bad spec, missing tests).
3. Add a shell + PowerShell eval runner and wire it into `validate` as Check 11.
4. Make your next change to Atlas/Dot prompts **only through** failing/then‑passing those evals.

That’s enough to start practicing EDD without designing the whole thing up front.

***

To make this actionable, which **single workflow** do you want to turn into the first EDD pilot: `/spec-to-implementation`, `/tdd-cycle`, or something earlier in the lifecycle like `/create-architecture`?

<div align="center">⁂</div>

[^1]: https://github.com/tim-dickey/Engineering-factory-ai

