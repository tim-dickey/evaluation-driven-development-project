#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURE_DIR="$ROOT_DIR/fixtures/spec-to-implementation"
RUNNER="$ROOT_DIR/spec_to_impl_eval_runner.py"
ATLAS="$ROOT_DIR/atlas_entry.py"
PYTHON_BIN="${PYTHON_BIN:-python3}"
FAILURES=0

if [ ! -f "$RUNNER" ]; then
  echo "Missing runner: $RUNNER"
  exit 1
fi

if [ ! -f "$ATLAS" ]; then
  echo "Missing Atlas mock: $ATLAS"
  exit 1
fi

if [ ! -d "$FIXTURE_DIR" ]; then
  echo "Missing fixture directory: $FIXTURE_DIR"
  exit 1
fi

echo "Running spec-to-implementation evals..."
for fixture in "$FIXTURE_DIR"/*.json; do
  [ -e "$fixture" ] || continue
  echo "  - $(basename "$fixture")"
  if ! "$PYTHON_BIN" "$RUNNER" "$fixture" --atlas-cmd "$PYTHON_BIN $ATLAS"; then
    FAILURES=$((FAILURES + 1))
  fi
done

if [ "$FAILURES" -gt 0 ]; then
  echo "Evals failed: $FAILURES"
  exit 1
fi

echo "All evals passed."
