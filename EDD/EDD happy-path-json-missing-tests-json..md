<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Draft the matching happy-path.json, missing-tests.json, and bad-spec.json fixtures in final form for this Python runner.

I drafted the three fixtures in final JSON form so they match the Python runner’s schema exactly, including the `expects` patterns for `_min`, `_in`, exact equality, and `_contains` assertions.[^1]

## Fixture details

The happy-path fixture checks that Dot, Gil, Dev, and Reed all return contracted blocks, with minimum list lengths and a flexible Reed status so the workflow can pass even if review requests small changes. The missing-tests fixture intentionally sets `force_missing_tests: true` and expects Dev to report `tests_added: false` while Reed responds with `changes-requested` and at least one tech-debt item, which is basically your eval version of “nice try, but where are the tests, champ?”[^1]

## Escalation case

The bad-spec fixture is designed to stop the workflow early by requiring Atlas to return an escalation block with `action`, `to`, and a `reason` containing the word “ambiguous.” That matches the current runner logic, which does not require downstream Dot/Gil/Dev/Reed blocks unless those agents appear in the fixture’s `expects` section.[^1]

## One useful caution

Because the runner implements `_min` as a minimum list length check, fields like `open_questions_min` and `tech_debt_min` are valid even when set to `0`, which gives you a deterministic contract without forcing extra filler content. Also, the runner’s `status_in` support is a nice little escape hatch for realistic variation, since LLM reviewers can be like professors grading essays: technically consistent, emotionally unpredictable.[^1]

If you want, I can next produce a small `atlas_entry.py` mock so you can run these fixtures end-to-end before wiring them to the real repository orchestration.[^1]

<div align="center">⁂</div>

[^1]: https://github.com/tim-dickey/Engineering-factory-ai

