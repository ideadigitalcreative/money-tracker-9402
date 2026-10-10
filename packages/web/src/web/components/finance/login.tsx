import { useState } from "react";
import { ArrowRight, Cloud, ShieldCheck, Wallet } from "lucide-react";
import { authClient } from "../../lib/auth";
import { translator, languageNames } from "../../lib/i18n";
import { languages, type Language } from "../../../shared/finance";
import { Busy } from "./primitives";
export function Login() {
  const [lang, setLang] = useState<Language>(() => {
    const v = localStorage.getItem("dompet-language");
    return languages.includes(v as Language) ? (v as Language) : "id";
  });
  const t = translator(lang);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      const result =
        mode === "in"
          ? await authClient.signIn.email({
              email: String(f.get("email")),
              password: String(f.get("password")),
            })
          : await authClient.signUp.email({
              email: String(f.get("email")),
              password: String(f.get("password")),
              name: String(f.get("name")),
            });
      if (result.error) throw new Error(result.error.message || t("failure"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failure"));
    } finally {
      setPending(false);
    }
  }
  async function google() {
    setPending(true);
    setError("");
    try {
      const r = await authClient.managedAuth.signIn({ provider: "google" });
      if (r.error && r.error.code !== "POPUP_CLOSED") setError(r.error.message || t("failure"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failure"));
    } finally {
      setPending(false);
    }
  }
  return (
    <div className="fin-login">
      <div className="login-art">
        <a href="/" className="fin-brand">
          <span>
            <Wallet size={25} />
          </span>
          dompet.
        </a>
        <div className="login-copy">
          <span className="fin-kicker">YOUR EVERYDAY MONEY COMPANION</span>
          <h1>{t("tagline")}</h1>
          <p>{t("authHint")}</p>
          <div className="login-wallet-illustration">
            <div className="illustration-card">
              <Wallet size={27} />
              <span>dompet.</span>
              <i />
              <i />
              <div className="illustration-chip" />
            </div>
            <span className="illustration-spark">
              <Cloud size={24} />
            </span>
          </div>
        </div>
        <small>
          <ShieldCheck size={16} />
          {t("authHint")}
        </small>
      </div>
      <div className="login-panel">
        <select
          aria-label={t("language")}
          value={lang}
          onChange={(e) => {
            setLang(e.target.value as Language);
            localStorage.setItem("dompet-language", e.target.value);
          }}
        >
          {languages.map((l) => (
            <option key={l} value={l}>
              {languageNames[l]}
            </option>
          ))}
        </select>
        <div className="login-form">
          <div className="mobile-login-brand fin-brand">
            <span>
              <Wallet size={23} />
            </span>
            dompet.
          </div>
          <h2>{mode === "in" ? t("signIn") : t("signUp")}</h2>
          <p>{t("authHint")}</p>
          <div className="fin-segment">
            {(["in", "up"] as const).map((m) => (
              <button
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={m === mode ? "selected" : ""}
                key={m}
              >
                {m === "in" ? t("signIn") : t("signUp")}
              </button>
            ))}
          </div>
          <button disabled={pending} className="google-button" onClick={google}>
            <span className="google-mark">G</span>
            {t("google")}
          </button>
          <div className="login-divider">
            <span />
            {t("email")}
            <span />
          </div>
          <form onSubmit={submit} key={mode}>
            {mode === "up" && (
              <label>
                {t("name")}
                <input
                  name="name"
                  autoComplete="name"
                  maxLength={80}
                  required
                  aria-label={t("name")}
                />
              </label>
            )}
            <label>
              {t("email")}
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-label={t("email")}
              />
            </label>
            <label>
              {t("password")}
              <input
                name="password"
                type="password"
                minLength={8}
                required
                autoComplete={mode === "in" ? "current-password" : "new-password"}
                aria-label={t("password")}
              />
            </label>
            {error && (
              <div className="fin-error" role="alert">
                {error}
              </div>
            )}
            <button className="fin-primary" disabled={pending}>
              {pending ? (
                <Busy text={t("loading")} />
              ) : (
                <>
                  {mode === "in" ? t("signIn") : t("signUp")}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <div className="login-foot">
            <ShieldCheck size={16} />
            {t("legacyHint")}
          </div>
        </div>
      </div>
    </div>
  );
}
