#!/usr/bin/env python3
import json
import sys
from typing import Any, Dict, List


def load_stdin() -> Dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw:
        raise SystemExit("Expected JSON payload on stdin")
    return json.loads(raw)


def normalize_story(fixture: Dict[str, Any]) -> Dict[str, Any]:
    return fixture.get("input", {}).get("story", {})


def is_ambiguous_story(story: Dict[str, Any]) -> bool:
    title = str(story.get("title", "")).lower()
    description = str(story.get("description", "")).lower()
    acceptance_criteria = story.get("acceptance_criteria", [])
    vague_phrases = [
        "improve performance",
        "make the app faster",
        "improve ux",
        "make it better",
    ]
    return (not acceptance_criteria) or any(p in title or p in description for p in vague_phrases)


def build_dot(story: Dict[str, Any]) -> Dict[str, Any]:
    criteria = story.get("acceptance_criteria", [])
    constraints = story.get("constraints", []) or ["Follow existing repository patterns."]
    open_questions: List[str] = []

    if "password" in story.get("title", "").lower():
        open_questions = [
            "Should the reset token be single-use and invalidated after success?"
        ]
    elif "csv" in story.get("title", "").lower():
        open_questions = [
            "Should empty exports create a blank file or only show a validation message?"
        ]

    return {
        "story_id": story.get("id", "UNKNOWN-STORY"),
        "acceptance_criteria": criteria,
        "constraints": constraints,
        "open_questions": open_questions,
    }


def build_gil(story: Dict[str, Any]) -> Dict[str, Any]:
    title = story.get("title", "Implementation task")
    return {
        "steps": [
            {"id": "step-1", "summary": f"Review story and define implementation boundaries for {title}", "owner": "Dev"},
            {"id": "step-2", "summary": "Implement application changes and supporting domain logic", "owner": "Dev"},
            {"id": "step-3", "summary": "Add or update automated tests and validate expected behavior", "owner": "Dev"},
            {"id": "step-4", "summary": "Submit changes for code review with notes on risks and follow-ups", "owner": "Reed"}
        ]
    }


def build_dev(story: Dict[str, Any], force_missing_tests: bool) -> Dict[str, Any]:
    title = story.get("title", "feature").lower()
    changes = []

    if "password" in title:
        changes = [
            {"file": "src/auth/reset_password.py", "description": "Add reset token generation and verification flow."},
            {"file": "src/auth/emailer.py", "description": "Send reset email through the existing delivery service."},
            {"file": "tests/test_reset_password.py", "description": "Cover token expiry, invalid token, and successful reset behavior."}
        ]
    elif "csv" in title:
        changes = [
            {"file": "src/reports/export_transactions.py", "description": "Add CSV export for filtered transactions."},
            {"file": "src/ui/export_button.tsx", "description": "Wire export action to the reporting screen."}
        ]
        if not force_missing_tests:
            changes.append(
                {"file": "tests/test_export_transactions.py", "description": "Verify selected columns, date filtering, and empty results behavior."}
            )
    else:
        changes = [
            {"file": "src/app.py", "description": "Apply the requested feature updates."}
        ]
        if not force_missing_tests:
            changes.append(
                {"file": "tests/test_app.py", "description": "Add regression tests for the requested behavior."}
            )

    return {
        "changes": changes,
        "tests_added": not force_missing_tests,
    }


def build_reed(dev_block: Dict[str, Any], force_missing_tests: bool) -> Dict[str, Any]:
    if force_missing_tests or not dev_block.get("tests_added", False):
        return {
            "status": "changes-requested",
            "tech_debt": [
                {"id": "TD-TEST-COVERAGE", "summary": "Implementation lacks automated test coverage for the new behavior."}
            ]
        }

    return {
        "status": "approved",
        "tech_debt": []
    }


def build_output(payload: Dict[str, Any]) -> Dict[str, Any]:
    workflow = payload.get("workflow")
    fixture = payload.get("fixture", {})
    if workflow != "spec-to-implementation":
        return {
            "atlas": {
                "action": "escalate",
                "to": "orchestrator",
                "reason": f"Unsupported workflow: {workflow}"
            }
        }

    story = normalize_story(fixture)
    if is_ambiguous_story(story):
        return {
            "atlas": {
                "action": "escalate",
                "to": "po",
                "reason": "Story is ambiguous and does not provide enough acceptance criteria to proceed."
            }
        }

    force_missing_tests = bool(fixture.get("input", {}).get("force_missing_tests", False))
    dot = build_dot(story)
    gil = build_gil(story)
    dev = build_dev(story, force_missing_tests)
    reed = build_reed(dev, force_missing_tests)

    return {
        "atlas": {
            "action": "proceed",
            "workflow": "spec-to-implementation",
            "story_id": story.get("id", "UNKNOWN-STORY")
        },
        "dot": dot,
        "gil": gil,
        "dev": dev,
        "reed": reed
    }


def main() -> int:
    payload = load_stdin()
    output = build_output(payload)
    json.dump(output, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
