# Enterprise-Grade Conversion Recommendations

## Purpose

This document captures the enterprise-conversion discussion and recommended plan for evolving this application with scalability-first priorities while covering security, reliability, and governance.

Planning preference used:
- Primary focus: scalability
- Horizon: 0-3 months

## Executive Summary

The application has a solid product foundation and strong E2E/a11y regression coverage, but it is not yet enterprise-ready for multi-instance production scale. The largest constraints are:
1. In-memory session/token model that does not scale across replicas.
2. Local file-based SQLite storage that limits high-availability and horizontal growth.
3. Limited production observability and formal CI/CD governance controls.

The proposed 90-day path prioritizes removing scaling bottlenecks first, then hardening security and reliability controls while introducing architectural governance.

## Current-State Snapshot (Practical View)

- Frontend: React + Vite SPA with client-side routing.
- Backend: Node.js + Express monolith API process.
- Data: SQLite file database with startup schema/migration behavior.
- Auth/session: bearer token model with client persistence and in-memory server-side token store.
- Delivery controls: strong script-driven validation (`test:e2e`, `test:a11y`, `workflow:final-pass`) and Jira workflow integration.
- Gaps: limited distributed-runtime readiness, limited observability stack, and CI policy mostly process/script enforced instead of platform-enforced.

## Enterprise Recommendations

### 1) Scalability (Primary)

1. Externalize session state (Redis or equivalent).
2. Plan and execute SQLite to managed Postgres migration.
3. Move schema changes to controlled migration framework (not implicit startup mutations).
4. Add targeted caching for high-read paths and API performance budgets.

Success metrics:
- Multi-instance session continuity validated.
- p95 latency and error-rate targets documented and met for core flows.
- Database migration rehearsal completed on staging-like data.

### 2) Security

1. Replace risky token persistence model with hardened session strategy.
2. Add rate limiting for auth and checkout endpoints.
3. Enforce secure secrets handling and remove plaintext local credential patterns from operational workflows.
4. Add strict security headers and environment-aware CORS policy.

Success metrics:
- Zero critical/high unresolved auth/session security findings.
- Abuse/throttle scenarios covered in automated tests.
- Secrets policy enforced in team workflow.

### 3) Reliability and SRE

1. Introduce structured logs with correlation IDs.
2. Add metrics/tracing dashboards for golden signals.
3. Define SLOs and alerting for checkout and API availability.
4. Create and test backup/restore and incident runbooks.

Success metrics:
- Mean time to detect and triage incidents reduced.
- SLO baselines established and monitored.
- Successful backup/restore drill with measured RTO/RPO.

### 4) CI/CD and Governance

1. Convert script-centric gates into enforced CI required checks.
2. Add branch protection and release promotion controls.
3. Add security scanning gates (SAST/SCA policy) with approval-based exception process.
4. Establish architecture decision records (ADRs) and NFR acceptance checkpoints.

Success metrics:
- All merges gated by required checks.
- Traceable release approvals and promotion history.
- NFR criteria visible in planning and release readiness.

## 90-Day Roadmap

### Phase 1 (Days 0-30): Foundation

- Finalize target session architecture.
- Add rate limiting to critical endpoints.
- Define migration strategy for data/session stores.
- Implement structured logging + correlation IDs.
- Establish CI required checks and branch protections.

### Phase 2 (Days 31-60): Scale Enablement

- Implement shared session store.
- Execute Postgres migration spike and staging validation.
- Introduce controlled DB migration tooling.
- Add initial dashboards/alerts and performance baselines.

### Phase 3 (Days 61-90): Production Hardening

- Complete phased cutover plans and rollback playbooks.
- Finalize SLOs and incident runbooks.
- Enforce governance checks in release flow.
- Measure outcomes against enterprise readiness checklist.

## Jira Tracking Artifacts Created

### Epics

- SCRUM-7: Security and Identity Foundation
- SCRUM-8: Scalable Sessions and Data Layer
- SCRUM-9: Reliability, Observability and SRE
- SCRUM-10: CI/CD Governance and Release Controls
- SCRUM-11: Architecture Modernization Guardrails

### Initial Stories

- SCRUM-12: Security session/token model definition and implementation plan
- SCRUM-13: Externalize session storage to shared cache
- SCRUM-14: Postgres migration spike and target schema plan
- SCRUM-15: Structured logging with correlation IDs
- SCRUM-16: CI required checks and branch protection
- SCRUM-17: API rate limiting for auth and checkout endpoints

## Definition of Enterprise-Ready (Initial)

The system is considered materially enterprise-improved when:
1. Session and data layers support multi-instance deployment.
2. Security controls are proactive (not only reactive) and continuously enforced.
3. Reliability is measured with SLOs, dashboards, and tested runbooks.
4. CI/CD and architectural governance are enforced by platform policy.
5. Release readiness includes both functional and non-functional quality gates.

## Notes

- This is a planning artifact intended to drive Jira execution and sequencing.
- No product code changes are required to use this document as a tracking baseline.
