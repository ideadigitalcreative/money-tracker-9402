import { useState } from "react";
import { Cloud, Download, LogOut, ShieldCheck, Upload } from "lucide-react";
import { authClient } from "../../lib/auth";
import {
  currencies,
  emptyFinance,
  financeSchema,
  languages,
  type Finance,
  type Language,
} from "../../../shared/finance";
import { languageNames, categoryKey } from "../../lib/i18n";
import { useFin, errorMessage } from "./context";
import { Busy, Sheet } from "./primitives";
function download(data: string, type: string, name: string) {
  const url = URL.createObjectURL(new Blob(["﻿" + data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function Account({ user }: { user: { name: string; email: string } }) {
  const { state, t, lang, commit, saving, notify, month } = useFin();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Finance | null>(null);
  const [signOut, setSignOut] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [legacyAvailable] = useState(() => !!localStorage.getItem("dompet-transactions"));
  async function preferences(p: Partial<Finance["preferences"]>) {
    try {
      await commit({ ...state, preferences: { ...state.preferences, ...p } });
      if (p.language) localStorage.setItem("dompet-language", p.language);
      notify(t("success"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  function csv() {
    const headers = [
      t("date"),
      t("name"),
      t("transactions"),
      t("wallet"),
      t("category"),
      t("amount"),
      t("currency"),
      t("destination"),
      t("received"),
      t("note"),
    ];
    const cell = (v: unknown) =>
      '"' +
      String(v ?? "")
        .replace(/^[=+\-@]/, " $&")
        .replaceAll('"', '""') +
      '"';
    const rows = state.entries
      .filter((e) => e.date.startsWith(month))
      .map((e) =>
        [
          e.date,
          e.name,
          t(e.kind),
          state.wallets.find((w) => w.id === e.walletId)?.name,
          t(categoryKey(e.category)),
          e.amount,
          e.currency,
          state.wallets.find((w) => w.id === e.toWalletId)?.name,
          e.receivedAmount,
          e.note,
        ]
          .map(cell)
          .join(","),
      );
    download(
      headers.map(cell).join(",") + "\n" + rows.join("\n"),
      "text/csv;charset=utf-8",
      `dompet-${month}.csv`,
    );
  }
  async function file(f?: File) {
    if (!f) return;
    setError("");
    try {
      if (f.size > 20000000) throw new Error("Backup must be under 20 MB.");
      const text = (await f.text()).replace(/^﻿/, "");
      const raw = JSON.parse(text);
      setPreview(financeSchema.parse(raw.state || raw));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  function legacy() {
    try {
      const data = JSON.parse(localStorage.getItem("dompet-transactions") || "[]");
      const migrated = emptyFinance();
      migrated.wallets = [
        {
          id: "legacy-main",
          name: "Dompet lokal",
          currency: "IDR",
          openingBalance: 0,
          color: "purple",
        },
      ];
      migrated.entries = data.map(
        (e: {
          id: string;
          name: string;
          amount: number;
          category: string;
          date: string;
          method: string;
        }) => ({
          id: "legacy-" + e.id,
          name: e.name,
          amount: e.amount,
          category: e.category,
          date: e.date,
          method: e.method,
          currency: "IDR",
          walletId: "legacy-main",
          kind: "expense",
          note: "",
          createdAt: new Date().toISOString(),
        }),
      );
      setPreview(financeSchema.parse(migrated));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function importData() {
    if (!preview) return;
    try {
      const merge = <T extends { id: string }>(old: T[], incoming: T[]) => [
        ...old,
        ...incoming.filter((x) => !old.some((o) => o.id === x.id)),
      ];
      for (const w of preview.wallets) {
        const existing = state.wallets.find((x) => x.id === w.id);
        if (existing && existing.currency !== w.currency)
          throw new Error("Wallet ID has a different currency. Import into a matching account.");
      }
      const combined = {
        ...state,
        wallets: merge(state.wallets, preview.wallets),
        entries: merge(state.entries, preview.entries),
        goals: merge(state.goals, preview.goals),
        recurring: merge(state.recurring, preview.recurring),
        budgets: merge(
          state.budgets,
          preview.budgets.filter((b) => !state.budgets.some((x) => x.category === b.category)),
        ),
      };
      await commit(combined);
      setPreview(null);
      notify(t("success"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <div className="fin-account">
      <section className="fin-card account-user">
        <span className="user-avatar">{user.name.slice(0, 2).toUpperCase()}</span>
        <div>
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <small>
            <Cloud size={13} />
            {t("sync")}
          </small>
        </div>
        <button className="fin-icon" aria-label={t("signOut")} onClick={() => setSignOut(true)}>
          <LogOut size={20} />
        </button>
      </section>
      {error && (
        <div className="fin-error" role="alert">
          {error}
        </div>
      )}
      <section className="fin-card preferences-card">
        <h3>{t("preferences")}</h3>
        <div className="preference-row">
          <label htmlFor="account-language">{t("language")}</label>
          <select
            id="account-language"
            value={lang}
            disabled={saving}
            onChange={(e) => void preferences({ language: e.target.value as Language })}
          >
            {languages.map((l) => (
              <option key={l} value={l}>
                {languageNames[l]}
              </option>
            ))}
          </select>
        </div>
        <div className="preference-row">
          <label htmlFor="account-currency">{t("currency")}</label>
          <select
            id="account-currency"
            value={state.preferences.currency}
            disabled={saving}
            onChange={(e) =>
              void preferences({ currency: e.target.value as Finance["preferences"]["currency"] })
            }
          >
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <p className="fin-muted">{t("fxHint")}</p>
        <form
          className="budget-form"
          onSubmit={(e) => {
            e.preventDefault();
            void preferences({
              monthlyBudget: Number(new FormData(e.currentTarget).get("budget")),
            });
          }}
          key={state.preferences.monthlyBudget + "-" + state.preferences.currency}
        >
          <label>
            {t("monthlyBudget")} ({state.preferences.currency})
            <input
              aria-label={t("monthlyBudget")}
              name="budget"
              type="number"
              min="0.01"
              step="any"
              max="1000000000000"
              required
              defaultValue={state.preferences.monthlyBudget}
            />
          </label>
          <button className="fin-primary" disabled={saving}>
            {saving ? <Busy text={t("syncing")} /> : t("save")}
          </button>
        </form>
      </section>
      <section className="fin-card preferences-card">
        <h3>{t("backup")}</h3>
        <p className="fin-muted">{t("importHint")}</p>
        <div className="backup-actions">
          <button
            className="fin-secondary"
            onClick={() =>
              download(
                JSON.stringify({ exportedAt: new Date().toISOString(), state }, null, 2),
                "application/json",
                "dompet-backup.json",
              )
            }
          >
            <Download size={16} />
            {t("exportJSON")}
          </button>
          <button className="fin-secondary" onClick={csv}>
            <Download size={16} />
            {t("exportCSV")}
          </button>
          <label className="fin-secondary file-link">
            <Upload size={16} />
            {t("importJSON")}
            <input
              aria-label={t("importJSON")}
              type="file"
              accept="application/json,.json"
              onChange={(e) => void file(e.target.files?.[0])}
            />
          </label>
          {legacyAvailable && (
            <button className="fin-secondary" onClick={legacy}>
              <Upload size={16} />
              {t("legacy")}
            </button>
          )}
        </div>
        <p className="fin-muted">
          <ShieldCheck size={15} />
          {t("legacyHint")}
        </p>
      </section>
      {preview && (
        <Sheet
          title={t("importPreview")}
          onClose={() => {
            setPreview(null);
            setError("");
          }}
        >
          <p className="fin-muted">{t("importHint")}</p>
          <div className="import-counts">
            {(["wallets", "entries", "goals", "budgets", "recurring"] as const).map((k) => (
              <div key={k}>
                <span>{t(k === "entries" ? "transactions" : k)}</span>
                <strong>{preview[k].length}</strong>
              </div>
            ))}
          </div>
          {error && <div className="fin-error">{error}</div>}
          <button className="fin-primary full" onClick={importData} disabled={saving}>
            {saving ? <Busy text={t("syncing")} /> : t("confirmImport")}
          </button>
        </Sheet>
      )}
      {signOut && (
        <Sheet title={t("signOut")} onClose={() => setSignOut(false)}>
          <p className="fin-muted">{user.email}</p>
          <button
            className="fin-primary full"
            disabled={authBusy}
            onClick={async () => {
              setAuthBusy(true);
              try {
                await authClient.signOut();
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setAuthBusy(false);
              }
            }}
          >
            {authBusy ? <Busy text={t("loading")} /> : t("confirm")}
          </button>
        </Sheet>
      )}
    </div>
  );
}
