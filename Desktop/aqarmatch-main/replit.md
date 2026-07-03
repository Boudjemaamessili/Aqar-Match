# عقارMatch

منصة ذكية للعقارات في الجزائر — يعلن البائعون بسعر معلن وسر، ويكتشف المشترون إن كانت ميزانيتهم تتطابق مع الحد الأدنى الخاص.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/aqar-match run dev` — run the frontend (port 21729)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only, requires TTY for data-loss changes)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui, Arabic RTL (Tajawal font)
- API: Express 5 + pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/listings.ts` — listings + matches tables
- `artifacts/api-server/src/routes/listings.ts` — all listing + match + renew + wilayat routes
- `artifacts/api-server/src/routes/sellers.ts` — seller inquiry dashboard route
- `artifacts/aqar-match/src/pages/` — all frontend pages
- `artifacts/aqar-match/src/components/listing-card.tsx` — reusable listing card with expiry badge

## Architecture decisions

- **Secret floor price**: stored in DB, never returned in any public GET endpoint. Only compared server-side during POST /listings/:id/match
- **Expiry system**: listings expire after 30 days (`LISTING_EXPIRY_DAYS` constant in DB schema). Expiry is computed both server-side (filtering) and client-side (badge display). Sellers can renew via POST /listings/:id/renew — renewing extends from max(today, current expiry) + 30 days
- **DB migration for non-null columns**: drizzle-kit push requires TTY for data-loss confirmations. Use raw SQL via `executeSql` in code_execution for such migrations, then re-run push for non-breaking changes
- **No auth**: sellers identified by phone number only (Algerian market assumption — phone is the primary identity)

## Product

- **Sellers**: Post a property with a public asking price and a secret floor price. Listing is active for 30 days and can be renewed
- **Buyers**: Browse listings by wilaya/municipality/deal type/budget, then check if their budget matches the seller's secret floor price
- **Inquiries dashboard**: Sellers enter their phone to see all match attempts (matched + unmatched) across all their listings, with renewal controls

## Gotchas

- `pnpm --filter @workspace/db run push` cannot run non-interactively for data-loss migrations — use raw SQL + code_execution instead
- After any `lib/*` change, run `pnpm run typecheck:libs` before artifact typechecks
- After any `openapi.yaml` change, run `pnpm --filter @workspace/api-spec run codegen`
- Wilayat list is hardcoded in `listings.ts` routes (58 Algerian provinces)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
