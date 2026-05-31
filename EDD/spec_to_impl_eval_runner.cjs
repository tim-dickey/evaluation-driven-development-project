#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class EvalFailure:
    path: str
    message: str


class EvalError(Exception):
    pass


ROOT = Path(__file__).resolve().parents[0]
DEFAULT_ATLAS_CMD = os.environ.get("ATLAS_CMD", "python atlas_entry.py")
JSON_BLOCK_RE = re.compile(r"```json\s*(\{.*?\})\s*```", re.DOTALL)


def load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def run_atlas(fixture: Dict[str, Any], atlas_cmd: str) -> str:
    payload = {
        "workflow": "spec-to-implementation",
        "fixture": fixture,
    }

    proc = subprocess.run(
        atlas_cmd,
        input=json.dumps(payload),
        text=True,
        shell=True,
        capture_output=True,
    )

    if proc.returncode != 0:
        raise EvalError(
            "Atlas command failed\n"
            f"command: {atlas_cmd}\n"
            f"exit_code: {proc.returncode}\n"
            f"stdout:\n{proc.stdout}\n"
            f"stderr:\n{proc.stderr}"
        )

    return proc.stdout.strip()


def parse_atlas_output(raw: str) -> Dict[str, Any]:
    raw = raw.strip()

    if raw.startswith("{"):
        return json.loads(raw)

    matches = JSON_BLOCK_RE.findall(raw)
    if matches:
        merged: Dict[str, Any] = {}
        for block in matches:
            obj = json.loads(block)
            if isinstance(obj, dict):
                merged.update(obj)
        if merged:
            return merged

    raise EvalError(
        "Could not parse Atlas output. Expected either raw JSON or fenced ```json blocks."
    )


def get_path(data: Dict[str, Any], dotted_path: str) -> Any:
    current: Any = data
    for part in dotted_path.split("."):
        if not isinstance(current, dict) or part not in current:
            raise KeyError(dotted_path)
        current = current[part]
    return current


def maybe_get_path(data: Dict[str, Any], dotted_path: str) -> Any:
    try:
        return get_path(data, dotted_path)
    except KeyError:
        return None


def expect_equal(failures: List[EvalFailure], data: Dict[str, Any], path: str, expected: Any) -> None:
    actual = maybe_get_path(data, path)
    if actual != expected:
        failures.append(EvalFailure(path, f"expected {expected!r}, got {actual!r}"))


def expect_in(failures: List[EvalFailure], data: Dict[str, Any], path: str, expected_options: List[Any]) -> None:
    actual = maybe_get_path(data, path)
    if actual not in expected_options:
        failures.append(EvalFailure(path, f"expected one of {expected_options!r}, got {actual!r}"))


def expect_min_length(failures: List[EvalFailure], data: Dict[str, Any], path: str, minimum: int) -> None:
    actual = maybe_get_path(data, path)
    if not isinstance(actual, list) or len(actual) < minimum:
        failures.append(EvalFailure(path, f"expected list length >= {minimum}, got {actual!r}"))


def expect_contains(failures: List[EvalFailure], data: Dict[str, Any], path: str, expected_substring: str) -> None:
    actual = maybe_get_path(data, path)
    if not isinstance(actual, str) or expected_substring.lower() not in actual.lower():
        failures.append(EvalFailure(path, f"expected substring {expected_substring!r}, got {actual!r}"))


def assert_agent_contract(output: Dict[str, Any], agent: str, failures: List[EvalFailure]) -> None:
    block = output.get(agent)
    if not isinstance(block, dict):
        failures.append(EvalFailure(agent, "missing agent output block"))
        return

    if agent == "dot":
        for field in ["story_id", "acceptance_criteria", "constraints", "open_questions"]:
            if field not in block:
                failures.append(EvalFailure(f"{agent}.{field}", "missing required field"))
    elif agent == "gil":
        if "steps" not in block or not isinstance(block["steps"], list):
            failures.append(EvalFailure(f"{agent}.steps", "missing required steps array"))
    elif agent == "dev":
        for field in ["changes", "tests_added"]:
            if field not in block:
                failures.append(EvalFailure(f"{agent}.{field}", "missing required field"))
    elif agent == "reed":
        for field in ["status", "tech_debt"]:
            if field not in block:
                failures.append(EvalFailure(f"{agent}.{field}", "missing required field"))


def evaluate_expectations(fixture: Dict[str, Any], output: Dict[str, Any]) -> List[EvalFailure]:
    failures: List[EvalFailure] = []
    expects = fixture.get("expects", {})

    for agent in ["atlas", "dot", "gil", "dev", "reed"]:
        if agent in expects and agent in ["dot", "gil", "dev", "reed"]:
            assert_agent_contract(output, agent, failures)

    for agent, rules in expects.items():
        if not isinstance(rules, dict):
            failures.append(EvalFailure(agent, "expects block must be an object"))
            continue

        for key, expected in rules.items():
            path = f"{agent}.{key.removesuffix('_min').removesuffix('_in').removesuffix('_contains')}"

            if key.endswith("_min"):
                expect_min_length(failures, output, path, int(expected))
            elif key.endswith("_in"):
                expect_in(failures, output, path, list(expected))
            elif key.endswith("_contains"):
                expect_contains(failures, output, path, str(expected))
            else:
                expect_equal(failures, output, f"{agent}.{key}", expected)

    return failures


def summarize(output: Dict[str, Any]) -> str:
    parts = []
    for agent in ["atlas", "dot", "gil", "dev", "reed"]:
        if agent in output:
            parts.append(agent)
    return ", ".join(parts) if parts else "no recognized agent blocks"


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a spec-to-implementation eval fixture against Atlas.")
    parser.add_argument("fixture", type=Path, help="Path to eval fixture JSON file")
    parser.add_argument("--atlas-cmd", default=DEFAULT_ATLAS_CMD, help="Command used to invoke Atlas")
    parser.add_argument("--dump-output", action="store_true", help="Print parsed Atlas JSON for debugging")
    args = parser.parse_args()

    fixture = load_json(args.fixture)
    raw = run_atlas(fixture, args.atlas_cmd)
    output = parse_atlas_output(raw)
    failures = evaluate_expectations(fixture, output)

    if args.dump_output:
        print(json.dumps(output, indent=2))

    if failures:
        print(f"FAIL {fixture.get('name', args.fixture.name)}")
        for failure in failures:
            print(f" - {failure.path}: {failure.message}")
        return 1

    print(f"PASS {fixture.get('name', args.fixture.name)} :: blocks={summarize(output)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
