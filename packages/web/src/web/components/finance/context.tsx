import { createContext, useContext, type ReactNode } from "react";
import type { Finance, Currency, Language } from "../../../shared/finance";
import { formatMoney, translator, type Key } from "../../lib/i18n";
type FX = { base: Currency; quote: Currency; date: string; rate: number }[];
export type FinanceContextValue = {
  state: Finance;
  lang: Language;
  t: (key: Key) => string;
  money: (amount: number, currency?: Currency) => string;
  convert: (amount: number, currency: Currency) => number | null;
  rates: FX;
  ratesLoading: boolean;
  ratesError: boolean;
  refreshRates: () => void;
  saving: boolean;
  commit: (state: Finance) => Promise<unknown>;
  notify: (text: string) => void;
  month: string;
  walletFilter: string;
  setWalletFilter: (id: string) => void;
  setPage: (page: string) => void;
};
const Context = createContext<FinanceContextValue | null>(null);
export function FinanceProvider({
  value,
  children,
}: {
  value: FinanceContextValue;
  children: ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useFin() {
  const c = useContext(Context);
  if (!c) throw new Error("Finance provider missing");
  return c;
}
export function makeFormat(state: Finance, rates: FX) {
  const lang = state.preferences.language;
  return {
    lang,
    t: translator(lang),
    money: (amount: number, currency: Currency = state.preferences.currency) =>
      formatMoney(amount, currency, lang),
    convert: (amount: number, currency: Currency) => {
      if (currency === state.preferences.currency) return amount;
      const rate = rates.find((r) => r.quote === currency);
      return rate ? amount / rate.rate : null;
    },
  };
}
export function sumConverted(
  items: { amount: number; currency: Currency }[],
  convert: FinanceContextValue["convert"],
) {
  let total = 0;
  for (const e of items) {
    const n = convert(e.amount, e.currency);
    if (n === null) return null;
    total += n;
  }
  return total;
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
