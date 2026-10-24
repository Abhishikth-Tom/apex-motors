# Apex Motors - Test Execution Report

## Execution Summary

- **Root Test Command**: `npm test`
- **Total Tests Passed**: **22 passed across 2 test suites (100% pass rate)**
- **Execution Date**: 2026-10-24

```text
 ✓ tests/api.test.ts (15 tests) 3714ms
   ✓ authentication and access control > registers a user and permits authenticated catalogue access
   ✓ authentication and access control > rejects duplicate email registrations
   ✓ authentication and access control > rejects login with invalid credentials
   ✓ authentication and access control > blocks customers from adding vehicles
   ✓ authentication and access control > blocks regular customers from internal health dashboard metrics
   ✓ purchasing and inventory safety > decrements stock atomically once and prevents overselling
   ✓ purchasing and inventory safety > records purchases in customer purchase history
   ✓ vehicle search and showroom filters > filters the protected catalogue by make and category
   ✓ vehicle search and showroom filters > filters vehicles by fuel and maximum kilometres
   ✓ vehicle search and showroom filters > filters vehicles by budget and model year
   ✓ administrator controls and inventory management > adds a new vehicle with complete showroom specifications
   ✓ administrator controls and inventory management > updates vehicle specifications including price, kilometres, and location
   ✓ administrator controls and inventory management > restocks a vehicle and rejects invalid quantities
   ✓ administrator controls and inventory management > deletes a vehicle for admin and blocks standard users
   ✓ administrator controls and inventory management > returns real stock-risk metrics for the admin dashboard

 ✓ src/showroom.test.tsx (7 tests) 181ms
   ✓ Showroom VehicleCard > renders accurate buyer-facing card metadata without exposing raw stock count
   ✓ Showroom VehicleCard > disables purchase button and displays sold-out status when vehicle quantity is 0
   ✓ Showroom VehicleCard > exposes admin stock counts and controls only when isAdmin is true
   ✓ ShowroomHero and Inventory Health visibility > hides inventory health dashboard and total valuation from standard buyers
   ✓ ShowroomHero and Inventory Health visibility > displays operational stock metrics only to administrators
   ✓ VehicleDetailModal > displays complete vehicle specifications, inspection perks, and purchase action
   ✓ ShowroomFilters > allows filtering by brand, fuel, category, budget, and KM-driven
```

---

## Detailed Test Coverage by Domain

| Domain | Test Suite | Verified Behaviour | Result |
| :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | `backend/tests/api.test.ts` | JWT registration, login verification, password hashing, customer vs administrator permission enforcement | **PASS** |
| **Data Integrity & Concurrency** | `backend/tests/api.test.ts` | Concurrency boundary: `UPDATE vehicles SET quantity = quantity - 1 WHERE quantity > 0` in an atomic SQLite transaction strictly prevents overselling / negative stock | **PASS** |
| **Showroom Query & Filters** | `backend/tests/api.test.ts` | Search across brand, category, fuel type, maximum budget, model year, and mileage limits | **PASS** |
| **Operational Stock Controls** | `backend/tests/api.test.ts` | Admin vehicle creation with complete specs (kmsDriven, fuelType, city), updates, restock validation, and deletion | **PASS** |
| **Warehouse Privacy** | `backend/tests/api.test.ts` | Non-admin users are blocked from internal inventory valuation and risk health metrics (`/api/dashboard`) | **PASS** |
| **Order History** | `backend/tests/api.test.ts` | Purchase transactions persist to customer's personal order history (`/api/purchases/me`) | **PASS** |
| **Buyer UI Experience** | `frontend/src/showroom.test.tsx` | Showroom cards display registration year, odometer, fuel, city, and INR price without exposing raw warehouse counts | **PASS** |
| **Sold-Out Prevention UI** | `frontend/src/showroom.test.tsx` | Purchase button is disabled when quantity is zero, showing "Sold Out" state | **PASS** |
| **Interactive Modal** | `frontend/src/showroom.test.tsx` | Detailed specifications modal displays 160-point certified guarantee and instant purchase action | **PASS** |
| **Showroom Facet Filtering** | `frontend/src/showroom.test.tsx` | Brand, category, fuel, budget, and mileage filters update view dynamically with clear reset handling | **PASS** |

---

## Build & Asset Verification

- **Frontend Production Bundle**: `npm run build --workspace=frontend` builds cleanly with Vite and TypeScript compiler (`tsc -b`).
- **Backend Typecheck**: `npm run build --workspace=backend` passes with zero TypeScript diagnostic errors.
- **Seeded Inventory Imagery**: Verified brand-accurate high-resolution showroom photography for Tata Nexon EV, Mahindra XUV 700, and Hyundai Verna.
