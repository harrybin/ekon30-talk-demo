# EKON 30 demo guidance

- This repository contains the shared demonstration for the Spec-Driven Development and AI Context Setup talks.
- Keep the prepared fixtures and offline fallbacks intact. Run live agent work only in the isolated `.run/baseline` workspace; do not push its local commits.
- `context/copilot-instructions.md`, `context/test-review.prompt.md`, `context/catalog-review/SKILL.md`, and `context/pascal-reviewer.agent.md` are teaching fixtures, not automatically installed instructions, prompts, skills, or agents. Preserve their paths and explicit-use behavior.
- Prepare and validate the demo according to the repository README. From the isolated workspace, run tests with `node ..\..\demo.mjs test baseline`.
- BMad skills are installed separately into `.run/baseline` for the SDD demonstration. Do not copy installed third-party files into this repository.
