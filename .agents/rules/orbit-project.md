# Orbit Project Operating Contract (Antigravity IDE)

## Mission & Purpose
This workspace operates under the **Orbit Autonomous Context & Execution Protocol**.
Your role as the Antigravity agent is to autonomously understand user requests, inspect context, discover and leverage relevant skills, execute safe operations without unnecessary approval roadblocks, and verify all outcomes with empirical evidence.

---

## 15-Point Operating Protocol

1. **Understand Intent First**: Deconstruct the user's goal, technical context, and desired end state before taking action.
2. **Inspect Before Modifying**: Inspect existing files, configuration, and repository structure before drafting or editing code.
3. **Determine Outcome**: Focus on delivering concrete, functional, and verifiable solutions rather than shallow boilerplate.
4. **Consult Project Context**: Read and align with [`Rona_PRD.md`](file:///d:/Projek%20Gabut/Rona%20-%20Ambient%20Ekstension/Rona_PRD.md), [`.agents/rules/rona-prd.md`](file:///d:/Projek%20Gabut/Rona%20-%20Ambient%20Ekstension/.agents/rules/rona-prd.md), as well as `.orbit/` context files.
5. **Autonomously Discover Skills**: Check available workspace skills under `.agents/skills/` and match skills to the user's request automatically.
6. **Apply Relevant ECC Skills**: When working on tasks (e.g. verification, TDD, security review, backend patterns), invoke the corresponding skill instructions directly without requiring the user to prompt for it.
7. **Honor Existing Conventions**: Follow existing code formatting, architectural style, and naming conventions in the project.
8. **Research Empirical Facts**: Look up current documentation or repository sources when external dependencies or APIs are involved.
9. **Source of Truth Hierarchy**: Prefer (1) Primary official docs, (2) Codebase evidence, (3) Upstream specifications over assumptions.
10. **Do Not Guess / No Invention**: Never fabricate API signatures, unsupported frameworks, requirements, or fake benchmarks. Infer intent, but verify facts.
11. **Track Unknowns**: Record unresolved technical ambiguities in `.orbit/unknowns.md` rather than making unverified guesses.
12. **Autonomous Execution by Default**: Safely perform reads, edits, dependency installs, builds, and test runs autonomously. Request user confirmation ONLY for destructive or irreversible actions (e.g. database drop, credential revocation, production deploy).
13. **Mandatory Functional Verification**: Never report a task as complete purely because code was generated. Run tests, typecheck, or build commands to prove correctness.
14. **Pre-Completion Review**: Review diffs, confirm all acceptance criteria are met, and ensure no regressions were introduced.
15. **Maintain Project State**: Update `.orbit/state.md` and `.orbit/decisions.md` whenever significant milestones, architectural decisions, or state changes occur.

---

## Skill Activation Matrix (Progressive Disclosure)
When the user gives a natural language request, match against active workspace skills:
- **Testing & Verification** -> Read `.agents/skills/verification-loop/SKILL.md` or `tdd-workflow/SKILL.md`
- **Security & Vulnerability Audit** -> Read `.agents/skills/security-review/SKILL.md`
- **Architectural & Design Decisions** -> Read `.agents/skills/architecture-decision-records/SKILL.md`
- **Autonomous Multi-step Execution** -> Read `.agents/skills/autonomous-loops/SKILL.md`
- **Repository Scans & Dependency Checks** -> Read `.agents/skills/repo-scan/SKILL.md`
- **Backend / API Implementation** -> Read `.agents/skills/backend-patterns/SKILL.md`
