import { useState } from "react";
import { ArrowRight, CalendarClock, Check, Flag, Plus, Trash2 } from "lucide-react";
import {
  currencies,
  nextOccurrence,
  today,
  type Goal,
  type Recurring,
} from "../../../shared/finance";
import { categories } from "../../lib/spending";
import { categoryKey, formatDate } from "../../lib/i18n";
import { useFin, sumConverted, errorMessage } from "./context";
import { Busy, CategoryIcon, Empty, Sheet } from "./primitives";
export function Planning() {
  const { state, t, lang, money, convert, month, commit, saving, notify } = useFin();
  const [tab, setTab] = useState<"goals" | "budgets" | "recurring">("goals");
  const [edit, setEdit] = useState<{ type: typeof tab; id?: string } | null>(null);
  const [remove, setRemove] = useState<{ type: typeof tab; id: string } | null>(null);
  const [error, setError] = useState("");
  const expenses = state.entries.filter((e) => e.kind === "expense" && e.date.startsWith(month));
  async function record(id: string) {
    const r = state.recurring.find((r) => r.id === id)!;
    if (state.entries.some((e) => e.recurringId === id && e.date === r.nextDate)) {
      setError("This occurrence is already recorded.");
      return;
    }
    const wallet = state.wallets.find((w) => w.id === r.walletId)!;
    try {
      await commit({
        ...state,
        entries: [
          {
            id: crypto.randomUUID(),
            name: r.name,
            amount: r.amount,
            currency: wallet.currency,
            walletId: r.walletId,
            kind: r.kind,
            category: r.category,
            date: r.nextDate,
            method: "",
            note: "",
            createdAt: new Date().toISOString(),
            recurringId: r.id,
          },
          ...state.entries,
        ],
        recurring: state.recurring.map((x) =>
          x.id === id ? { ...x, nextDate: nextOccurrence(x.nextDate, x.frequency) } : x,
        ),
      });
      notify(t("success"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function deleteItem() {
    if (!remove) return;
    try {
      await commit({
        ...state,
        [remove.type]: state[remove.type].filter((x) => x.id !== remove.id),
      });
      setRemove(null);
      notify(t("success"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <div className="fin-segment planning-tabs">
        {(["goals", "budgets", "recurring"] as const).map((k) => (
          <button key={k} className={tab === k ? "selected" : ""} onClick={() => setTab(k)}>
            {t(k)}
          </button>
        ))}
      </div>
      <div className="fin-section-heading">
        <h2>{t(tab)}</h2>
        <button className="fin-secondary" onClick={() => setEdit({ type: tab })}>
          <Plus size={17} />
          {t("add")}
        </button>
      </div>
      {error && (
        <div className="fin-error" role="alert">
          {error}
        </div>
      )}
      <p className="fin-muted">
        {tab === "goals"
          ? t("goalHint")
          : tab === "recurring"
            ? t("recurringHint")
            : t("monthlyBudget")}
      </p>
      {tab === "goals" && (
        <div className="fin-plan-grid">
          {state.goals.map((g) => (
            <section className="fin-card goal-card" key={g.id}>
              <div className="plan-heading">
                <span className="plan-symbol">
                  <Flag size={21} />
                </span>
                <button
                  className="fin-icon"
                  aria-label={t("delete")}
                  onClick={() => setRemove({ type: "goals", id: g.id })}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3>{g.name}</h3>
              <strong className="goal-total">{money(g.saved, g.currency)}</strong>
              <div className="fin-progress">
                <span style={{ width: `${Math.min(100, (g.saved / g.target) * 100)}%` }} />
              </div>
              <p>
                {t("target")}: {money(g.target, g.currency)}
              </p>
              <div className="goal-footer">
                <small>{formatDate(g.dueDate, lang)}</small>
                <button className="fin-link" onClick={() => setEdit({ type: "goals", id: g.id })}>
                  {t("edit")}
                  <ArrowRight size={14} />
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
      {tab === "budgets" && (
        <div className="fin-plan-grid">
          {state.budgets.map((b) => {
            const baseSpent = sumConverted(
              expenses.filter((e) => e.category === b.category),
              convert,
            );
            const limit = convert(b.amount, b.currency);
            const percent = baseSpent !== null && limit !== null ? (baseSpent / limit) * 100 : null;
            return (
              <section className="fin-card budget-card" key={b.id}>
                <div className="plan-heading">
                  <CategoryIcon id={b.category} />
                  <button
                    className="fin-icon"
                    aria-label={t("delete")}
                    onClick={() => setRemove({ type: "budgets", id: b.id })}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3>{t(categoryKey(b.category))}</h3>
                <div className="budget-values">
                  <strong>{baseSpent === null ? "—" : money(baseSpent)}</strong>
                  <small>/ {money(b.amount, b.currency)}</small>
                </div>
                <div
                  className={"fin-progress " + (percent !== null && percent >= 100 ? "over" : "")}
                >
                  <span style={{ width: `${Math.min(100, percent || 0)}%` }} />
                </div>
                <div className="goal-footer">
                  <small className={percent !== null && percent >= 80 ? "warning-text" : ""}>
                    {percent === null
                      ? t("fxMissing")
                      : percent >= 100
                        ? t("overBudget")
                        : percent >= 80
                          ? t("nearBudget")
                          : t("safeBudget")}
                  </small>
                  <button
                    className="fin-link"
                    onClick={() => setEdit({ type: "budgets", id: b.id })}
                  >
                    {t("edit")}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
      {tab === "recurring" && (
        <div className="recurring-list">
          {state.recurring.map((r) => {
            const w = state.wallets.find((w) => w.id === r.walletId)!;
            return (
              <section className="fin-card recurring-card" key={r.id}>
                <CategoryIcon id={r.category} />
                <div className="recurring-description">
                  <h3>{r.name}</h3>
                  <p>
                    {w.name} · {t(r.frequency)} · {formatDate(r.nextDate, lang)}
                  </p>
                  <small>{t(r.kind)}</small>
                </div>
                <strong>{money(r.amount, w.currency)}</strong>
                <div className="recurring-actions">
                  <button className="fin-link" disabled={saving} onClick={() => record(r.id)}>
                    <Check size={16} />
                    {t("recordNow")}
                  </button>
                  <button
                    className="fin-icon"
                    aria-label={t("edit")}
                    onClick={() => setEdit({ type: "recurring", id: r.id })}
                  >
                    <CalendarClock size={17} />
                  </button>
                  <button
                    className="fin-icon"
                    aria-label={t("delete")}
                    onClick={() => setRemove({ type: "recurring", id: r.id })}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
      {!state[tab].length && (
        <section className="fin-card">
          <Empty onAdd={() => setEdit({ type: tab })} />
        </section>
      )}
      {edit && <PlanningSheet type={edit.type} id={edit.id} onClose={() => setEdit(null)} />}
      {remove && (
        <Sheet title={t("delete")} onClose={() => setRemove(null)}>
          <p className="fin-muted">{t("dangerDelete")}</p>
          <div className="fin-form-actions">
            <button className="fin-secondary" onClick={() => setRemove(null)}>
              {t("cancel")}
            </button>
            <button className="fin-danger" disabled={saving} onClick={deleteItem}>
              {t("confirm")}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
function PlanningSheet({
  type,
  id,
  onClose,
}: {
  type: "goals" | "budgets" | "recurring";
  id?: string;
  onClose: () => void;
}) {
  const { state, t, commit, saving, notify } = useFin();
  const item = state[type].find((x) => x.id === id);
  const [error, setError] = useState("");
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const amount = Number(f.get("amount"));
    const itemId = id || crypto.randomUUID();
    const name = String(f.get("name") || "").trim();
    let next = state;
    if (type === "goals") {
      const g: Goal = {
        id: itemId,
        name,
        target: amount,
        saved: Number(f.get("saved")),
        currency: String(f.get("currency")) as Goal["currency"],
        dueDate: String(f.get("date")),
      };
      next = {
        ...state,
        goals: id ? state.goals.map((x) => (x.id === id ? g : x)) : [...state.goals, g],
      };
    }
    if (type === "budgets") {
      const category = String(f.get("category")) as (typeof state.budgets)[number]["category"];
      if (state.budgets.some((b) => b.category === category && b.id !== id)) {
        setError(t("failure"));
        return;
      }
      const b = {
        id: itemId,
        category,
        amount,
        currency: String(f.get("currency")) as Goal["currency"],
      };
      next = {
        ...state,
        budgets: id ? state.budgets.map((x) => (x.id === id ? b : x)) : [...state.budgets, b],
      };
    }
    if (type === "recurring") {
      const r: Recurring = {
        id: itemId,
        name,
        amount,
        walletId: String(f.get("walletId")),
        category: String(f.get("category")) as Recurring["category"],
        nextDate: String(f.get("date")),
        frequency: String(f.get("frequency")) as Recurring["frequency"],
        kind: String(f.get("kind")) as Recurring["kind"],
        active: true,
      };
      next = {
        ...state,
        recurring: id ? state.recurring.map((x) => (x.id === id ? r : x)) : [...state.recurring, r],
      };
    }
    try {
      await commit(next);
      notify(t("success"));
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  const goal = type === "goals" ? (item as Goal | undefined) : undefined;
  const r = type === "recurring" ? (item as Recurring | undefined) : undefined;
  const b = type === "budgets" ? (item as (typeof state.budgets)[number] | undefined) : undefined;
  return (
    <Sheet
      title={
        id
          ? t("edit")
          : t(type === "goals" ? "newGoal" : type === "budgets" ? "newBudget" : "newRecurring")
      }
      onClose={onClose}
    >
      <form onSubmit={save}>
        {type !== "budgets" && (
          <label>
            {t("name")}
            <input
              aria-label={t("name")}
              name="name"
              required
              maxLength={100}
              defaultValue={goal?.name || r?.name}
            />
          </label>
        )}
        {type !== "goals" && (
          <label>
            {t("category")}
            <select
              aria-label={t("category")}
              name="category"
              defaultValue={b?.category || r?.category || "subscription"}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {t(categoryKey(c.id))}
                </option>
              ))}
            </select>
          </label>
        )}
        {type === "recurring" ? (
          <label>
            {t("wallet")}
            <select aria-label={t("wallet")} name="walletId" defaultValue={r?.walletId}>
              {state.wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} · {w.currency}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            {t("currency")}
            <select
              aria-label={t("currency")}
              name="currency"
              defaultValue={goal?.currency || b?.currency || state.preferences.currency}
            >
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          {type === "goals" ? t("target") : t("amount")}
          <input
            aria-label={t("amount")}
            type="number"
            name="amount"
            min="0.01"
            step="any"
            max="1000000000000"
            required
            defaultValue={goal?.target || b?.amount || r?.amount}
          />
        </label>
        {type === "goals" && (
          <label>
            {t("saved")}
            <input
              aria-label={t("saved")}
              type="number"
              name="saved"
              min="0"
              step="any"
              max="1000000000000"
              defaultValue={goal?.saved || 0}
              required
            />
          </label>
        )}
        {type !== "budgets" && (
          <label>
            {t("dueDate")}
            <input
              aria-label={t("dueDate")}
              name="date"
              type="date"
              required
              defaultValue={goal?.dueDate || r?.nextDate || today()}
            />
          </label>
        )}
        {type === "recurring" && (
          <div className="fin-form-pair">
            <label>
              {t("frequency")}
              <select
                aria-label={t("frequency")}
                name="frequency"
                defaultValue={r?.frequency || "monthly"}
              >
                {(["weekly", "monthly", "yearly"] as const).map((f) => (
                  <option key={f} value={f}>
                    {t(f)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("transactions")}
              <select
                aria-label={t("transactions")}
                name="kind"
                defaultValue={r?.kind || "expense"}
              >
                <option value="expense">{t("expense")}</option>
                <option value="income">{t("income")}</option>
              </select>
            </label>
          </div>
        )}
        {error && (
          <div className="fin-error" role="alert">
            {error}
          </div>
        )}
        <button className="fin-primary full" disabled={saving}>
          {saving ? <Busy text={t("syncing")} /> : t("save")}
        </button>
      </form>
    </Sheet>
  );
}
