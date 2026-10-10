import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Search,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import { balance, type Entry } from "../../../shared/finance";
import { categories } from "../../lib/spending";
import { categoryKey, formatDate, localeMap } from "../../lib/i18n";
import { useFin, sumConverted } from "./context";
import { CategoryIcon, Empty } from "./primitives";
export function TransactionList({
  items,
  onEdit,
  compact = false,
}: {
  items: Entry[];
  onEdit: (e: Entry) => void;
  compact?: boolean;
}) {
  const { state, t, money, lang } = useFin();
  return (
    <div className="fin-transaction-list">
      {!items.length ? (
        <Empty />
      ) : (
        items.map((e) => (
          <button className="fin-transaction" key={e.id} onClick={() => onEdit(e)}>
            {e.kind === "transfer" ? (
              <span className="fin-cat-icon transfer-icon">
                <ArrowLeftRight size={21} />
              </span>
            ) : (
              <CategoryIcon id={e.category} />
            )}
            <span className="transaction-details">
              <strong>{e.name}</strong>
              <small>
                {state.wallets.find((w) => w.id === e.walletId)?.name} ·{" "}
                {compact ? formatDate(e.date, lang) : t(e.kind)}
              </small>
              {!compact && (
                <small>
                  {formatDate(e.date, lang)} ·{" "}
                  {e.kind === "transfer"
                    ? state.wallets.find((w) => w.id === e.toWalletId)?.name
                    : t(categoryKey(e.category))}
                </small>
              )}
            </span>
            <span className={"transaction-value " + e.kind}>
              <strong>
                {e.kind === "income" ? "+" : e.kind === "expense" ? "−" : ""}
                {money(e.amount, e.currency)}
              </strong>
              {e.kind === "transfer" && e.toWalletId && (
                <small>
                  →{" "}
                  {money(
                    e.receivedAmount || 0,
                    state.wallets.find((w) => w.id === e.toWalletId)!.currency,
                  )}
                </small>
              )}
            </span>
            <ChevronRight size={15} />
          </button>
        ))
      )}
    </div>
  );
}
export function Transactions({ onEdit, onAdd }: { onEdit: (e: Entry) => void; onAdd: () => void }) {
  const { state, t, month, walletFilter, setWalletFilter } = useFin();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [category, setCategory] = useState("all");
  const entries = state.entries
    .filter(
      (e) =>
        e.date.startsWith(month) &&
        (walletFilter === "all" || e.walletId === walletFilter || e.toWalletId === walletFilter) &&
        (kind === "all" || e.kind === kind) &&
        (category === "all" || e.category === category) &&
        e.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  return (
    <section className="fin-card transactions-page">
      <div className="fin-filter-row">
        <label className="fin-search">
          <Search size={18} />
          <input
            aria-label={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
          />
        </label>
        <select
          aria-label={t("wallet")}
          value={walletFilter}
          onChange={(e) => setWalletFilter(e.target.value)}
        >
          <option value="all">
            {t("all")} · {t("wallets")}
          </option>
          {state.wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <select
          aria-label={t("category")}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">
            {t("all")} · {t("categories")}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {t(categoryKey(c.id))}
            </option>
          ))}
        </select>
      </div>
      <div className="fin-segment transaction-kinds">
        {(["all", "expense", "income", "transfer"] as const).map((k) => (
          <button key={k} className={kind === k ? "selected" : ""} onClick={() => setKind(k)}>
            {t(k)}
          </button>
        ))}
      </div>
      {entries.length ? (
        <TransactionList items={entries} onEdit={onEdit} />
      ) : (
        <Empty onAdd={onAdd} />
      )}
    </section>
  );
}
export function Home({
  onEdit,
  onAdd,
}: {
  onEdit: (e: Entry) => void;
  onAdd: (category?: string) => void;
}) {
  const { state, t, month, money, convert, setPage } = useFin();
  const entries = state.entries.filter((e) => e.date.startsWith(month));
  const expense = sumConverted(
    entries.filter((e) => e.kind === "expense"),
    convert,
  );
  const income = sumConverted(
    entries.filter((e) => e.kind === "income"),
    convert,
  );
  const net = sumConverted(
    state.wallets.map((w) => ({ amount: balance(w, state.entries), currency: w.currency })),
    convert,
  );
  const remaining = expense !== null ? state.preferences.monthlyBudget - expense : null;
  const percent = expense === null ? null : (expense / state.preferences.monthlyBudget) * 100;
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const alerts = state.budgets
    .map((b) => {
      const spend = sumConverted(
        entries.filter((e) => e.kind === "expense" && e.category === b.category),
        convert,
      );
      const limit = convert(b.amount, b.currency);
      return { b, percent: spend !== null && limit !== null ? (spend / limit) * 100 : 0 };
    })
    .filter((a) => a.percent >= 80);
  return (
    <>
      <div className="fin-summary-grid">
        <section className="fin-summary featured">
          <div>
            <span>{t("totalSpend")}</span>
            <i>
              <Wallet size={22} />
            </i>
          </div>
          <h2>{expense === null ? "—" : money(expense)}</h2>
          <p>
            <span className={percent !== null && percent >= 100 ? "warning-text" : ""}>
              {percent === null ? t("fxMissing") : `${Math.round(percent)}% ${t("used")}`}
            </span>
            <button onClick={() => setPage("analytics")}>
              {t("analytics")}
              <ArrowUpRight size={15} />
            </button>
          </p>
          <div className="summary-rings" />
        </section>
        <section className="fin-summary">
          <div>
            <span>{t("income")}</span>
            <i className="green">
              <ArrowDownLeft size={21} />
            </i>
          </div>
          <h2>{income === null ? "—" : money(income)}</h2>
          <p>{t("monthly")}</p>
        </section>
        <section className="fin-summary">
          <div>
            <span>{t("netWorth")}</span>
            <i>
              <Wallet size={20} />
            </i>
          </div>
          <h2>{net === null ? "—" : money(net)}</h2>
          <p>
            {state.wallets.length} {t("wallets")}
          </p>
        </section>
      </div>
      <div className="home-mid-grid">
        <section className="fin-card monthly-limit">
          <div className="fin-card-heading">
            <h3>{t("monthlyBudget")}</h3>
            <button className="fin-link" onClick={() => setPage("account")}>
              {t("edit")}
            </button>
          </div>
          <strong>{money(state.preferences.monthlyBudget)}</strong>
          <div className={"fin-progress " + (percent !== null && percent >= 100 ? "over" : "")}>
            <span style={{ width: `${Math.min(100, percent || 0)}%` }} />
          </div>
          <div className="budget-bottom">
            <span>{t("remaining")}</span>
            <strong>{remaining === null ? "—" : money(remaining)}</strong>
          </div>
        </section>
        <section className="home-ai-prompt">
          <span>
            <Sparkles size={27} />
          </span>
          <div>
            <h3>{t("ai")}</h3>
            <p>{t("questionPlaceholder")}</p>
          </div>
          <button aria-label={t("ai")} onClick={() => setPage("ai")}>
            <ArrowRight size={22} />
          </button>
        </section>
      </div>
      {alerts.length > 0 && (
        <div className="fin-budget-alerts">
          {alerts.map((a) => (
            <button key={a.b.id} onClick={() => setPage("plans")}>
              <Target size={16} />
              <span>
                {t(categoryKey(a.b.category))} · {Math.round(a.percent)}% ·{" "}
                {t(a.percent >= 100 ? "overBudget" : "nearBudget")}
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      )}
      <div className="home-lower-grid">
        <section className="fin-card">
          <div className="fin-card-heading">
            <h3>
              {t("recent")} <small className="fin-count">{entries.length}</small>
            </h3>
            <button className="fin-link" onClick={() => setPage("transactions")}>
              {t("viewAll")}
              <ArrowRight size={15} />
            </button>
          </div>
          {recent.length ? (
            <TransactionList items={recent} onEdit={onEdit} compact />
          ) : (
            <Empty onAdd={() => onAdd()} />
          )}
        </section>
        <section className="fin-card home-categories">
          <div className="fin-card-heading">
            <h3>{t("categories")}</h3>
            <button
              className="fin-icon"
              aria-label={t("categories")}
              onClick={() => setPage("categories")}
            >
              <ArrowUpRight size={19} />
            </button>
          </div>
          <div className="home-category-grid">
            {categories.slice(0, 8).map((c) => (
              <button key={c.id} onClick={() => onAdd(c.id)}>
                <CategoryIcon id={c.id} />
                <small>{t(categoryKey(c.id))}</small>
              </button>
            ))}
          </div>
          <button className="fin-link home-all-categories" onClick={() => setPage("categories")}>
            {t("viewAll")}
            <ArrowRight size={15} />
          </button>
        </section>
      </div>
    </>
  );
}
export function Analytics() {
  const { state, t, lang, month, money, convert, rates, ratesLoading, ratesError, refreshRates } =
    useFin();
  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly");
  const categoriesTotals = categories
    .map((c) => ({
      ...c,
      total: sumConverted(
        state.entries.filter(
          (e) => e.kind === "expense" && e.date.startsWith(month) && e.category === c.id,
        ),
        convert,
      ),
    }))
    .filter((c) => c.total === null || (c.total || 0) > 0)
    .sort((a, b) => (b.total || 0) - (a.total || 0));
  const total = categoriesTotals.some((c) => c.total === null)
    ? null
    : categoriesTotals.reduce((s, c) => s + (c.total || 0), 0);
  const chart = Array.from({ length: period === "monthly" ? 6 : 4 }, (_, i) => {
    if (period === "weekly") {
      const value = sumConverted(
        state.entries.filter(
          (e) =>
            e.kind === "expense" &&
            e.date.startsWith(month) &&
            Math.min(3, Math.floor((Number(e.date.slice(-2)) - 1) / 8)) === i,
        ),
        convert,
      );
      return {
        label: `${i * 8 + 1}–${i === 3 ? new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate() : i * 8 + 8}`,
        value,
      };
    }
    const d = new Date(month + "-01T12:00:00");
    d.setMonth(d.getMonth() - 5 + i);
    const key = d.toISOString().slice(0, 7);
    return {
      label: d.toLocaleDateString(localeMap[lang], { month: "short" }),
      value: sumConverted(
        state.entries.filter((e) => e.kind === "expense" && e.date.startsWith(key)),
        convert,
      ),
    };
  });
  const max = Math.max(1, ...chart.map((c) => c.value || 0));
  let gradientOffset = 0;
  const gradient = categoriesTotals
    .map((c) => {
      const percent = total ? ((c.total || 0) / total) * 100 : 0;
      const segment = `${c.color} ${gradientOffset}% ${gradientOffset + percent}%`;
      gradientOffset += percent;
      return segment;
    })
    .join(",");
  return (
    <>
      <div className="fin-reports-grid">
        <section className="fin-card trend-panel">
          <div className="fin-card-heading">
            <h3>{t("spendingTrend")}</h3>
            <div className="fin-segment">
              {(["monthly", "weekly"] as const).map((p) => (
                <button
                  key={p}
                  className={period === p ? "selected" : ""}
                  onClick={() => setPeriod(p)}
                >
                  {t(p)}
                </button>
              ))}
            </div>
          </div>
          <div className="fin-chart">
            {chart.map((c, i) => (
              <div className="fin-chart-column" key={c.label}>
                <span className="fin-chart-value">{c.value === null ? "—" : money(c.value)}</span>
                <div className="fin-chart-track">
                  <div
                    className={i === chart.length - 1 ? "last" : ""}
                    style={{ height: `${Math.max(1, ((c.value || 0) / max) * 100)}%` }}
                  />
                </div>
                <small>{c.label}</small>
              </div>
            ))}
          </div>
        </section>
        <section className="fin-card breakdown-panel">
          <div className="fin-card-heading">
            <h3>{t("byCategory")}</h3>
          </div>
          <div
            className="fin-donut"
            style={{ background: gradient && total ? `conic-gradient(${gradient})` : "#f2edf8" }}
          >
            <div>
              <small>{t("totalSpend")}</small>
              <strong>{total === null ? "—" : money(total || 0)}</strong>
              <small>
                {categoriesTotals.length} {t("categories")}
              </small>
            </div>
          </div>
        </section>
      </div>
      <section className="fin-card category-report">
        {categoriesTotals.length ? (
          categoriesTotals.map((c) => (
            <div key={c.id}>
              <CategoryIcon id={c.id} />
              <span>{t(categoryKey(c.id))}</span>
              <div className="category-report-meter">
                <i
                  style={{
                    width: `${total ? ((c.total || 0) / total) * 100 : 0}%`,
                    background: c.color,
                  }}
                />
              </div>
              <small>{total ? Math.round(((c.total || 0) / total) * 100) + "%" : "—"}</small>
              <strong>{c.total === null ? "—" : money(c.total || 0)}</strong>
            </div>
          ))
        ) : (
          <Empty />
        )}
      </section>
      <section className="fin-card fx-card">
        <div className="fin-card-heading">
          <h3>
            {t("exchangeRates")} · {state.preferences.currency}
          </h3>
          <button className="fin-link" onClick={refreshRates}>
            {t("refresh")}
          </button>
        </div>
        <p className="fin-muted">{t("fxHint")}</p>
        {ratesLoading ? (
          <p>{t("loading")}</p>
        ) : ratesError ? (
          <div className="fin-error">{t("fxMissing")}</div>
        ) : (
          <div className="fx-grid">
            {rates.map((r) => (
              <div key={r.quote}>
                <span>{r.quote}</span>
                <strong>
                  {r.rate.toLocaleString(localeMap[lang], { maximumSignificantDigits: 6 })}
                </strong>
                <small>{r.date}</small>
              </div>
            ))}
          </div>
        )}
        <p className="fx-source">
          Frankfurter · {t("exchangeRates")} · 1 {state.preferences.currency}
        </p>
      </section>
    </>
  );
}
