---
name: DB migrations non-interactive
description: drizzle-kit push blocks on data-loss confirmations in non-TTY shells; workaround using raw SQL.
---

When adding NOT NULL columns to tables that already have rows, `pnpm --filter @workspace/db run push` throws:
> "Interactive prompts require a TTY terminal"

**Fix:** Run the migration manually via `executeSql` in code_execution:
1. `ALTER TABLE t ADD COLUMN col type;` (nullable first)
2. `UPDATE t SET col = <default> WHERE col IS NULL;`
3. `ALTER TABLE t ALTER COLUMN col SET NOT NULL;`

Then re-run `pnpm --filter @workspace/db run push` for any remaining non-breaking schema changes (it will succeed since DB state already matches).

**Why:** drizzle-kit v0.31+ requires an interactive TTY to confirm data-loss statements. The Replit bash tool is non-interactive (no stdin/stdout TTY), so the prompt always errors out.

**How to apply:** Any time a new NOT NULL column without a server default is added to an existing table with data.
