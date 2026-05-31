<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Produce a small atlas_entry.py mock so you can run these fixtures end-to-end before wiring them to the real repository orchestration.

I created a small `atlas_entry.py` mock that reads the eval payload from stdin, handles the `spec-to-implementation` workflow, and returns the exact top-level JSON structure the Python eval runner expects: `atlas`, `dot`, `gil`, `dev`, and `reed`, or just an `atlas` escalation block for ambiguous stories.[^1]

## What the mock simulates

The mock treats vague stories or stories with empty acceptance criteria as escalation cases, returning `atlas.action = "escalate"` and `atlas.to = "po"` with a reason containing “ambiguous,” so your `bad-spec.json` fixture should pass without downstream agent blocks. For valid stories, it produces deterministic stand-in outputs for Dot, Gil, Dev, and Reed, including `tests_added: false` plus `reed.status = "changes-requested"` when `force_missing_tests` is set, which lets the `missing-tests.json` fixture pass end-to-end.[^1]

## How to run it

You can now test the runner against the mock with a command like `python spec_to_impl_eval_runner.py happy-path.json --atlas-cmd "python atlas_entry.py"` after placing both files into your repo or working folder. That gives you a safe rehearsal loop before connecting the runner to the real orchestration, like using a stunt double before asking the real actor to jump off the building.[^1]

## Why this helps

This mock gives you a stable baseline for the eval harness itself, so if a fixture fails you can tell whether the problem is in the runner, the fixture schema, or the real orchestration wiring rather than playing “debugging roulette.” In technology-history terms, this is very much the simulator-before-the-moonshot pattern: test the cockpit on Earth before inviting Atlas to pretend it’s Apollo.[^1]

If you want, I can next produce a tiny `run-evals.sh` and `run-evals.ps1` pair already updated to call the Python runner and this mock Atlas entry.[^1]

<div align="center">⁂</div>

[^1]: https://github.com/tim-dickey/Engineering-factory-ai

