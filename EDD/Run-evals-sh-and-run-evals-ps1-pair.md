<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Produce a tiny run-evals.sh and run-evals.ps1 pair already updated to call the Python runner and this mock Atlas entry.

I created a tiny `run-evals.sh` and `run-evals.ps1` pair that look for the Python runner, the mock `atlas_entry.py`, and the `fixtures/spec-to-implementation` directory, then execute every JSON fixture against the mock Atlas command.[^1]

## How they work

Both scripts use the current script directory as `ROOT_DIR`, so they assume the runner, mock Atlas entry, and fixture folder live together in a small test harness layout rather than scattered around the repo like socks after laundry day. Each script loops over all fixture files, invokes the Python runner with `--atlas-cmd` pointing to the mock Atlas entry, and exits nonzero if any fixture fails, which makes them ready for CI gating later.[^1]

## Layout expected

The scripts expect a structure like:

- `run-evals.sh` / `run-evals.ps1`
- `spec_to_impl_eval_runner.py`
- `atlas_entry.py`
- `fixtures/spec-to-implementation/*.json`.[^1]

That means if you move these into `.factory/tests/`, you should either move the fixtures and Python files with them or adjust the relative paths to match the repo’s real layout.[^1]

## Small tweak you may want

The shell script defaults to `python3` while the PowerShell script defaults to `python`, and both allow override through `PYTHON_BIN`, which is handy because Python naming on Windows has the consistency of 1990s printer drivers. Once you wire this into the real repository, the next likely cleanup is changing the path assumptions so `.factory/tests/run-evals.*` points to repo-root fixtures and runner files instead of a self-contained demo folder.[^1]

If you want, I can next produce a final recommended repo tree and exact destination paths for all of these files inside `Engineering-factory-ai`.[^1]

<div align="center">⁂</div>

[^1]: https://github.com/tim-dickey/Engineering-factory-ai

