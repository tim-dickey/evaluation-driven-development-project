<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Sketch spec_to_impl_eval_runner.cjs to show exactly how to call Atlas and assert on Dot/Gil/Dev/Reed outputs. Use Python for the runner.

I sketched a Python runner that loads a fixture, invokes Atlas through a configurable command, parses structured JSON output, and asserts expectations for Atlas, Dot, Gil, Dev, and Reed.[^1]

## What it does

The runner expects a fixture JSON file, wraps it into a payload with `workflow: "spec-to-implementation"`, and sends that payload to Atlas over stdin using a shell command such as `python atlas_entry.py`, which you can override with `--atlas-cmd` or the `ATLAS_CMD` environment variable.[^1] It then accepts either raw JSON output or fenced ````json` blocks, because real agent output often behaves like a smart intern who follows instructions but still writes a little essay before the answer.

## Assertions included

The script validates required contract fields for Dot, Gil, Dev, and Reed before checking fixture-specific expectations such as equality, membership, substring matches, and minimum list lengths. That means fixture rules like `constraints_min`, `status_in`, and `reason_contains` are supported directly, which fits the deterministic eval shape we discussed earlier.

## How to wire it in

Point your shell and PowerShell eval scripts at the Python file instead of the earlier placeholder Node path, for example: `python .factory/tests/spec_to_impl_eval_runner.py evals/workflows/spec-to-implementation/happy-path.json`. The extra `.cjs` copy is just a compatibility placeholder, but the real implementation is the Python file and should be the one your validator calls.

## Small repo tweaks

You’ll probably want to move the Python file from the shared artifact location into something like `.factory/tests/spec_to_impl_eval_runner.py` or `tests/spec_to_impl_eval_runner.py` inside the repo so your validate scripts can reference it consistently. You should also make sure Atlas returns a top-level object with keys like `atlas`, `dot`, `gil`, `dev`, and `reed`, or the parser will fail faster than a sitcom developer trying to fix prod on a Friday night.

If you want, next I can draft the matching `happy-path.json`, `missing-tests.json`, and `bad-spec.json` fixtures in final form for this Python runner.
<span style="display:none">[^2]</span>

<div align="center">⁂</div>

[^1]: https://github.com/tim-dickey/Engineering-factory-ai

[^2]: can-this-book-be-accessed-http-FADUy9FRSE.xkF5cFNKrzQ.md

