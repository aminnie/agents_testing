# Review Agent Prompt Template (V2)

Use this template for final quality/security review after implementation and verification.

## Purpose

Provide findings-first, severity-ordered code review focused on correctness, security, regressions, and test adequacy.

## Inputs

- Active change set (changed files first).
- Project standards from `AGENTS.md`.
- Relevant requirements file under `requirements/` for expected behavior.

## Scope

- Review-first behavior with concrete, actionable findings.
- Prioritize user-visible correctness and security over style preferences.
- Keep recommendations low-churn and compatible unless requirements explicitly demand otherwise.

## Review Priorities

1. **Behavioral correctness and regressions**
2. **Security and data exposure risks**
3. **Authorization/authentication and boundary validation**
4. **Error handling and resilience**
5. **Test coverage for critical paths and negative cases**
6. **Maintainability and complexity risks**

## Process Rules

1. Review changed files before unrelated files.
2. Use evidence-based findings with file references.
3. Report findings in severity order: `Critical`, `High`, `Medium`, `Low`.
4. Start with findings; do not lead with a broad summary.
5. Include why each finding matters and the safest fix direction.

## Hard-Stop Rule

If any unresolved `Critical` or `High` findings remain:
- Set `Status: Blocked pending fixes or explicit approval`.
- Do not mark the review as complete.

## Required Output Format

1. **Findings** (ordered by severity):
   - `Critical`: release-blocking correctness/security issues
   - `High`: major regression/security risks
   - `Medium`: robustness/maintainability issues
   - `Low`: minor improvements
2. **Open Questions / Assumptions**
3. **Residual Risks / Test Gaps**
4. **Fix Plan**
   - What to fix now (`Critical`/`High`)
   - What can be follow-up (`Medium`/`Low`)
5. **Status**
   - `Ready for handoff`
   - `Blocked pending fixes or explicit approval`
6. **Requirements File Update**
   - Write the final review output into the active requirements artifact under:
     - `## Review Results`
   - Include, at minimum:
     - findings summary by severity
     - unresolved items (if any)
     - final review status

If no findings are discovered, explicitly state that and include remaining test limitations.

## Integration into Implementation Phase

Use this agent at the end of implementation:

1. Implementation completes.
2. Verification passes (`npm run test:e2e`, `npm run test:a11y`, and any feature-specific checks).
3. Run review against changed files.
4. Fix all unresolved `Critical`/`High` findings.
5. Write/update `## Review Results` in the active `requirements/product_*.md` file.
6. Re-run verification and provide final review status.

## Trigger Rule

When a user requests a review (for example: "review this", "run code review", or "final review"), this file is the default rubric and must be applied before producing review output.
