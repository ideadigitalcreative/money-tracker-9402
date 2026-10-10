import {
  ShoppingBasket,
  Plane,
  Car,
  House,
  ShieldCheck,
  BookOpen,
  Megaphone,
  ShoppingBag,
  Wifi,
  Droplet,
  KeyRound,
  Dumbbell,
  Bell,
  Palmtree,
  Grid2X2,
  Utensils,
} from "lucide-react";
export const categories = [
  { id: "food", name: "Makanan", icon: Utensils, color: "#f29d52", bg: "#fff2e5" },
  { id: "groceries", name: "Belanja dapur", icon: ShoppingBasket, color: "#63b96b", bg: "#edf8ee" },
  { id: "travel", name: "Transportasi", icon: Car, color: "#648de1", bg: "#eef3fe" },
  { id: "shopping", name: "Belanja", icon: ShoppingBag, color: "#dc75ad", bg: "#fceef6" },
  { id: "home", name: "Rumah", icon: House, color: "#af66dc", bg: "#f5ecfc" },
  { id: "insurance", name: "Asuransi", icon: ShieldCheck, color: "#44b6c4", bg: "#e9f8fa" },
  { id: "education", name: "Pendidikan", icon: BookOpen, color: "#8560ce", bg: "#f1ecfb" },
  { id: "entertainment", name: "Hiburan", icon: Megaphone, color: "#e7ad3c", bg: "#fff7df" },
  { id: "internet", name: "Internet", icon: Wifi, color: "#9870db", bg: "#f1ebfb" },
  { id: "water", name: "Air & listrik", icon: Droplet, color: "#4c9bdf", bg: "#eaf5fd" },
  { id: "rent", name: "Sewa", icon: KeyRound, color: "#e07c47", bg: "#fff0e7" },
  { id: "gym", name: "Olahraga", icon: Dumbbell, color: "#dba550", bg: "#fcf3e4" },
  { id: "subscription", name: "Langganan", icon: Bell, color: "#b26ada", bg: "#f6edfc" },
  { id: "vacation", name: "Liburan", icon: Palmtree, color: "#40ad87", bg: "#e8f7f0" },
  { id: "flight", name: "Perjalanan", icon: Plane, color: "#2bb0b6", bg: "#e7f9f9" },
  { id: "other", name: "Lainnya", icon: Grid2X2, color: "#8c69d5", bg: "#f0eafb" },
];
export type Transaction = {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
  method: string;
};
export const money = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
export const initialTransactions: Transaction[] = [
  {
    id: "1",
    name: "Belanja mingguan",
    category: "groceries",
    amount: 325000,
    date: "2026-10-10",
    method: "Kartu debit",
  },
  {
    id: "2",
    name: "Kopi sore di Kopi Kenangan",
    category: "food",
    amount: 38000,
    date: "2026-10-10",
    method: "QRIS",
  },
  {
    id: "3",
    name: "Grab ke kantor",
    category: "travel",
    amount: 45000,
    date: "2026-10-09",
    method: "E-wallet",
  },
  {
    id: "4",
    name: "Langganan Spotify",
    category: "subscription",
    amount: 54990,
    date: "2026-10-09",
    method: "Kartu debit",
  },
  {
    id: "5",
    name: "Makan siang",
    category: "food",
    amount: 65000,
    date: "2026-10-08",
    method: "QRIS",
  },
  {
    id: "6",
    name: "Uniqlo • Kemeja linen",
    category: "shopping",
    amount: 399000,
    date: "2026-10-07",
    method: "Kartu debit",
  },
  {
    id: "7",
    name: "Belanja bahan makanan",
    category: "groceries",
    amount: 485000,
    date: "2026-10-06",
    method: "Kartu debit",
  },
  {
    id: "8",
    name: "Internet bulanan",
    category: "internet",
    amount: 350000,
    date: "2026-10-05",
    method: "Transfer bank",
  },
  {
    id: "9",
    name: "Makan malam bersama teman",
    category: "food",
    amount: 420000,
    date: "2026-10-04",
    method: "QRIS",
  },
  {
    id: "10",
    name: "Bensin & parkir",
    category: "travel",
    amount: 380000,
    date: "2026-10-03",
    method: "Tunai",
  },
  {
    id: "11",
    name: "Bioskop akhir pekan",
    category: "entertainment",
    amount: 160000,
    date: "2026-10-02",
    method: "QRIS",
  },
  {
    id: "12",
    name: "Belanja kebutuhan rumah",
    category: "shopping",
    amount: 730000,
    date: "2026-10-01",
    method: "Kartu debit",
  },
  ...[5, 6, 7, 8, 9].flatMap((m, i) =>
    ["food", "groceries", "travel", "shopping", "subscription"].map((c, j) => ({
      id: `past-${m}-${j}`,
      name: "Pengeluaran " + categories.find((x) => x.id === c)!.name,
      category: c,
      amount: [1050000, 850000, 650000, 780000, 240000][j]! + i * 37000,
      date: `2026-${String(m).padStart(2, "0")}-${String(j * 4 + 2).padStart(2, "0")}`,
      method: "Kartu debit",
    })),
  ),
];
export const monthLabel = (month: string) =>
  new Date(month + "-01T12:00:00").toLocaleDateString("id-ID", { month: "long", year: "numeric" });
export const dateLabel = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
