import { useEffect, useRef, type ReactNode } from "react";
import { X, LoaderCircle, Plus, Wallet } from "lucide-react";
import { categories } from "../../lib/spending";
import { categoryKey } from "../../lib/i18n";
import { useFin } from "./context";
export function Sheet({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    return () => {
      d?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"fin-sheet " + (wide ? "wide" : "")}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="sheet-head">
        <h2>{title}</h2>
        <button aria-label="Close" className="fin-icon" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Busy({ text }: { text: string }) {
  return (
    <span className="fin-busy">
      <LoaderCircle size={16} className="spin" />
      {text}
    </span>
  );
}
export function Empty({ onAdd }: { onAdd?: () => void }) {
  const { t } = useFin();
  return (
    <div className="fin-empty">
      <span>
        <Wallet size={30} />
      </span>
      <h3>{t("noData")}</h3>
      <p>{t("emptyHint")}</p>
      {onAdd && (
        <button className="fin-primary" onClick={onAdd}>
          <Plus size={17} />
          {t("add")}
        </button>
      )}
    </div>
  );
}
export function CategoryIcon({ id }: { id: string }) {
  const c = categories.find((c) => c.id === id) || categories[15]!;
  return (
    <span className="fin-cat-icon" style={{ color: c.color, background: c.bg }}>
      <c.icon size={21} />
    </span>
  );
}
export function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useFin();
  return (
    <div className="fin-category-select">
      {categories.map((c) => (
        <button
          type="button"
          key={c.id}
          className={value === c.id ? "chosen" : ""}
          onClick={() => onChange(c.id)}
          aria-pressed={value === c.id}
        >
          <CategoryIcon id={c.id} />
          <small>{t(categoryKey(c.id))}</small>
        </button>
      ))}
    </div>
  );
}
