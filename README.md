# Apex Motors Inventory

A responsive full-stack car-dealership inventory system built for the TDD Kata. Customers can register, browse live inventory, search vehicles, and purchase an in-stock vehicle. Administrators can add, remove, and restock vehicles.

## Stack

- React, TypeScript, Vite, Tailwind CSS
- Express, TypeScript, SQLite (`better-sqlite3`)
- JWT authentication, bcrypt password hashing
- Vitest and Supertest

## Run locally

```bash
npm install
npm run dev
```

The API starts at `http://localhost:4000`; the frontend starts at `http://localhost:5173`.

For production validation, run `npm run build`. For API tests, run `npm run test --workspace=backend`.

## Demo administrator

`admin@apexmotors.test` / `Admin123!`

The database is persisted in `data/dealership.db`. It is created and seeded on the first backend start.

## API overview

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login` |
| Catalogue | `GET /api/vehicles`, `GET /api/vehicles/search` |
| Admin inventory | `POST`, `PUT`, `DELETE /api/vehicles/:id` and `POST /api/vehicles/:id/restock` |
| Purchase | `POST /api/vehicles/:id/purchase` |

All vehicle endpoints require a bearer token. Deleting, adding, updating, and restocking require an admin role. Purchase uses a single SQLite transaction with `quantity > 0`, so inventory cannot go below zero.

## Testing

The current automated results are in [TEST_REPORT.md](TEST_REPORT.md). Tests cover registration/authentication, access control, search, restocking validation, and the stock-decrement boundary.

## Screenshots

Run the app locally, sign in as the demo administrator, and capture the login page, customer catalogue, sold-out state, and admin manager before submission. Save them under `screenshots/` and replace this note with embedded images.

## My AI Usage

I used OpenAI Codex as a pair-programming tool to decompose the assignment, draft the initial test and implementation structure, diagnose build configuration, and help create UI and documentation. I reviewed every generated change, ran the automated tests and production build, and remained responsible for the architecture, data validation, access control, and stock-safety behavior. AI made boilerplate and iteration faster; it did not replace my testing or understanding of the final system. Every AI-assisted commit includes an accurate co-author trailer. The raw conversation record is listed in [PROMPTS.md](PROMPTS.md).

## Interview notes

Be ready to explain JWT bearer authentication, why passwords are bcrypt hashes, the difference between authentication and role authorization, and why `UPDATE ... WHERE quantity > 0` within a transaction prevents overselling.
