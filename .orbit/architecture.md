# Architecture: PRD

## Overview
Orbit acts as a high-discipline orchestration layer on top of Google Antigravity IDE and Gemini. It manages persistent context, provisions relevant capabilities, and enforces deterministic verification.

## Architectural Components
- Native Antigravity primitives (.agents/rules/ & .agents/skills/)
- Persistent project context in .orbit/
- Pinned upstream ECC capability source (.orbit/ecc.lock)
- Deterministic verification and health check suite

## Hierarchy of Primitives
```text
User Request
    ↓
Orbit Contract (.agents/rules/orbit-project.md)
    ↓
Native Antigravity Skill Discovery (.agents/skills/)
    ↓
Autonomous Execution & Context (.orbit/)
    ↓
Verification Loop & Self-Test
```
