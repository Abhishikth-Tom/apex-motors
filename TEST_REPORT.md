# Test Report

## Execution

Command: `npm run test --workspace=backend`

Latest verified result: **5 tests passed across 1 test file** (run locally on 2026-10-24).

## Covered behaviours

| Area | Evidence |
| --- | --- |
| Registration and JWT | A new valid user receives a token and accesses the protected catalogue. |
| Role access | A standard customer cannot create inventory. |
| Purchase safety | A one-unit vehicle can be purchased once; a second request returns `409` and stock remains zero. |
| Search | Make and category filters return only matching inventory. |
| Restock | An admin can add stock; zero is rejected. |

## Build validation

Command: `npm run build --workspace=frontend`

Result: completed successfully with Vite production output.

## Manual checks still required before submission

1. Start both services with `npm run dev`.
2. Register a customer and confirm the purchase button is disabled for the sold-out vehicle.
3. Sign in as the seeded administrator, add a vehicle, and remove it.
4. Capture the requested screenshots after those checks.
