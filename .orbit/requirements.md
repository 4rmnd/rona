# Requirements: PRD

## Normalized Requirements
- orbit init @PRD.md idempotently initializes project context
- Select and provision relevant ECC skills into .agents/skills/
- Install Orbit project operating contract into .agents/rules/orbit-project.md
- Execute agent tasks autonomously with verification loop
- Support orbit doctor, orbit status, and orbit update

## Acceptance Criteria
- [x] Functional CLI `orbit init <spec>`
- [x] Selective ECC skill provisioning into `.agents/skills/`
- [x] Operating contract in `.agents/rules/orbit-project.md`
- [x] Pinned ECC lockfile in `.orbit/ecc.lock`
- [x] Real functional self-verification suite
