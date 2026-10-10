import { useEffect, useRef, useState } from "react";
import { Check, Mic, ScanLine, Sparkles, Square, Wallet, ArrowLeft } from "lucide-react";
import { today, type Entry } from "../../../shared/finance";
import { useAIDraft } from "../../queries/finance";
import { base64, receiptImage, recordWav } from "../../lib/media";
import { useFin, errorMessage } from "./context";
import { Busy, CategorySelect, Sheet } from "./primitives";
import { categoryKey } from "../../lib/i18n";
export function EntrySheet({
  onClose,
  onDelete,
  entry,
  initialCategory = "food",
}: {
  onClose: () => void;
  onDelete?: () => void;
  entry?: Entry;
  initialCategory?: string;
}) {
  const { state, lang, t, commit, saving, notify } = useFin();
  const [mode, setMode] = useState<"manual" | "text" | "receipt" | "voice">(
    entry ? "manual" : "manual",
  );
  const [walletId, setWallet] = useState(entry?.walletId || state.wallets[0]!.id);
  const wallet = state.wallets.find((w) => w.id === walletId)!;
  const [kind, setKind] = useState<Entry["kind"]>(entry?.kind || "expense");
  const [category, setCategory] = useState(entry?.category || initialCategory);
  const [showCats, setShowCats] = useState(false);
  const [name, setName] = useState(entry?.name || "");
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [date, setDate] = useState(entry?.date || today());
  const [note, setNote] = useState(entry?.note || "");
  const [method, setMethod] = useState(entry?.method || "");
  const [toWallet, setToWallet] = useState(
    entry?.toWalletId || state.wallets.find((w) => w.id !== walletId)?.id || "",
  );
  const [received, setReceived] = useState(
    entry?.receivedAmount ? String(entry.receivedAmount) : "",
  );
  const [quick, setQuick] = useState("");
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Awaited<
    ReturnType<ReturnType<typeof useAIDraft>["mutateAsync"]>
  > | null>(null);
  const [media, setMedia] = useState<{
    data: string;
    type: "image/jpeg" | "audio/wav";
    url: string;
  } | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recordingRef = useRef<Awaited<ReturnType<typeof recordWav>> | null>(null);
  const mounted = useRef(true);
  const ai = useAIDraft();
  useEffect(
    () => () => {
      mounted.current = false;
      void recordingRef.current?.stop();
    },
    [],
  );
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setSeconds((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);
  useEffect(
    () => () => {
      if (media?.url) URL.revokeObjectURL(media.url);
    },
    [media],
  );
  async function record() {
    setError("");
    try {
      setRecording(true);
      setSeconds(0);
      const rec = await recordWav();
      if (!mounted.current) {
        await rec.stop();
        return;
      }
      recordingRef.current = rec;
      rec.setAutoStop(() => void stop());
    } catch (e) {
      setRecording(false);
      setError(errorMessage(e));
    }
  }
  async function stop() {
    const blob = await recordingRef.current?.stop();
    recordingRef.current = null;
    setRecording(false);
    if (blob && mounted.current) {
      const data = await base64(blob);
      setMedia({ data, type: "audio/wav", url: URL.createObjectURL(blob) });
    }
  }
  async function photo(file?: File) {
    if (!file) return;
    setError("");
    setPreparing(true);
    try {
      const result = await receiptImage(file);
      setMedia({ ...result, type: "image/jpeg" });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPreparing(false);
    }
  }
  async function audio(file?: File) {
    if (!file) return;
    setError("");
    if (file.size > 5500000) {
      setError("WAV file must be under 5 MB.");
      return;
    }
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (
      String.fromCharCode(...header.slice(0, 4)) !== "RIFF" ||
      String.fromCharCode(...header.slice(8, 12)) !== "WAVE"
    ) {
      setError("Please upload a WAV audio file.");
      return;
    }
    setMedia({ data: await base64(file), type: "audio/wav", url: URL.createObjectURL(file) });
  }
  async function process() {
    setError("");
    try {
      const result = await ai.mutateAsync({
        source: mode === "text" ? "text" : mode === "voice" ? "voice" : "receipt",
        text: quick,
        currency: wallet.currency,
        language: lang,
        date: today(),
        ...(media ? { data: media.data, mediaType: media.type } : {}),
      });
      setDraft(result);
      setName(result.name);
      setAmount(result.amount > 0 ? String(result.amount) : "");
      setDate(result.date);
      setNote(result.note);
      setCategory(result.category);
      setKind(result.kind);
      const matching = state.wallets.find((w) => w.currency === result.currency);
      if (matching) setWallet(matching.id);
      else {
        setError(`${t("newWallet")}: ${result.currency}`);
      }
      setMode("manual");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function categorize() {
    if (!name.trim()) return;
    setError("");
    try {
      const result = await ai.mutateAsync({
        source: "text",
        text: `${name}; ${amount || 0} ${wallet.currency}; date ${date}. Only suggest category; do not change amounts.`,
        currency: wallet.currency,
        language: lang,
        date,
      });
      setCategory(result.category);
      notify(t("aiCategory"));
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const value = Number(amount);
    const dest = state.wallets.find((w) => w.id === toWallet);
    if (!name.trim() || !Number.isFinite(value) || value <= 0) {
      setError(t("failure"));
      return;
    }
    if (draft && draft.currency !== wallet.currency) {
      setError(`${t("currency")}: ${draft.currency}. ${t("newWallet")}`);
      return;
    }
    if (
      kind === "transfer" &&
      (!dest ||
        dest.id === walletId ||
        (dest.currency !== wallet.currency && !(Number(received) > 0)))
    ) {
      setError(t("destination"));
      return;
    }
    const item: Entry = {
      id: entry?.id || crypto.randomUUID(),
      name: name.trim(),
      amount: value,
      currency: wallet.currency,
      date,
      category: category as Entry["category"],
      walletId,
      kind,
      method,
      note,
      createdAt: entry?.createdAt || new Date().toISOString(),
      ...(kind === "transfer"
        ? {
            toWalletId: toWallet,
            receivedAmount: dest!.currency === wallet.currency ? value : Number(received),
          }
        : {}),
    };
    try {
      await commit({
        ...state,
        entries: entry
          ? state.entries.map((e) => (e.id === entry.id ? item : e))
          : [item, ...state.entries],
      });
      notify(t("success"));
      onClose();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Sheet
      title={entry ? t("editTransaction") : showCats ? t("categories") : t("newTransaction")}
      onClose={() => {
        if (!saving && !ai.isPending) onClose();
      }}
    >
      {showCats ? (
        <>
          <button className="fin-link" onClick={() => setShowCats(false)}>
            <ArrowLeft size={16} />
            {t("newTransaction")}
          </button>
          <CategorySelect
            value={category}
            onChange={(id) => {
              setCategory(id);
              setShowCats(false);
            }}
          />
        </>
      ) : (
        <>
          {!entry && (
            <div className="entry-modes">
              {(
                [
                  { id: "manual", key: "newTransaction", icon: Wallet },
                  { id: "text", key: "textEntry", icon: Sparkles },
                  { id: "voice", key: "voice", icon: Mic },
                  { id: "receipt", key: "scan", icon: ScanLine },
                ] as const
              ).map((m) => (
                <button
                  type="button"
                  disabled={recording || ai.isPending}
                  key={m.id}
                  className={mode === m.id ? "selected" : ""}
                  onClick={() => {
                    setMode(m.id);
                    setMedia(null);
                    setError("");
                  }}
                >
                  <m.icon size={20} />
                  <small>{t(m.key)}</small>
                </button>
              ))}
            </div>
          )}
          {mode !== "manual" ? (
            <div className="ai-input-pane">
              <p className="fin-muted">{t("aiPrivacy")}</p>
              {mode === "text" && (
                <textarea
                  aria-label={t("textEntry")}
                  placeholder={t("quickPlaceholder")}
                  value={quick}
                  maxLength={3000}
                  onChange={(e) => setQuick(e.target.value)}
                  rows={4}
                />
              )}
              {mode === "receipt" && (
                <>
                  <label className="file-input">
                    <ScanLine size={28} />
                    {t("choosePhoto")}
                    <input
                      aria-label={t("choosePhoto")}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      capture="environment"
                      onChange={(e) => void photo(e.target.files?.[0])}
                    />
                  </label>
                  {media?.type === "image/jpeg" && (
                    <img className="receipt-preview" src={media.url} alt={t("scan")} />
                  )}
                </>
              )}
              {mode === "voice" && (
                <>
                  <div className={"recording-box " + (recording ? "recording" : "")}>
                    <Mic size={34} />
                    <span>{recording ? `${seconds}s / 30s` : t("voice")}</span>
                    <button
                      className={recording ? "fin-danger" : "fin-primary"}
                      disabled={preparing}
                      onClick={() => void (recording ? stop() : record())}
                    >
                      {recording ? <Square size={16} /> : <Mic size={17} />}{" "}
                      {recording ? t("stop") : t("record")}
                    </button>
                  </div>
                  <p className="fin-muted">{t("audioPrivacy")}</p>
                  {media?.type === "audio/wav" && (
                    // User-recorded audio has no captions until the explicit AI transcription; that text is shown in the review draft.
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <audio controls src={media.url} aria-label={t('voice')} />
                  )}
                  <label className="fin-link file-link">
                    {t("chooseAudio")}
                    <input
                      aria-label={t("chooseAudio")}
                      type="file"
                      accept="audio/wav,.wav"
                      onChange={(e) => void audio(e.target.files?.[0])}
                    />
                  </label>
                </>
              )}
              {error && (
                <div className="fin-error" role="alert">
                  {error}
                </div>
              )}
              <button
                className="fin-primary full"
                onClick={process}
                disabled={
                  ai.isPending ||
                  preparing ||
                  recording ||
                  (mode === "text" ? !quick.trim() : !media)
                }
              >
                {ai.isPending || preparing ? (
                  <Busy text={t("processing")} />
                ) : (
                  <>
                    <Sparkles size={17} />
                    {t("sendAI")}
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              {draft && (
                <div className="draft-banner">
                  <strong>
                    <Sparkles size={17} />
                    {t("review")}
                  </strong>
                  <p>{t("reviewHint")}</p>
                  <small>
                    {t("confidence")}: {t(draft.confidence)}
                  </small>
                  {draft.needsReview.length > 0 && (
                    <ul>
                      {draft.needsReview.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  )}
                  <details>
                    <summary>{t("originalText")}</summary>
                    <p>{draft.transcript}</p>
                  </details>
                </div>
              )}
              <form onSubmit={save}>
                <div className="fin-segment">
                  {(["expense", "income", "transfer"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={kind === k ? "selected" : ""}
                      disabled={k === "transfer" && state.wallets.length < 2}
                      onClick={() => setKind(k)}
                    >
                      {t(k)}
                    </button>
                  ))}
                </div>
                <label>
                  {t("wallet")}
                  <select
                    aria-label={t("wallet")}
                    value={walletId}
                    onChange={(e) => {
                      setWallet(e.target.value);
                      if (e.target.value === toWallet)
                        setToWallet(state.wallets.find((w) => w.id !== e.target.value)?.id || "");
                    }}
                  >
                    {state.wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} · {w.currency}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("name")}
                  <input
                    aria-label={t("name")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={180}
                  />
                </label>
                <div className="fin-form-pair">
                  <label>
                    {t("amount")} ({wallet.currency})
                    <input
                      aria-label={t("amount")}
                      inputMode="decimal"
                      type="number"
                      step={wallet.currency === "IDR" || wallet.currency === "JPY" ? "1" : "0.01"}
                      min="0.01"
                      max="1000000000000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    {t("date")}
                    <input
                      aria-label={t("date")}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </label>
                </div>
                {kind === "transfer" ? (
                  <>
                    <label>
                      {t("destination")}
                      <select
                        aria-label={t("destination")}
                        value={toWallet}
                        onChange={(e) => setToWallet(e.target.value)}
                        required
                      >
                        {state.wallets
                          .filter((w) => w.id !== walletId)
                          .map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} · {w.currency}
                            </option>
                          ))}
                      </select>
                    </label>
                    {state.wallets.find((w) => w.id === toWallet)?.currency !== wallet.currency && (
                      <label>
                        {t("received")} ({state.wallets.find((w) => w.id === toWallet)?.currency})
                        <input
                          aria-label={t("received")}
                          type="number"
                          step="any"
                          min="0.01"
                          value={received}
                          onChange={(e) => setReceived(e.target.value)}
                          required
                        />
                      </label>
                    )}
                    <p className="fin-muted">{t("walletHint")}</p>
                  </>
                ) : (
                  <div className="category-form-row">
                    <button
                      type="button"
                      className="category-button"
                      onClick={() => setShowCats(true)}
                    >
                      <span>{t("category")}</span>
                      <strong>{t(categoryKey(category))}</strong>
                    </button>
                    <button
                      type="button"
                      className="fin-link"
                      onClick={categorize}
                      disabled={ai.isPending || !name.trim()}
                    >
                      {ai.isPending ? (
                        <Busy text={t("processing")} />
                      ) : (
                        <>
                          <Sparkles size={16} />
                          {t("aiCategory")}
                        </>
                      )}
                    </button>
                  </div>
                )}
                <label>
                  {t('method')}
                  <select aria-label={t('method')} value={method} onChange={e=>setMethod(e.target.value)}><option value="">—</option>{(['cash','card','bank','ewallet'] as const).map(m=><option key={m} value={m}>{t(m)}</option>)}</select>
                </label>
                <label>
                  {t("note")}
                  <input
                    aria-label={t("note")}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={1000}
                  />
                </label>
                {error && (
                  <div className="fin-error" role="alert">
                    {error}
                  </div>
                )}
                <button className="fin-primary full" disabled={saving || ai.isPending}>
                  {saving ? (
                    <Busy text={t("syncing")} />
                  ) : (
                    <>
                      <Check size={18} />
                      {t("save")}
                    </>
                  )}
                </button>
              </form>
            </>
          )}
          {entry && onDelete && mode === "manual" && (
            <button
              className="fin-link fin-delete-link"
              type="button"
              disabled={saving}
              onClick={onDelete}
            >
              {t("delete")}
            </button>
          )}
        </>
      )}
    </Sheet>
  );
}
