# Feature 2 Analysis

## Original Feature Requirements

As the store Product Manager, I would like to add a new feature that enables roles to be assigned to every user in the system.

1. Add a role type table to the database that contains:
   - role id (unique key)
   - role name (descriptive, max 15 chars, used in UI dropdown)
2. Add a role id column to the users table and populate with:
   - id = 1, admin
   - id = 2, manager
   - id = 3, user
   - id = 4, editor
3. Update user role assignments using email contains rules:
   - contains "admin" -> role id 1
   - contains "manager" -> role id 2
   - contains "user" -> role id 3
   - contains "editor" -> role id 4

## Current State Observations

- Backend currently stores role as free-text `users.role` (`customer`, `manager`, `editor`, `admin`) in `app/backend/src/db.js`.
- Authorization checks (for catalog creation) depend on string role values in `app/backend/src/server.js`.
- Login API returns string role in the user payload (`SELECT id, email, role ...`).
- Existing fixtures/specs use `customer` role language; this conflicts with a canonical role set of `admin/manager/user/editor`.

## Architecture Decision

Implement role normalization with a compatibility-first migration:

- Introduce a new `role_types` lookup table and new `users.role_id` foreign key.
- Keep existing `users.role` temporarily during migration to avoid breaking current auth/spec flows.
- Update backend auth checks to resolve role from `role_types` via `role_id`.
- Return both `role` (legacy string) and `roleId` (new numeric value) in login payload during transition.
- Backfill `role_id` deterministically from email-rule requirements, with explicit fallback handling for unmatched users.

This minimizes runtime risk while enabling the target normalized model.

## Data Model Design

### `role_types` (new)

- `id INTEGER PRIMARY KEY`
- `name TEXT UNIQUE NOT NULL CHECK(length(name) <= 15)`

Seed data:

- `(1, 'admin')`
- `(2, 'manager')`
- `(3, 'user')`
- `(4, 'editor')`

### `users` (existing + migration)

- Add `role_id INTEGER REFERENCES role_types(id)`
- Keep existing `role TEXT NOT NULL` initially for compatibility
- Add index `idx_users_role_id` for future role queries

## Migration and Backfill Strategy

1. Create `role_types` if missing.
2. Upsert fixed seed role rows (ids 1/2/3/4).
3. Add nullable `users.role_id` if missing.
4. Backfill `users.role_id` with case-insensitive email mapping:
   - `%admin%` -> `1`
   - `%manager%` -> `2`
   - `%user%` -> `3`
   - `%editor%` -> `4`
5. Explicit legacy mapping rule:
   - legacy `customer` users map to role id `3` (`user`).
6. Set default fallback for non-matching users to role id `3` (`user`).
7. Once all rows are populated, enforce not-null semantics in code path (SQLite table rebuild for hard NOT NULL can be deferred).
8. Update auth and response mappings to read role from joined `role_types`.

## Backend API and Authorization Impact

- `POST /api/login`:
  - Change query to join `users` + `role_types`.
  - Return `{ id, email, roleId, role }` where `role` is role type name.
- `requireCatalogOwner` middleware:
  - Resolve role from `role_id`/join and keep authorization rule `manager|admin`.
- Seed user handling in `db.js`:
  - Ensure new users are inserted with `role_id` aligned to target roles.

## Compatibility and Risk Notes

- Existing `customer` concept in seed/fixtures is mapped to canonical `user` (role id `3`) during migration.
- Email-derived assignment is brittle and can misclassify users if naming conventions drift.
- Immediate removal of `users.role` would likely break existing tests and any frontend code expecting string role.

## Implementation Map

### Files to Modify

- `app/backend/src/db.js`
  - Add `role_types` table creation + seeding.
  - Add `users.role_id` migration/backfill.
  - Adjust seed user insert path to include `role_id`.

- `app/backend/src/server.js`
  - Update login query to return joined role data.
  - Update authorization lookup for role checks.

- `README.md`
  - Align demo users/role documentation with normalized role model.

- `specs/*.feature` and `cypress/fixtures/users/default-user.json` (as needed)
  - Replace `customer` references if canonical role model changes.

## Build Sequence

- [ ] Phase 1: schema migration (`role_types`, `users.role_id`, index)
- [ ] Phase 2: deterministic data backfill and seed alignment
- [ ] Phase 3: API/auth path updates using normalized roles
- [ ] Phase 4: fixture/spec updates for role naming consistency
- [ ] Phase 5: regression run for login/catalog/checkout flows

## Open Questions

1. Is there an existing user-management UI where the role dropdown is needed now, or is this backend-only for this iteration?

## What Changed

- Implemented `role_types` schema support with seeded roles: admin (1), manager (2), user (3), editor (4).
- Added `users.role_id` migration/backfill in backend bootstrap, including deterministic email mapping, fallback to `user` (3), and explicit `customer -> user` mapping.
- Updated backend auth/login flow to use normalized role joins and return both `role` and `roleId` in login responses (plus `legacyRole` for transition safety).
- Hardened backend defaults by disabling Express `x-powered-by` header exposure.
- Updated specs/fixtures/docs to reflect canonical `user` role terminology (`customer` mapped to `user`).

### File-by-File Checklist

- [x] `app/backend/src/db.js`
  - Added `role_types` table bootstrap and seeded fixed role IDs.
  - Added `users.role_id` migration path and index creation.
  - Added deterministic backfill logic and normalized `customer -> user`.
  - Updated seed users to canonical role naming.

- [x] `app/backend/src/server.js`
  - Updated login query to join `role_types` through `users.role_id`.
  - Updated login response to include `role`, `roleId`, and transitional `legacyRole`.
  - Updated role-guard logic for catalog creation to use normalized role resolution.
  - Added `app.disable("x-powered-by")` for reduced information exposure.

- [x] `cypress/fixtures/users/default-user.json`
  - Updated fixture role from `customer` to `user`.

- [x] `specs/catalog-cart.feature`
  - Updated background role from `"customer"` to `"user"`.

- [x] `specs/checkout.feature`
  - Updated background role from `"customer"` to `"user"`.

- [x] `README.md`
  - Added normalized role ID mapping (1-4) in demo/user documentation.
  - Documented login API returning normalized role fields.

- [x] `requirements/analysis_feature2.md`
  - Updated with architecture and implementation outcomes for Feature 2.
