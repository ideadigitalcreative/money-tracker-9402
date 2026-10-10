import { useState } from "react";
import { ArrowRight, Lightbulb, Send, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { useAIAnalysis } from "../../queries/finance";
import { useFin } from "./context";
import { Busy } from "./primitives";
export function Intelligence() {
  const { t, lang, month, state } = useFin();
  const ai = useAIAnalysis();
  const [question, setQuestion] = useState("");
  const [resultMonth, setResultMonth] = useState("");
  const [resultLang, setResultLang] = useState(lang);
  const [error, setError] = useState("");
  async function analyze() {
    setError("");
    try {
      await ai.mutateAsync({ month, language: lang, question });
      setResultMonth(month);
      setResultLang(lang);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failure"));
    }
  }
  const result = ai.data && resultMonth === month && resultLang === lang ? ai.data : null;
  return (
    <div className="fin-ai-page">
      <section className="ai-hero">
        <span className="ai-orb">
          <Sparkles size={31} />
        </span>
        <span className="fin-kicker">DOMPET INTELLIGENCE</span>
        <h2>{t("ai")}</h2>
        <p>{t("aiHint")}</p>
        <div className="ai-context-tags">
          <span>
            {state.entries.filter((e) => e.date.startsWith(month)).length} {t("transactions")}
          </span>
          <span>
            {state.wallets.length} {t("wallets")}
          </span>
          <span>
            {state.goals.length} {t("goals")}
          </span>
        </div>
        <button className="fin-primary" onClick={analyze} disabled={ai.isPending}>
          {ai.isPending ? (
            <Busy text={t("processing")} />
          ) : (
            <>
              <Sparkles size={17} />
              {t("analyze")}
            </>
          )}
        </button>
      </section>
      <section className="fin-card ai-question">
        <h3>{t("askAI")}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void analyze();
          }}
        >
          <input
            aria-label={t("askAI")}
            placeholder={t("questionPlaceholder")}
            value={question}
            maxLength={1500}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            className="fin-primary"
            aria-label={t("askAI")}
            disabled={ai.isPending || !question.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </section>
      {error && (
        <div className="fin-error" role="alert">
          {error}
        </div>
      )}
      {result && (
        <div className="ai-result">
          <section className="fin-card ai-summary">
            <span>
              <Sparkles size={19} />
            </span>
            <h3>{t("analytics")}</h3>
            <p>{result.summary}</p>
            {result.answer && <p className="ai-answer">{result.answer}</p>}
          </section>
          <div className="fin-section-heading">
            <h2>
              <TrendingUp size={19} />
              {t("observations")}
            </h2>
          </div>
          <div className="fin-plan-grid">
            {result.observations.map((o, i) => (
              <section className={"fin-card ai-insight " + o.severity} key={i}>
                <h3>{o.title}</h3>
                <p>{o.detail}</p>
              </section>
            ))}
          </div>
          <div className="fin-section-heading">
            <h2>
              <Lightbulb size={19} />
              {t("recommendations")}
            </h2>
          </div>
          <div className="ai-recommendations">
            {result.recommendations.map((r, i) => (
              <section className="fin-card ai-recommendation" key={i}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{r.title}</h3>
                  <p>{r.detail}</p>
                </div>
                <ArrowRight size={18} />
              </section>
            ))}
          </div>
          <p className="fin-muted">{result.disclaimer}</p>
        </div>
      )}
      <div className="ai-disclaimer">
        <ShieldCheck size={19} />
        <p>{t("aiDisclaimer")}</p>
      </div>
    </div>
  );
}
