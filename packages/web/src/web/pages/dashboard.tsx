import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChartColumnIncreasing,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Coffee,
  Download,
  Ellipsis,
  Grid2X2,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  UserRound,
  Wallet,
  X,
} from "lucide-react";
import {
  categories,
  dateLabel,
  initialTransactions,
  money,
  monthLabel,
  type Transaction,
} from "../lib/spending";

const nav = [
  { name: "Ringkasan", icon: LayoutDashboard },
  { name: "Transaksi", icon: ArrowDownLeft },
  { name: "Kategori", icon: Grid2X2 },
  { name: "Analitik", icon: ChartColumnIncreasing },
];
function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
export default function Dashboard() {
  const [page, setPage] = useState("Ringkasan");
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    load("dompet-transactions", initialTransactions),
  );
  const [budget, setBudget] = useState(() => load("dompet-budget", 6000000));
  const [month, setMonth] = useState("2026-10");
  const [search, setSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState<"transaction" | "budget" | "help" | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [chosen, setChosen] = useState("food");
  const [toast, setToast] = useState("");
  const [period, setPeriod] = useState("Bulanan");
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);
  useEffect(() => {
    localStorage.setItem("dompet-transactions", JSON.stringify(transactions));
  }, [transactions]);
  useEffect(() => {
    localStorage.setItem("dompet-budget", JSON.stringify(budget));
  }, [budget]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  const monthly = useMemo(
    () =>
      transactions
        .filter((t) => t.date.startsWith(month))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, month],
  );
  const total = monthly.reduce((s, t) => s + t.amount, 0);
  const remaining = budget - total;
  const prevMonth = new Date(month + "-01T12:00:00");
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const previous = transactions
    .filter((t) => t.date.startsWith(prevKey))
    .reduce((s, t) => s + t.amount, 0);
  const delta = previous ? Math.round(((previous - total) / previous) * 100) : 0;
  const categoryTotals = categories
    .map((c) => ({
      ...c,
      total: monthly.filter((t) => t.category === c.id).reduce((s, t) => s + t.amount, 0),
    }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);
  const displayed = monthly.filter(
    (t) =>
      (filter === "all" || t.category === filter) &&
      t.name.toLowerCase().includes(search.toLowerCase()),
  );
  function add(category = "food") {
    setEditing(null);
    setChosen(category);
    setModal("transaction");
  }
  function exportCsv() {
    const csv =
      "Tanggal,Nama,Kategori,Jumlah,Metode\n" +
      monthly
        .map((t) =>
          [
            t.date,
            '"' + t.name.replaceAll('"', '""') + '"',
            categories.find((c) => c.id === t.category)?.name,
            t.amount,
            t.method,
          ].join(","),
        )
        .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }));
    a.download = `dompet-${month}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    setToast("Transaksi berhasil diekspor");
  }
  function shiftMonth(amount: number) {
    const d = new Date(month + "-01T12:00:00");
    d.setMonth(d.getMonth() + amount);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const graphMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(month + "-01T12:00:00");
    d.setMonth(d.getMonth() - 5 + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return {
      label: d.toLocaleDateString("id-ID", { month: "short" }),
      value: transactions.filter((t) => t.date.startsWith(key)).reduce((s, t) => s + t.amount, 0),
    };
  });
  const graphMax = Math.max(budget, ...graphMonths.map((m) => m.value), 1);
  const daily = Array.from({ length: 4 }, (_, i) => ({
    label: `Minggu ${i + 1}`,
    value: monthly
      .filter((t) => Math.min(3, Math.floor((Number(t.date.slice(-2)) - 1) / 8)) === i)
      .reduce((s, t) => s + t.amount, 0),
  }));
  const graph = period === "Bulanan" ? graphMonths : daily;
  return (
    <div className={`app-shell mobile-page-${page}`}>
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Dompet beranda">
          <span className="brand-icon">
            <Wallet size={22} />
          </span>
          dompet<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">A</span>
          <div>
            <strong>Dompet pribadi</strong>
            <small>Ruang keuangan Anda</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-caption">MENU UTAMA</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.name}
              className={page === n.name ? "nav-item active" : "nav-item"}
              onClick={() => setPage(n.name)}
            >
              <n.icon size={20} />
              {n.name}
              {page === n.name && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="mini-tip">
            <span className="tip-icon">
              <Sparkles size={20} />
            </span>
            <strong>Langkah kecil, dampak besar.</strong>
            <p>Catat pengeluaran hari ini untuk keuangan yang lebih baik.</p>
            <button onClick={() => add()}>
              Mulai mencatat <ArrowRight size={15} />
            </button>
          </div>
          <button
            className={"nav-item " + (page === "Pengaturan" ? "active" : "")}
            onClick={() => setPage("Pengaturan")}
          >
            <Settings size={20} />
            Pengaturan
          </button>
          <button className="nav-item" onClick={() => setModal("help")}>
            <CircleHelp size={20} />
            Bantuan
          </button>
          <div className="profile">
            <div className="avatar">AP</div>
            <div>
              <strong>Aditya Pratama</strong>
              <small>Akun pribadi</small>
            </div>
            <ShieldCheck size={18} />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="mobile-appbar">
          {page === "Ringkasan" ? (
            <div className="mobile-greeting">
              <span>Halo, Aditya</span>
              <strong>
                Dompet pribadi<span>.</span>
              </strong>
            </div>
          ) : (
            <>
              <button
                className="mobile-back"
                aria-label="Kembali ke beranda"
                onClick={() => setPage("Ringkasan")}
              >
                <ChevronLeft size={22} />
              </button>
              <h2>
                {page === "Kategori"
                  ? "Pilih kategori"
                  : page === "Pengaturan"
                    ? "Akun pribadi"
                    : page}
              </h2>
            </>
          )}
          <button
            className="mobile-header-action"
            aria-label="Pengaturan akun"
            onClick={() => setPage("Pengaturan")}
          >
            {page === "Ringkasan" ? <UserRound size={21} /> : <Settings size={20} />}
          </button>
        </header>
        <header className="topbar">
          <div className="breadcrumb">
            Dompet pribadi <ChevronRight size={14} /> <span>{page}</span>
          </div>
          <div className="top-actions">
            <span className="local-label">
              <span />
              Tersimpan di perangkat
            </span>
            <button
              className="icon-button notification"
              aria-label="Informasi notifikasi"
              onClick={() =>
                setToast("Semua pengeluaran Anda sudah tercatat. Tidak ada notifikasi baru.")
              }
            >
              <Bell size={19} />
              <i />
            </button>
            <div className="avatar small">AP</div>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">KEUANGAN PRIBADI, LEBIH TERATUR</div>
              <h1>
                {page === "Ringkasan"
                  ? "Uangmu, dalam kendalimu."
                  : page === "Transaksi"
                    ? "Setiap transaksi, tercatat."
                    : page === "Kategori"
                      ? "Ada tempat untuk semuanya."
                      : page === "Analitik"
                        ? "Kenali pola pengeluaranmu."
                        : "Atur dompet pribadimu."}
              </h1>
              <p>
                {page === "Ringkasan"
                  ? "Pantau pengeluaran, bangun kebiasaan finansial yang lebih baik."
                  : page === "Kategori"
                    ? "Pilih kategori untuk mulai mencatat pengeluaran."
                    : "Kelola keuangan dengan lebih jelas, satu langkah setiap hari."}
              </p>
            </div>
            <button className="primary" onClick={() => add()}>
              <Plus size={18} />
              Tambah transaksi
            </button>
          </div>
          <div className="section-toolbar">
            <div className="section-title">
              {page === "Ringkasan" ? "Ringkasan bulanan" : page}
              <span className="demo-badge">Data contoh</span>
            </div>
            <div className="month-control">
              <button aria-label="Bulan sebelumnya" onClick={() => shiftMonth(-1)}>
                <ChevronLeft size={16} />
              </button>
              <span>{monthLabel(month)}</span>
              <button aria-label="Bulan berikutnya" onClick={() => shiftMonth(1)}>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          {(page === "Ringkasan" || page === "Analitik") && (
            <>
              <div className="summary-grid">
                <div className="summary-card total-card">
                  <div className="summary-label">
                    <span>Total pengeluaran</span>
                    <span className="stat-icon">
                      <Wallet size={19} />
                    </span>
                  </div>
                  <h2>{money(total)}</h2>
                  <div className="stat-foot">
                    <span className="comparison">
                      <TrendingDown size={14} />
                      {Math.abs(delta)}% {delta >= 0 ? "lebih hemat" : "lebih tinggi"}
                    </span>
                    <span>dari bulan lalu</span>
                  </div>
                  <div className="decor-circle c1" />
                  <div className="decor-circle c2" />
                </div>
                <div className="summary-card">
                  <div className="summary-label">
                    <span>Anggaran bulanan</span>
                    <span className="stat-icon neutral">
                      <Target size={19} />
                    </span>
                  </div>
                  <h2>
                    {money(budget)}
                    <button className="text-edit" onClick={() => setModal("budget")}>
                      Ubah
                    </button>
                  </h2>
                  <div className="budget-progress">
                    <span style={{ width: `${Math.min(100, (total / budget) * 100)}%` }} />
                  </div>
                  <div className="budget-caption">
                    {Math.round((total / budget) * 100)}% terpakai{" "}
                    <span>dari anggaran bulanan</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">
                    <span>Sisa anggaran</span>
                    <span className="stat-icon green">
                      <Wallet size={19} />
                    </span>
                  </div>
                  <h2>{money(remaining)}</h2>
                  <div className="stat-foot">
                    <span className={"budget-status " + (remaining < 0 ? "over" : "")}>
                      <span />
                      {remaining >= 0 ? "Masih dalam anggaran" : "Melebihi anggaran"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="analytics-grid">
                <section className="card trend-card">
                  <div className="card-heading">
                    <div>
                      <h3>Tren pengeluaran</h3>
                      <p>Lihat bagaimana pengeluaranmu berubah</p>
                    </div>
                    <div className="segmented">
                      {["Bulanan", "Mingguan"].map((p) => (
                        <button
                          key={p}
                          className={p === period ? "selected" : ""}
                          onClick={() => setPeriod(p)}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="purple" />
                      Pengeluaran
                    </span>
                    <span>
                      <i className="mint" />
                      Anggaran
                    </span>
                  </div>
                  <div className="bar-chart">
                    <div className="y-labels">
                      {[1, 0.75, 0.5, 0.25, 0].map((n) => (
                        <span key={n}>
                          {((graphMax * n) / 1000000).toLocaleString("id-ID", {
                            maximumFractionDigits: 1,
                          })}{" "}
                          jt
                        </span>
                      ))}
                    </div>
                    <div className="plot">
                      <div className="grid-lines">
                        {[0, 1, 2, 3, 4].map((n) => (
                          <i key={n} />
                        ))}
                      </div>
                      <div className="bars">
                        {graph.map((m, i) => (
                          <div className="bar-group" key={m.label}>
                            <div className="bar-pair">
                              <div
                                className={
                                  "bar expense " + (i === graph.length - 1 ? "current" : "")
                                }
                                style={{ height: `${Math.max(1, (m.value / graphMax) * 100)}%` }}
                              >
                                <span className="chart-tooltip">{money(m.value)}</span>
                              </div>
                              <div
                                className="bar planned"
                                style={{
                                  height: `${((period === "Bulanan" ? budget : budget / 4) / graphMax) * 100}%`,
                                }}
                              />
                            </div>
                            <span className={i === graph.length - 1 ? "current-label" : ""}>
                              {m.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
                <section className="card category-breakdown">
                  <div className="card-heading">
                    <div>
                      <h3>Pengeluaran per kategori</h3>
                      <p>Ke mana uangmu pergi?</p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Buka analitik kategori"
                      onClick={() => setPage("Analitik")}
                    >
                      <Ellipsis size={20} />
                    </button>
                  </div>
                  <div className="donut-area">
                    <svg viewBox="0 0 180 180" className="donut">
                      <circle
                        cx="90"
                        cy="90"
                        r="67"
                        fill="none"
                        stroke="#f1eff6"
                        strokeWidth="21"
                      />
                      {categoryTotals.map((c, i) => {
                        const offset = categoryTotals
                          .slice(0, i)
                          .reduce((s, x) => s + (x.total / total) * 421, 0);
                        return (
                          <circle
                            key={c.id}
                            cx="90"
                            cy="90"
                            r="67"
                            fill="none"
                            stroke={
                              [
                                "#9864e7",
                                "#b68bea",
                                "#d5b6f4",
                                "#e6d6f8",
                                "#a9d7c1",
                                "#cedece",
                                "#f3d8ab",
                              ][i % 7]
                            }
                            strokeWidth="21"
                            strokeDasharray={`${Math.max(0, (c.total / total) * 421 - 4)} 421`}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 90 90)"
                          />
                        );
                      })}
                    </svg>
                    <div className="donut-center">
                      <small>Total pengeluaran</small>
                      <strong>
                        {(total / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                        <span>jt</span>
                      </strong>
                      <small>{categoryTotals.length} kategori</small>
                    </div>
                  </div>
                  <div className="category-legend">
                    {categoryTotals.slice(0, 3).map((c, i) => (
                      <div key={c.id}>
                        <span>
                          <i style={{ background: ["#9864e7", "#b68bea", "#d5b6f4"][i] }} />
                          {c.name}
                        </span>
                        <strong>{money(c.total)}</strong>
                        <small>{Math.round((c.total / total) * 100)}%</small>
                      </div>
                    ))}
                    {categoryTotals.length > 3 && (
                      <div>
                        <span>
                          <i style={{ background: "#e6d6f8" }} />
                          Lainnya
                        </span>
                        <strong>
                          {money(categoryTotals.slice(3).reduce((s, c) => s + c.total, 0))}
                        </strong>
                        <small>
                          {Math.round(
                            (categoryTotals.slice(3).reduce((s, c) => s + c.total, 0) / total) *
                              100,
                          )}
                          %
                        </small>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
          {(page === "Ringkasan" || page === "Transaksi") && (
            <div className={page === "Ringkasan" ? "lower-grid" : "transactions-full"}>
              <section className="card transactions-card">
                <div className="card-heading">
                  <div>
                    <h3>
                      {page === "Ringkasan" ? "Transaksi terbaru" : "Semua transaksi"}
                      <span className="count-badge">{monthly.length}</span>
                    </h3>
                    <p>Pengeluaran kecil juga berarti</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => (page === "Ringkasan" ? setPage("Transaksi") : exportCsv())}
                  >
                    {page === "Ringkasan" ? "Lihat semua" : "Ekspor CSV"}
                    {page === "Ringkasan" ? <ArrowRight size={15} /> : <Download size={15} />}
                  </button>
                </div>
                {page === "Transaksi" && (
                  <div className="transaction-filters">
                    <label className="search-box">
                      <Search size={17} />
                      <input
                        aria-label="Cari transaksi"
                        placeholder="Cari transaksi..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                      <option value="all">Semua kategori</option>
                      {categories.map((c) => (
                        <option value={c.id} key={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Transaksi</th>
                        <th>Kategori</th>
                        <th>Tanggal</th>
                        <th className="align-right">Jumlah</th>
                        <th aria-label="Tindakan" />
                      </tr>
                    </thead>
                    <tbody>
                      {displayed.slice(0, page === "Ringkasan" ? 4 : 1000).map((t) => {
                        const c = categories.find((c) => c.id === t.category)!;
                        return (
                          <tr
                            key={t.id}
                            onClick={() => {
                              setEditing(t);
                              setChosen(t.category);
                              setModal("transaction");
                            }}
                          >
                            <td aria-label={t.name}>
                              <div className="transaction-name">
                                <span
                                  className="category-icon"
                                  style={{ background: c.bg, color: c.color }}
                                >
                                  {t.name.includes("Kopi") ? (
                                    <Coffee size={20} />
                                  ) : (
                                    <c.icon size={20} />
                                  )}
                                </span>
                                <div>
                                  <strong>{t.name}</strong>
                                  <small>{t.method}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="category-tag">{c.name}</span>
                            </td>
                            <td className="date-cell">{dateLabel(t.date)}</td>
                            <td className="align-right amount">−{money(t.amount)}</td>
                            <td>
                              <button aria-label={"Edit " + t.name} className="row-arrow">
                                <ChevronRight size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {!displayed.length && (
                    <div className="empty-state">
                      <Wallet size={28} />
                      <h3>Belum ada transaksi</h3>
                      <p>Coba filter lain atau tambahkan pengeluaran pertamamu.</p>
                      <button className="text-button" onClick={() => add()}>
                        Tambah transaksi <Plus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </section>
              {page === "Ringkasan" && (
                <section className="card quick-category">
                  <div className="card-heading">
                    <div>
                      <h3>Catat pengeluaran</h3>
                      <p>Pilih kategori untuk memulai</p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Semua kategori"
                      onClick={() => setPage("Kategori")}
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  </div>
                  <div className="quick-grid">
                    {categories.slice(0, 8).map((c) => (
                      <button key={c.id} onClick={() => add(c.id)}>
                        <span style={{ color: c.color, background: c.bg }}>
                          <c.icon size={23} />
                        </span>
                        <small>{c.name}</small>
                      </button>
                    ))}
                  </div>
                  <button className="all-categories" onClick={() => setPage("Kategori")}>
                    Lihat semua kategori <ArrowRight size={15} />
                  </button>
                </section>
              )}
            </div>
          )}
          {page === "Kategori" && (
            <section className="card category-page">
              <label className="search-box">
                <Search size={18} />
                <input
                  aria-label="Cari kategori"
                  placeholder="Cari kategori..."
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                />
              </label>
              <div className="large-category-grid">
                {categories
                  .filter((c) => c.name.toLowerCase().includes(catSearch.toLowerCase()))
                  .map((c) => (
                    <button key={c.id} onClick={() => add(c.id)}>
                      <span style={{ color: c.color, background: c.bg }}>
                        <c.icon size={30} />
                      </span>
                      <strong>{c.name}</strong>
                      <small>
                        {money(
                          monthly
                            .filter((t) => t.category === c.id)
                            .reduce((s, t) => s + t.amount, 0),
                        )}{" "}
                        bulan ini
                      </small>
                    </button>
                  ))}
              </div>
              {!categories.some((c) => c.name.toLowerCase().includes(catSearch.toLowerCase())) && (
                <div className="empty-state">Kategori tidak ditemukan.</div>
              )}
            </section>
          )}
          {page === "Analitik" && (
            <section className="card analysis-detail">
              <div className="card-heading">
                <div>
                  <h3>Rincian kategori</h3>
                  <p>Proporsi pengeluaran pada {monthLabel(month).toLowerCase()}</p>
                </div>
                <button className="text-button" onClick={exportCsv}>
                  Ekspor data <Download size={16} />
                </button>
              </div>
              {categoryTotals.map((c) => (
                <div className="analysis-row" key={c.id}>
                  <span className="category-icon" style={{ color: c.color, background: c.bg }}>
                    <c.icon size={19} />
                  </span>
                  <strong>{c.name}</strong>
                  <div className="analysis-meter">
                    <span style={{ width: `${(c.total / total) * 100}%`, background: c.color }} />
                  </div>
                  <small>{Math.round((c.total / total) * 100)}%</small>
                  <strong>{money(c.total)}</strong>
                </div>
              ))}
            </section>
          )}
          {page === "Pengaturan" && (
            <section className="card settings-panel">
              <h3>Preferensi keuangan</h3>
              <p>Data disimpan hanya di browser ini, tanpa akun atau sinkronisasi cloud.</p>
              <div className="setting-row">
                <div>
                  <strong>Anggaran bulanan</strong>
                  <p>{money(budget)}</p>
                </div>
                <button className="secondary" onClick={() => setModal("budget")}>
                  Ubah anggaran
                </button>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Ekspor transaksi</strong>
                  <p>Unduh data bulan {monthLabel(month)} sebagai CSV.</p>
                </div>
                <button className="secondary" onClick={exportCsv}>
                  <Download size={16} />
                  Ekspor CSV
                </button>
              </div>
              <div className="setting-row">
                <div>
                  <strong>Mata uang & bahasa</strong>
                  <p>Rupiah (IDR) · Bahasa Indonesia</p>
                </div>
                <Check size={20} />
              </div>
            </section>
          )}
          <footer>
            <span>
              <ShieldCheck size={14} />
              Keuangan pribadi. Tetap pribadi.
            </span>
            <span>Dibuat untuk kebiasaan yang lebih baik.</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Navigasi aplikasi">
        {[...nav, { name: "Pengaturan", icon: UserRound }].map((n) => (
          <button
            key={n.name}
            className={page === n.name ? "mobile-tab selected" : "mobile-tab"}
            onClick={() => setPage(n.name)}
            aria-current={page === n.name ? "page" : undefined}
          >
            <span>
              <n.icon size={22} />
            </span>
            <small>
              {n.name === "Ringkasan" ? "Beranda" : n.name === "Pengaturan" ? "Akun" : n.name}
            </small>
          </button>
        ))}
      </nav>
      {!modal && page !== "Kategori" && page !== "Pengaturan" && (
        <button className="mobile-fab" aria-label="Tambah pengeluaran" onClick={() => add()}>
          <Plus size={27} />
        </button>
      )}
      {toast && (
        <output className="toast">
          <Check size={17} />
          {toast}
        </output>
      )}
      {modal && (
        <div className="modal-backdrop">
          <dialog open className="modal" aria-modal="true" aria-labelledby="modal-title">
            <button
              className="modal-close icon-button"
              aria-label="Tutup"
              onClick={() => setModal(null)}
            >
              <X size={20} />
            </button>
            {modal === "transaction" && (
              <>
                <div className="modal-symbol">
                  <Wallet size={24} />
                </div>
                <h2 id="modal-title">{editing ? "Edit transaksi" : "Tambah pengeluaran"}</h2>
                <p>Catat hari ini. Lebih tenang esok hari.</p>
                <form
                  key={editing?.id || "new"}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    const transaction: Transaction = {
                      id: editing?.id || crypto.randomUUID(),
                      name: String(data.get("name")).trim(),
                      amount: Number(data.get("amount")),
                      category: chosen,
                      date: String(data.get("date")),
                      method: String(data.get("method")),
                    };
                    if (!transaction.name || transaction.amount <= 0) return;
                    setTransactions((old) =>
                      editing
                        ? old.map((t) => (t.id === editing.id ? transaction : t))
                        : [transaction, ...old],
                    );
                    setMonth(transaction.date.slice(0, 7));
                    setModal(null);
                    setToast(editing ? "Transaksi diperbarui" : "Pengeluaran berhasil dicatat");
                  }}
                >
                  <label>
                    Nama transaksi
                    <input
                      aria-label="Nama transaksi"
                      autoFocus
                      name="name"
                      required
                      placeholder="Contoh: Makan siang"
                      defaultValue={editing?.name}
                    />
                  </label>
                  <div className="form-pair">
                    <label>
                      Jumlah (Rp)
                      <input
                        aria-label="Jumlah pengeluaran"
                        name="amount"
                        type="number"
                        min="1"
                        required
                        placeholder="0"
                        defaultValue={editing?.amount}
                      />
                    </label>
                    <label>
                      Tanggal
                      <input
                        aria-label="Tanggal transaksi"
                        name="date"
                        type="date"
                        required
                        defaultValue={
                          editing?.date || (month === "2026-10" ? "2026-10-10" : month + "-01")
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Kategori
                    <select value={chosen} onChange={(e) => setChosen(e.target.value)}>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Metode pembayaran
                    <select name="method" defaultValue={editing?.method || "QRIS"}>
                      {["QRIS", "Kartu debit", "E-wallet", "Transfer bank", "Tunai"].map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </label>
                  <div className="modal-form-actions">
                    {editing && (
                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => {
                          setTransactions((old) => old.filter((t) => t.id !== editing.id));
                          setModal(null);
                          setToast("Transaksi dihapus");
                        }}
                      >
                        Hapus transaksi
                      </button>
                    )}
                    <button className="primary" type="submit">
                      <Check size={17} />
                      Simpan transaksi
                    </button>
                  </div>
                </form>
              </>
            )}
            {modal === "budget" && (
              <>
                <h2 id="modal-title">Anggaran bulanan</h2>
                <p>Tentukan batas pengeluaran yang nyaman untukmu.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setBudget(Number(new FormData(e.currentTarget).get("budget")));
                    setModal(null);
                    setToast("Anggaran berhasil diperbarui");
                  }}
                >
                  <label>
                    Jumlah anggaran (Rp)
                    <input
                      aria-label="Jumlah anggaran"
                      autoFocus
                      type="number"
                      name="budget"
                      min="1"
                      required
                      defaultValue={budget}
                    />
                  </label>
                  <button className="primary" type="submit">
                    Simpan anggaran
                  </button>
                </form>
              </>
            )}
            {modal === "help" && (
              <>
                <h2 id="modal-title">Kenali Dompet</h2>
                <p>
                  Mulai dengan menambahkan pengeluaran atau memilih kategori. Ubah anggaran dari
                  kartu ringkasan. Klik transaksi untuk mengedit atau menghapusnya.
                </p>
                <div className="help-note">
                  <ShieldCheck size={24} />
                  <p>
                    Data contoh membantu Anda mencoba aplikasi. Semua perubahan tersimpan di browser
                    ini. Ekspor CSV untuk membuat salinan data Anda.
                  </p>
                </div>
                <button className="primary" onClick={() => setModal(null)}>
                  Mengerti
                </button>
              </>
            )}
          </dialog>
        </div>
      )}
    </div>
  );
}
