# Dompet cloud + AI

## Approved scope
- Web Android-style, desktop responsive. Google + email/password, private cloud data per user.
- Multi wallets, income/expense/transfer; IDR/USD/EUR/SGD/MYR/JPY with dated live FX; id/en/ms/ja/zh.
- Actual AI categorization, voice receipt parsing and financial analysis, review before save.
- Category budgets, goals, recurring bills/subscriptions, export/import backup.

## Architecture
- Better Auth + managed Google. Protected oRPC, Drizzle/Turso. Private versioned financial document per user; atomic optimistic revision checks prevent silent overwrites across devices.
- Shared Zod validation for wallets/transactions/goals/recurring/preferences. Transfer one atomic record excluded from spend.
- AI Gateway Gemini Flash; protected server calls only. Voice browser recording WAV and image downscale transient upload through oRPC, no stored receipt originals.
- Frankfurter server fetch with dated per-currency rates, no invented fallback rates.
- Existing local data migrated only on explicit user action.

## Progress
- [x] Scope confirmed, relevant skills read, credentials verified present without exposing values.
- [ ] Auth/database + finance API
- [ ] AI + FX API
- [ ] New multilingual responsive UI
- [ ] Migrate/import/export, recurring, goals, budgets
- [ ] Build/lint + real end-to-end testing of auth isolation/cloud/AI/FX
- [ ] Deliver updated website