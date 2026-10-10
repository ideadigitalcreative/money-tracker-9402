import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  ChartColumnIncreasing,
  Check,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Flag,
  LayoutDashboard,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  ArrowDownLeft,
} from "lucide-react";
import { authClient, finishAuthRedirect } from "../lib/auth";
import { useFinance, useExchange } from "../queries/finance";
import { FinanceProvider, makeFormat, errorMessage } from "../components/finance/context";
import { Busy, CategorySelect, Sheet } from "../components/finance/primitives";
import { Login } from "../components/finance/login";
import { Home, Transactions, Analytics } from "../components/finance/reports";
import { Wallets } from "../components/finance/wallets";
import { Planning } from "../components/finance/planning";
import { Account } from "../components/finance/account";
import { Intelligence } from "../components/finance/intelligence";
import { EntrySheet } from "../components/finance/entry-sheet";
import { localeMap, translator } from "../lib/i18n";
import { today, type Entry } from "../../shared/finance";
import "../cloud.css";
const navigation = [
  { id: "home", key: "home", icon: LayoutDashboard },
  { id: "transactions", key: "transactions", icon: ArrowDownLeft },
  { id: "wallets", key: "wallets", icon: Wallet },
  { id: "analytics", key: "analytics", icon: ChartColumnIncreasing },
  { id: "ai", key: "ai", icon: Sparkles },
  { id: "plans", key: "plans", icon: Flag },
] as const;
const mobileNav = navigation.filter((n) => n.id !== "analytics");
export default function CloudApp() {
  const { data: session, isPending } = authClient.useSession();
  const [bootError, setBootError] = useState("");
  const qc = useQueryClient();
  useEffect(() => {
    void finishAuthRedirect().catch((e) => setBootError(errorMessage(e)));
  }, []);
  useEffect(() => {
    if (!session) qc.clear();
  }, [session, qc]);
  return (
    <div className="fin-app">
      {isPending ? (
        <div className="fin-initial-loading">
          <Wallet size={35} />
          <Busy text="Dompet..." />
        </div>
      ) : session ? (
        <Workspace key={session.user.id} user={session.user} />
      ) : (
        <>
          {bootError && <div className="fin-error">{bootError}</div>}
          <Login />
        </>
      )}
    </div>
  );
}
function Workspace({ user }: { user: { id: string; name: string; email: string } }) {
  const { query, commit, saving } = useFinance();
  const [page, setPage] = useState("home");
  const [month, setMonth] = useState(today().slice(0, 7));
  const [walletFilter, setWalletFilter] = useState("all");
  const [entryModal, setEntryModal] = useState<{ entry?: Entry; category?: string } | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<Entry | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const fx = useExchange(query.data?.state.preferences.currency || "IDR");
  const baseT = translator("id");
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  if (query.isLoading)
    return (
      <div className="fin-initial-loading">
        <Cloud size={35} />
        <Busy text={baseT("loading")} />
      </div>
    );
  if (!query.data)
    return (
      <div className="fin-initial-loading">
        <ShieldCheck size={35} />
        <p className="fin-error">{errorMessage(query.error || "Cloud data unavailable")}</p>
        <button className="fin-primary" onClick={() => void query.refetch()}>
          {baseT("retry")}
        </button>
        <button className="fin-link" onClick={() => void authClient.signOut()}>
          {baseT("signOut")}
        </button>
      </div>
    );
  const state = query.data.state;
  const rates = fx.data || [];
  const format = makeFormat(state, rates);
  const { t, lang } = format;
  const notify = (text: string) => setToast(text);
  const title = t(
    page === "categories"
      ? "categories"
      : page === "account"
        ? "account"
        : navigation.find((n) => n.id === page)?.key || "home",
  );
  function shift(n: number) {
    const d = new Date(month + "-01T12:00:00");
    d.setMonth(d.getMonth() + n);
    setMonth(d.toISOString().slice(0, 7));
  }
  async function remove() {
    if (!deleteEntry) return;
    try {
      await commit({ ...state, entries: state.entries.filter((e) => e.id !== deleteEntry.id) });
      setDeleteEntry(null);
      setEntryModal(null);
      notify(t("success"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <FinanceProvider
      value={{
        state,
        ...format,
        rates,
        ratesError: fx.isError,
        ratesLoading: fx.isLoading,
        refreshRates: () => void fx.refetch(),
        saving,
        commit,
        notify,
        month,
        walletFilter,
        setWalletFilter,
        setPage,
      }}
    >
      <div className={"fin-workspace page-" + page}>
        <aside className="fin-sidebar">
          <a className="fin-brand" href="/" aria-label="Dompet">
            <span>
              <Wallet size={23} />
            </span>
            dompet<span className="brand-period">.</span>
          </a>
          <div className="fin-workspace-label">
            <span>
              <UserRound size={17} />
            </span>
            <div>
              <strong>{user.name}</strong>
              <small>
                {state.wallets.length} {t("wallets")}
              </small>
            </div>
            <Cloud size={15} />
          </div>
          <nav>
            {navigation.map((n) => (
              <button
                className={page === n.id ? "active" : ""}
                onClick={() => setPage(n.id)}
                key={n.id}
              >
                <n.icon size={20} />
                {t(n.key)}
                {n.id === "ai" && <small>AI</small>}
              </button>
            ))}
          </nav>
          <div className="fin-sidebar-bottom">
            <div className="sidebar-ai-tip">
              <Sparkles size={24} />
              <h3>{t("ai")}</h3>
              <p>{t("questionPlaceholder")}</p>
              <button onClick={() => setPage("ai")}>
                {t("analyze")}
                <ArrowRight size={15} />
              </button>
            </div>
            <button
              className={page === "account" ? "sidebar-account active" : "sidebar-account"}
              onClick={() => setPage("account")}
            >
              <UserRound size={20} />
              {t("account")}
            </button>
            <div className="sidebar-security">
              <ShieldCheck size={15} />
              {t("sync")}
            </div>
          </div>
        </aside>
        <div className="fin-main-shell">
          <header className="fin-desktop-header">
            <span>
              {user.name} <ChevronRight size={14} /> <strong>{title}</strong>
            </span>
            <div>
              <span className={"cloud-status " + (query.isError ? "warning-text" : "")}>
                <Cloud size={15} />
                {saving ? t("syncing") : query.isError ? t("failure") : t("sync")}
              </span>
              <button
                className="fin-icon"
                aria-label={t("refresh")}
                onClick={() => void query.refetch()}
                disabled={saving}
              >
                <RefreshCw size={17} />
              </button>
              <button
                className="user-avatar"
                aria-label={t("account")}
                onClick={() => setPage("account")}
              >
                {user.name.slice(0, 2).toUpperCase()}
              </button>
            </div>
          </header>
          <header className="fin-mobile-header">
            {page === "home" ? (
              <div>
                <small>
                  {t("greeting")}, {user.name.split(" ")[0]}
                </small>
                <h1>
                  dompet<span>.</span>
                </h1>
              </div>
            ) : (
              <>
                <button
                  className="mobile-back fin-icon"
                  aria-label={t("home")}
                  onClick={() => setPage("home")}
                >
                  <ChevronLeft size={23} />
                </button>
                <h1>{title}</h1>
              </>
            )}
            <button
              className="fin-mobile-avatar"
              aria-label={t("account")}
              onClick={() => setPage("account")}
            >
              <UserRound size={21} />
            </button>
          </header>
          <main className="fin-main">
            <div className="fin-desktop-title">
              <div>
                <span className="fin-kicker">PERSONAL FINANCE, REIMAGINED</span>
                <h1>{page === "home" ? t("tagline") : title}</h1>
                <p>{t("subtitle")}</p>
              </div>
              <button className="fin-primary" onClick={() => setEntryModal({})}>
                <Plus size={18} />
                {t("newTransaction")}
              </button>
            </div>
            {page !== "account" && page !== "categories" && (
              <div className="fin-month-toolbar">
                <span>
                  {page === "home" ? t("monthly") : title}
                  <small className="cloud-pill">
                    <Cloud size={12} />
                    {saving ? t("syncing") : t("sync")}
                  </small>
                </span>
                <div className="fin-month-selector">
                  <button aria-label="Previous month" onClick={() => shift(-1)}>
                    <ChevronLeft size={17} />
                  </button>
                  <span>
                    {new Date(month + "-01T12:00:00").toLocaleDateString(localeMap[lang], {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <button aria-label="Next month" onClick={() => shift(1)}>
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            )}
            {query.isError && (
              <div className="fin-error">
                {t("failure")}{" "}
                <button className="fin-link" onClick={() => void query.refetch()}>
                  {t("retry")}
                </button>
              </div>
            )}
            {fx.isError && (page === "home" || page === "analytics") && (
              <div className="fin-warning">
                {t("fxMissing")}{" "}
                <button className="fin-link" onClick={() => void fx.refetch()}>
                  {t("retry")}
                </button>
              </div>
            )}
            {page === "home" && (
              <Home
                onEdit={(entry) => setEntryModal({ entry })}
                onAdd={(category) => setEntryModal({ category })}
              />
            )}
            {page === "transactions" && (
              <Transactions
                onEdit={(entry) => setEntryModal({ entry })}
                onAdd={() => setEntryModal({})}
              />
            )}
              {page === "wallets" && <Wallets />}
            {page === "analytics" && <Analytics />}
            {page === "ai" && <Intelligence />}
            {page === "plans" && <Planning />}
            {page === "account" && <Account user={user} />}
            {page === "categories" && (
              <div className="category-page-full">
                <CategorySelect value="" onChange={(category) => setEntryModal({ category })} />
              </div>
            )}
            <footer className="fin-footer">
              <span>
                <ShieldCheck size={14} />
                {t("sync")}
              </span>
              <span>{t("fxHint")}</span>
            </footer>
          </main>
        </div>
        <nav className="fin-mobile-nav" aria-label={t("home")}>
          {mobileNav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "selected" : ""}
              aria-current={page === n.id ? "page" : undefined}
              onClick={() => setPage(n.id)}
            >
              <span>
                <n.icon size={22} />
              </span>
              <small>{t(n.key)}</small>
            </button>
          ))}
        </nav>
        {!entryModal && page !== "account" && page !== "categories" && (
          <button
            className="fin-fab"
            aria-label={t("newTransaction")}
            onClick={() => setEntryModal({})}
          >
            <Plus size={27} />
          </button>
        )}
        {toast && (
          <output className="fin-toast">
            <Check size={17} />
            {toast}
          </output>
        )}
        {entryModal && !deleteEntry && (
          <EntrySheet
            key={entryModal.entry?.id || entryModal.category || "new"}
            entry={entryModal.entry}
            initialCategory={entryModal.category}
            onClose={() => setEntryModal(null)}
            onDelete={() => {
              setDeleteEntry(entryModal.entry!);
              setError("");
            }}
          />
        )}
        {deleteEntry && (
          <Sheet title={t("delete")} onClose={() => setDeleteEntry(null)}>
            <p>{t("dangerDelete")}</p>
            <p className="fin-muted">{deleteEntry.name}</p>
            {error && <div className="fin-error">{error}</div>}
            <div className="fin-form-actions">
              <button className="fin-secondary" onClick={() => setDeleteEntry(null)}>
                {t("cancel")}
              </button>
              <button className="fin-danger" disabled={saving} onClick={remove}>
                {saving ? <Busy text={t("syncing")} /> : t("confirm")}
              </button>
            </div>
          </Sheet>
        )}
      </div>
    </FinanceProvider>
  );
}
