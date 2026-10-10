import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2, Wallet as WalletIcon } from "lucide-react";
import { balance, currencies, type Wallet } from "../../../shared/finance";
import { useFin, errorMessage } from "./context";
import { Busy, Sheet } from "./primitives";
export function Wallets() {
  const { state, t, money, setWalletFilter, setPage, commit, saving, notify } = useFin();
  const [edit, setEdit] = useState<Wallet | "new" | null>(null);
  const [remove, setRemove] = useState<Wallet | null>(null);
  const [error, setError] = useState("");
  async function del() {
    if (!remove) return;
    if (
      state.wallets.length <= 1 ||
      state.entries.some((e) => e.walletId === remove.id || e.toWalletId === remove.id) ||
      state.recurring.some((r) => r.walletId === remove.id)
    ) {
      setError(t("inUse"));
      return;
    }
    try {
      await commit({ ...state, wallets: state.wallets.filter((w) => w.id !== remove.id) });
      setRemove(null);
      notify(t("success"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <>
      <div className="fin-section-heading">
        <div>
          <h2>{t("wallets")}</h2>
          <p>{t("walletHint")}</p>
        </div>
        <button className="fin-primary" onClick={() => setEdit("new")}>
          <Plus size={17} />
          {t("newWallet")}
        </button>
      </div>
      {error && (
        <div className="fin-error" role="alert">
          {error}
        </div>
      )}
      <div className="fin-wallet-grid">
        {state.wallets.map((w) => (
          <section className={"fin-wallet-card " + w.color} key={w.id}>
            <div className="wallet-card-top">
              <span>
                <WalletIcon size={22} />
              </span>
              <small>{w.currency}</small>
              <button
                className="fin-icon"
                aria-label={t("delete")}
                onClick={() => {
                  setError("");
                  setRemove(w);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <p>{w.name}</p>
            <strong>{money(balance(w, state.entries), w.currency)}</strong>
            <div className="wallet-card-actions">
              <button
                onClick={() => {
                  setWalletFilter(w.id);
                  setPage("transactions");
                }}
              >
                <ArrowDownLeft size={16} />
                {t("transactions")}
              </button>
              <button onClick={() => setEdit(w)}>
                {t("edit")}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <div className="wallet-decoration" />
          </section>
        ))}
        <button className="add-wallet-card" onClick={() => setEdit("new")}>
          <Plus size={28} />
          <span>{t("newWallet")}</span>
        </button>
      </div>
      {edit && (
        <WalletSheet wallet={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} />
      )}
      {remove && (
        <Sheet
          title={t("delete")}
          onClose={() => {
            setRemove(null);
            setError("");
          }}
        >
          <p>{t("dangerDelete")}</p>
          <p className="fin-muted">{remove.name}</p>
          {error && <div className="fin-error">{error}</div>}
          <div className="fin-form-actions">
            <button className="fin-secondary" onClick={() => setRemove(null)}>
              {t("cancel")}
            </button>
            <button className="fin-danger" disabled={saving} onClick={del}>
              {t("confirm")}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
function WalletSheet({ wallet, onClose }: { wallet?: Wallet; onClose: () => void }) {
  const { state, t, commit, saving, notify } = useFin();
  const [error, setError] = useState("");
  const inUse =
    wallet && state.entries.some((e) => e.walletId === wallet.id || e.toWalletId === wallet.id);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const w: Wallet = {
      id: wallet?.id || crypto.randomUUID(),
      name: String(f.get("name")).trim(),
      currency: (inUse ? wallet!.currency : String(f.get("currency"))) as Wallet["currency"],
      openingBalance: Number(f.get("balance")),
      color: String(f.get("color")) as Wallet["color"],
    };
    try {
      await commit({
        ...state,
        wallets: wallet
          ? state.wallets.map((x) => (x.id === wallet.id ? w : x))
          : [...state.wallets, w],
      });
      notify(t("success"));
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Sheet title={wallet ? t("edit") : t("newWallet")} onClose={onClose}>
      <form onSubmit={submit}>
        <label>
          {t("name")}
          <input
            aria-label={t("name")}
            required
            maxLength={80}
            name="name"
            defaultValue={wallet?.name}
          />
        </label>
        <div className="fin-form-pair">
          <label>
            {t("currency")}
            <select
              aria-label={t("currency")}
              name="currency"
              disabled={!!inUse}
              defaultValue={wallet?.currency || state.preferences.currency}
            >
              {currencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            {t("color")}
            <select aria-label={t("color")} name="color" defaultValue={wallet?.color || "purple"}>
              {["purple", "green", "blue", "orange", "pink"].map((c) => (
                <option key={c} value={c}>
                  {
                    {
                      id: ["Lavender", "Hijau", "Biru", "Jingga", "Merah muda"],
                      en: ["Lavender", "Green", "Blue", "Orange", "Pink"],
                      ms: ["Lavender", "Hijau", "Biru", "Jingga", "Merah jambu"],
                      ja: ["ラベンダー", "緑", "青", "オレンジ", "ピンク"],
                      zh: ["薰衣草色", "绿", "蓝", "橙", "粉"],
                    }[state.preferences.language][
                      ["purple", "green", "blue", "orange", "pink"].indexOf(c)
                    ]
                  }
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          {t("openingBalance")}
          <input
            aria-label={t("openingBalance")}
            name="balance"
            type="number"
            step="any"
            min="-1000000000000"
            max="1000000000000"
            defaultValue={wallet?.openingBalance || 0}
            required
          />
        </label>
        <p className="fin-muted">{t("walletHint")}</p>
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
