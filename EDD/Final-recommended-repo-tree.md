<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Produce a final recommended repo tree and exact destination paths for all of these files inside Engineering-factory-ai.

Here’s a clean final placement plan for adding the eval harness into `Engineering-factory-ai`: put fixtures under a new top-level `evals/` tree, keep the executable test scripts under `.factory/tests/`, and store the workflow contract under `.factory/contracts/` so it sits near the existing Factory conventions and validation machinery.[^1]

## Recommended tree

This structure keeps eval data separate from agent definitions while still letting `.factory/tests` act as the repo’s quality gate, which matches the repo direction you described around validation and orchestration quality.[^1]

```text
Engineering-factory-ai/
├─ .factory/
│  ├─ agents/
│  │  ├─ orchestrator.md                  # update Atlas validation/escalation rules
│  │  ├─ code-writer.md                   # update Dev test-reporting contract
│  │  └─ code-reviewer.md                 # update Reed decision/tech-debt contract
│  ├─ contracts/
│  │  └─ spec-to-implementation.md        # NEW workflow contract
│  ├─ tests/
│  │  ├─ validate.sh                      # update to add Check 11
│  │  ├─ validate.ps1                     # update to add Check 11
│  │  ├─ run-evals.sh                     # NEW shell eval launcher
│  │  ├─ run-evals.ps1                    # NEW PowerShell eval launcher
│  │  ├─ spec_to_impl_eval_runner.py      # NEW Python eval runner
│  │  └─ atlas_entry.py                   # NEW mock Atlas entry for local harness
│  └─ workflows/
│     └─ ...                              # existing workflow docs
├─ evals/
│  └─ workflows/
│     └─ spec-to-implementation/
│        ├─ happy-path.json               # NEW fixture
│        ├─ missing-tests.json            # NEW fixture
│        └─ bad-spec.json                 # NEW fixture
├─ .github/
│  └─ workflows/
│     └─ validate.yml                     # update so validator runs evals in CI
└─ ROADMAP.md                             # update with EDD rollout plan
```


## Exact destinations

Use these exact destination paths for the files we drafted so the harness behaves consistently across Bash, PowerShell, and CI, instead of becoming one of those “works on my machine” museum exhibits from the ancient age of software.[^2]

- `.factory/tests/spec_to_impl_eval_runner.py` — move the Python runner here.[^3]
- `.factory/tests/atlas_entry.py` — move the mock Atlas entry here for local end-to-end harness runs.[^3]
- `.factory/tests/run-evals.sh` — shell launcher.[^3]
- `.factory/tests/run-evals.ps1` — PowerShell launcher.[^3]
- `evals/workflows/spec-to-implementation/happy-path.json` — happy-path fixture.[^3]
- `evals/workflows/spec-to-implementation/missing-tests.json` — missing-tests fixture.[^3]
- `evals/workflows/spec-to-implementation/bad-spec.json` — bad-spec escalation fixture.[^3]
- `.factory/contracts/spec-to-implementation.md` — workflow contract doc.[^3]


## Script path updates

Because the tiny launchers were built as a self-contained demo, you should now update them so `.factory/tests/` points back to the repo-root `evals/` directory rather than looking for a sibling `fixtures/` folder. In practice, the shell and PowerShell launchers should compute repo root as two levels above `.factory/tests`, then call `.factory/tests/spec_to_impl_eval_runner.py` with fixtures from `evals/workflows/spec-to-implementation/*.json` and `--atlas-cmd "python .factory/tests/atlas_entry.py"` during mock mode.[^3]

## Validation integration

Add a new “Check 11” to `.factory/tests/validate.sh` and `.factory/tests/validate.ps1` that simply runs the matching `run-evals` script, because testing becomes the guardrail that keeps agent changes from quietly breaking orchestration quality. Update `.github/workflows/validate.yml` so the existing validation job calls the repo validator, which will now include evals automatically rather than creating a separate parallel quality system.[^2][^1][^3]

## Mock versus real mode

Keep `atlas_entry.py` in the repo at first as a harness stub, but treat it as temporary scaffolding: it helps validate the eval framework before wiring it to the real orchestrator, the same way early flight simulators let pilots crash safely before trying the actual airplane. Once the real Atlas entrypoint exists, you can either replace the mock command in `run-evals.*` or support two modes like `MOCK_ATLAS=1` for local testing and real orchestration in CI or staged environments.[^3]

If you want, I can next rewrite `run-evals.sh` and `run-evals.ps1` in their final repo-aware form with the corrected `Engineering-factory-ai` paths.[^3]
<span style="display:none">[^10][^11][^12][^13][^14][^15][^16][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://www.nea.com/blog/factory-the-platform-for-agent-native-development

[^2]: https://maxcorbridge.substack.com/p/update-41-ai-software-factories

[^3]: https://github.com/tim-dickey/Engineering-factory-ai

[^4]: https://factory.ai/news?category=engineering

[^5]: https://x.com/APLDdigital/status/2038651894256787850

[^6]: https://factory.ai/news?category=research

[^7]: https://www.youtube.com/watch?v=zNXJVeGcUmw

[^8]: https://www.powershellgallery.com/packages/TMF/2.0.20923-preview/Content/internal\functions\validate\Validate-ApprovalStage.ps1

[^9]: https://www.synera.io/news/from-fragmented-to-future-ready-redesigning-engineering-workflows-for-agentic-ai

[^10]: https://www.youtube.com/watch?v=AvZeexWlIM4

[^11]: https://community.chocolatey.org/packages/dbatools/0.9.732

[^12]: https://www.decodingai.com/p/ai-agents-foundations-course

[^13]: https://www.youtube.com/watch?v=QSUY9Za38Kc

[^14]: https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nbsir87-3543.pdf

[^15]: https://archive.newportbeachlibrary.org/NBPL/DocView.aspx?id=1212136\&dbid=0\&repo=CNB

[^16]: https://www.cs.ucr.edu/~ygu/thesis.pdf

