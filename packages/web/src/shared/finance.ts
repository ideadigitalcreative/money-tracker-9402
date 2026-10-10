import { z } from "zod";
export const currencies = ["IDR", "USD", "EUR", "SGD", "MYR", "JPY"] as const;
export const languages = ["id", "en", "ms", "ja", "zh"] as const;
export const categoryIds = [
  "food",
  "groceries",
  "travel",
  "shopping",
  "home",
  "insurance",
  "education",
  "entertainment",
  "internet",
  "water",
  "rent",
  "gym",
  "subscription",
  "vacation",
  "flight",
  "other",
] as const;
export const currencySchema = z.enum(currencies);
export const languageSchema = z.enum(languages);
const id = z.string().min(1).max(100);
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(v + "T12:00:00Z");
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Invalid date");
export const walletSchema = z.object({
  id,
  name: z.string().trim().min(1).max(80),
  currency: currencySchema,
  openingBalance: z.number().finite().min(-1e12).max(1e12),
  color: z.enum(["purple", "green", "blue", "orange", "pink"]),
});
export const entrySchema = z.object({
  id,
  name: z.string().trim().min(1).max(180),
  amount: z.number().finite().positive().max(1e12),
  currency: currencySchema,
  date: dateSchema,
  category: z.enum(categoryIds),
  walletId: id,
  kind: z.enum(["expense", "income", "transfer"]),
  toWalletId: id.optional(),
  receivedAmount: z.number().finite().positive().max(1e12).optional(),
  method: z.string().max(50).default(""),
  note: z.string().max(1000).default(""),
  recurringId: id.optional(),
  createdAt: z.string().max(40),
});
export const goalSchema = z.object({
  id,
  name: z.string().trim().min(1).max(100),
  target: z.number().positive().max(1e12),
  saved: z.number().nonnegative().max(1e12),
  currency: currencySchema,
  dueDate: dateSchema,
});
export const budgetSchema = z.object({
  id,
  category: z.enum(categoryIds),
  amount: z.number().positive().max(1e12),
  currency: currencySchema,
});
export const recurringSchema = z.object({
  id,
  name: z.string().trim().min(1).max(180),
  amount: z.number().positive().max(1e12),
  walletId: id,
  category: z.enum(categoryIds),
  nextDate: dateSchema,
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  kind: z.enum(["expense", "income"]),
  active: z.boolean(),
});
export const financeSchema = z
  .object({
    version: z.literal(2),
    wallets: z.array(walletSchema).max(50),
    entries: z.array(entrySchema).max(15000),
    goals: z.array(goalSchema).max(100),
    budgets: z.array(budgetSchema).max(100),
    recurring: z.array(recurringSchema).max(300),
    preferences: z.object({
      language: languageSchema,
      currency: currencySchema,
      monthlyBudget: z.number().positive().max(1e12),
    }),
  })
  .superRefine((s, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    const wallets = new Map(s.wallets.map((w) => [w.id, w]));
    for (const group of [s.wallets, s.entries, s.goals, s.budgets, s.recurring])
      if (new Set(group.map((x) => x.id)).size !== group.length) fail("Duplicate ids");
    if (!s.wallets.length) fail("At least one wallet required");
    for (const t of s.entries) {
      const w = wallets.get(t.walletId);
      if (!w || w.currency !== t.currency) fail("Entry wallet/currency mismatch");
      if (
        t.kind === "transfer" &&
        (!t.toWalletId ||
          !wallets.has(t.toWalletId) ||
          t.toWalletId === t.walletId ||
          !t.receivedAmount)
      )
        fail("Invalid transfer");
    }
    for (const r of s.recurring) if (!wallets.has(r.walletId)) fail("Recurring wallet missing");
    if (new Set(s.budgets.map((b) => b.category)).size !== s.budgets.length)
      fail("Duplicate category budgets");
  });
export type Finance = z.infer<typeof financeSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Wallet = z.infer<typeof walletSchema>;
export type Goal = z.infer<typeof goalSchema>;
export type Recurring = z.infer<typeof recurringSchema>;
export type Currency = (typeof currencies)[number];
export type Language = (typeof languages)[number];
export const emptyFinance = (): Finance => ({
  version: 2,
  wallets: [
    { id: "main", name: "Dompet utama", currency: "IDR", openingBalance: 0, color: "purple" },
  ],
  entries: [],
  goals: [],
  budgets: [],
  recurring: [],
  preferences: { language: "id", currency: "IDR", monthlyBudget: 6000000 },
});
export function balance(wallet: Wallet, entries: Entry[]) {
  return entries.reduce(
    (s, t) =>
      s +
      (t.walletId === wallet.id ? (t.kind === "income" ? t.amount : -t.amount) : 0) +
      (t.kind === "transfer" && t.toWalletId === wallet.id ? t.receivedAmount || 0 : 0),
    wallet.openingBalance,
  );
}
export const today = () => new Date().toLocaleDateString("en-CA");
export function nextOccurrence(date: string, frequency: Recurring["frequency"]) {
  const d = new Date(date + "T12:00:00");
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else {
    const day = d.getDate();
    d.setDate(1);
    if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
