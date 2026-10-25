# Apex Motors - Submission Progress Checklist

## Current state

- [x] Reviewed the assignment brief and identified required deliverables.
- [x] Created a React + TypeScript + Tailwind frontend and Express + TypeScript + SQLite backend.
- [x] Implemented JWT registration/login, protected vehicle endpoints, role checks, durable inventory, and atomic purchase protection.
- [x] Created seeded demo inventory and pre-configured administrator and customer accounts.
- [x] Added persistent `kms_driven`, `fuel_type`, and `city` fields with safe migration handling.
- [x] Upgraded customer catalogue to full showroom experience with brand, fuel, budget, category, year, and KM-driven filters.
- [x] Added accurate buyer-facing metadata (year, kilometres, fuel, city, price) and verified brand-accurate photos.
- [x] Built interactive vehicle detail modal with full specifications and 160-point certification perks.
- [x] Ensured internal stock counts and inventory valuation remain admin-only.
- [x] Refactored frontend into modular, readable components (`Navbar`, `ShowroomHero`, `ShowroomFilters`, `VehicleCard`, `VehicleDetailModal`, `AdminManager`, `PurchaseHistoryModal`, `AuthView`).
- [x] Built complete admin operations console: add, edit, delete, restock, and warehouse risk metrics.
- [x] Built customer purchase history modal with verified transaction records.
- [x] Added comprehensive automated tests (15 backend + 7 frontend = 22 tests passing).
- [x] Verified production build (`npm run build`) and test suite (`npm test`).
- [x] Manually tested customer and administrator journeys via browser subagent.
- [x] Captured 6 real screenshots under `screenshots/` and embedded them in `README.md`.
- [x] Updated `TEST_REPORT.md` and `README.md` with complete documentation, architecture, and AI usage statement.
- [x] Push to a public GitHub/GitLab repository and submit its link.
- [x] Review `PROMPTS.md` and ensure public raw chat links meet assessor requirements.
- [x] Optional: deploy frontend/API and add live deployment link to README.

## Verification Commands

```bash
npm run dev                  # Start full-stack application (API on :4000, Web on :5173)
npm test                     # Run complete 22-test automated suite (backend + frontend)
npm run build                # Run full production TypeScript & Vite compilation
```
