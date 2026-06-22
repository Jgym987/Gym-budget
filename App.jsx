import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";
import {
  Home, ShoppingBag, Car, Utensils, Music, Repeat, ShoppingCart, Heart,
  Receipt, Plane, PiggyBank, MoreHorizontal, Banknote, Laptop, TrendingUp,
  TrendingDown, RotateCcw, Gift, Plus, LayoutDashboard, List as ListIcon,
  BarChart3, Settings, ChevronLeft, ChevronRight, X, Trash2, Search,
  Wallet, Sparkles, ArrowUpRight, ArrowDownRight, Check, Calendar,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Thème — palette "Flux"                                             */
/* ------------------------------------------------------------------ */
const T = {
  encre: "#08090D",       // fond
  encre2: "#0D0F15",
  ardoise: "#13151C",     // cartes
  ardoise2: "#181B23",
  bordure: "rgba(255,255,255,0.07)",
  bordureFort: "rgba(255,255,255,0.13)",
  texte: "#F3F4F7",
  brume: "#8B92A3",       // texte secondaire
  faible: "#565C6B",
  menthe: "#2DD4A7",      // revenus / positif
  mentheSoft: "rgba(45,212,167,0.13)",
  corail: "#FF5E6C",      // dépenses / négatif
  corailSoft: "rgba(255,94,108,0.13)",
  indigo: "#7C6FF0",
};

/* ------------------------------------------------------------------ */
/*  Catégories                                                         */
/* ------------------------------------------------------------------ */
const ICONS = {
  Home, ShoppingBag, Car, Utensils, Music, Repeat, ShoppingCart, Heart,
  Receipt, Plane, PiggyBank, MoreHorizontal, Banknote, Laptop, TrendingUp,
  RotateCcw, Gift, Plus,
};

const EXPENSE_CATS = [
  { id: "logement",      label: "Logement",      icon: "Home",          color: "#7C6FF0" },
  { id: "alimentation",  label: "Alimentation",  icon: "ShoppingBag",   color: "#2DD4A7" },
  { id: "transport",     label: "Transport",     icon: "Car",           color: "#3B9EFF" },
  { id: "restaurants",   label: "Restaurants",   icon: "Utensils",      color: "#5BD1E0" },
  { id: "loisirs",       label: "Loisirs",       icon: "Music",         color: "#FF8A5B" },
  { id: "abonnements",   label: "Abonnements",   icon: "Repeat",        color: "#F4C04E" },
  { id: "shopping",      label: "Shopping",      icon: "ShoppingCart",  color: "#E879C7" },
  { id: "sante",         label: "Santé",         icon: "Heart",         color: "#FF5E6C" },
  { id: "factures",      label: "Factures",      icon: "Receipt",       color: "#9CA3AF" },
  { id: "voyages",       label: "Voyages",       icon: "Plane",         color: "#A78BFA" },
  { id: "epargne",       label: "Épargne",       icon: "PiggyBank",     color: "#4ADE80" },
  { id: "autre_depense", label: "Autres",        icon: "MoreHorizontal",color: "#6B7280" },
];

const INCOME_CATS = [
  { id: "salaire",         label: "Salaire",         icon: "Banknote",   color: "#2DD4A7" },
  { id: "freelance",       label: "Freelance",       icon: "Laptop",     color: "#3B9EFF" },
  { id: "investissements", label: "Investissements", icon: "TrendingUp", color: "#7C6FF0" },
  { id: "remboursements",  label: "Remboursements",  icon: "RotateCcw",  color: "#5BD1E0" },
  { id: "cadeaux",         label: "Cadeaux",         icon: "Gift",       color: "#E879C7" },
  { id: "autre_revenu",    label: "Autres",          icon: "Plus",       color: "#6B7280" },
];

const CAT_MAP = {};
EXPENSE_CATS.forEach((c) => (CAT_MAP[c.id] = { ...c, type: "expense" }));
INCOME_CATS.forEach((c) => (CAT_MAP[c.id] = { ...c, type: "income" }));
function getCat(id) {
  return CAT_MAP[id] || { id, label: "Autres", icon: "MoreHorizontal", color: "#6B7280", type: "expense" };
}

/* ------------------------------------------------------------------ */
/*  Utilitaires                                                        */
/* ------------------------------------------------------------------ */
const CURRENCIES = {
  EUR: { code: "EUR", symbole: "€", decimales: 2, label: "Euro (€)" },
  XPF: { code: "XPF", symbole: "F", decimales: 0, label: "Franc Pacifique (CFP)" },
  USD: { code: "USD", symbole: "$", decimales: 2, label: "Dollar US ($)" },
};

function fmt(amount, currency) {
  const c = CURRENCIES[currency] || CURRENCIES.EUR;
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency", currency: c.code, maximumFractionDigits: c.decimales, minimumFractionDigits: c.decimales,
    }).format(amount || 0);
  } catch (e) {
    return (amount || 0).toFixed(c.decimales) + " " + c.symbole;
  }
}
function fmtSigned(amount, currency) {
  const s = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return s + fmt(Math.abs(amount), currency);
}
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function uid() {
  return window.crypto && crypto.randomUUID
    ? crypto.randomUUID()
    : "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function monthKey(dateStr) { return dateStr.slice(0, 7); }
function curMonthKey() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
function monthLabel(key) {
  const d = new Date(key + "-01T00:00:00");
  return cap(d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }));
}
function monthShort(key) {
  const d = new Date(key + "-01T00:00:00");
  return cap(d.toLocaleDateString("fr-FR", { month: "short" })).replace(".", "");
}
function shiftMonth(key, delta) {
  const d = new Date(key + "-01T00:00:00");
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}
function fmtDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
}
function parseAmount(str) {
  const v = parseFloat(String(str).replace(/\s/g, "").replace(",", "."));
  return isNaN(v) ? 0 : v;
}

/* ------------------------------------------------------------------ */
/*  Données d'exemple                                                  */
/* ------------------------------------------------------------------ */
function dateNMonthsAgo(m, day) {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - m);
  const y = d.getFullYear(), mo = d.getMonth() + 1;
  const dim = new Date(y, mo, 0).getDate();
  return `${y}-${pad(mo)}-${pad(Math.min(day, dim))}`;
}
function generateSeed() {
  const tx = [];
  const add = (type, amount, cat, desc, m, day) =>
    tx.push({ id: uid(), type, amount, category: cat, description: desc, date: dateNMonthsAgo(m, day) });
  for (let m = 0; m < 4; m++) {
    add("income", 2600, "salaire", "Salaire", m, 2);
    add("expense", 780, "logement", "Loyer + charges", m, 5);
    add("expense", 300, "epargne", "Virement épargne", m, 6);
    add("expense", 64, "alimentation", "Courses", m, 8);
    add("expense", 47, "alimentation", "Courses", m, 17);
    add("expense", 53, "alimentation", "Courses", m, 26);
    add("expense", 75, "transport", "Forfait transport", m, 4);
    add("expense", 13.49, "abonnements", "Netflix", m, 12);
    add("expense", 10.99, "abonnements", "Spotify", m, 12);
    add("expense", 29.9, "abonnements", "Salle de sport", m, 3);
    add("expense", 32, "restaurants", "Restaurant", m, 14);
    add("expense", 18, "restaurants", "Déjeuner", m, 21);
    add("expense", 42, "loisirs", "Sortie", m, 18);
  }
  add("income", 450, "freelance", "Mission freelance", 1, 15);
  add("income", 60, "remboursements", "Remboursement note de frais", 1, 22);
  add("expense", 89, "shopping", "Vêtements", 0, 10);
  add("expense", 24, "sante", "Pharmacie", 0, 9);
  add("expense", 210, "voyages", "Week-end", 2, 20);
  add("income", 120, "cadeaux", "Cadeau anniversaire", 3, 11);
  return tx;
}

/* ------------------------------------------------------------------ */
/*  Persistance (window.storage avec repli en mémoire)                 */
/* ------------------------------------------------------------------ */
const STORAGE_KEY = "flux-budget-v1";
async function loadData() {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(STORAGE_KEY);
      if (r && r.value) return JSON.parse(r.value);
      return null;
    }
  } catch (e) { /* clé absente ou storage indisponible */ }
  // Repli pour un déploiement autonome (hors environnement Claude)
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch (e) { /* localStorage indisponible */ }
  return null;
}
async function saveData(data) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      await window.storage.set(STORAGE_KEY, JSON.stringify(data));
      return;
    }
  } catch (e) { /* repli silencieux */ }
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch (e) { /* stockage indisponible, données en mémoire seulement */ }
}

/* ------------------------------------------------------------------ */
/*  Hook compteur animé                                                */
/* ------------------------------------------------------------------ */
function useCountUp(value, duration = 600) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const reduce = useRef(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia)
      reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);
  useEffect(() => {
    if (reduce.current) { setDisplay(value); fromRef.current = value; return; }
    const from = fromRef.current, to = value;
    if (from === to) return;
    let raf; const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

/* ------------------------------------------------------------------ */
/*  Petits composants                                                  */
/* ------------------------------------------------------------------ */
function Card({ children, style, ...rest }) {
  return (
    <div
      {...rest}
      style={{
        background: T.ardoise, border: `1px solid ${T.bordure}`, borderRadius: 20,
        padding: 18, ...style,
      }}
    >
      {children}
    </div>
  );
}

function CatIcon({ id, size = 18, bg = true }) {
  const c = getCat(id);
  const Ico = ICONS[c.icon] || MoreHorizontal;
  if (!bg) return <Ico size={size} color={c.color} strokeWidth={2.2} />;
  return (
    <div
      style={{
        width: 40, height: 40, borderRadius: 13, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: c.color + "22", flexShrink: 0,
      }}
    >
      <Ico size={size} color={c.color} strokeWidth={2.2} />
    </div>
  );
}

function ChartTip({ active, payload, label, currency }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: "#1B1E27", border: `1px solid ${T.bordureFort}`, borderRadius: 12,
      padding: "9px 12px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    }}>
      <div style={{ color: T.brume, fontSize: 11, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: T.texte, fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: p.color || p.payload.color }} />
          <span style={{ color: T.brume, fontWeight: 500 }}>{p.name || ""}</span>
          {fmt(p.value, currency)}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  APP                                                                */
/* ------------------------------------------------------------------ */
export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [currency, setCurrency] = useState("EUR");
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [selMonth, setSelMonth] = useState(curMonthKey());
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState(null); // transaction sélectionnée
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  /* ---- chargement ---- */
  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await loadData();
      if (!alive) return;
      if (data && Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
        if (data.currency) setCurrency(data.currency);
      } else {
        const seed = generateSeed();
        setTransactions(seed);
        saveData({ transactions: seed, currency: "EUR" });
      }
      setLoaded(true);
    })();
    return () => { alive = false; };
  }, []);

  function commit(nextTx, nextCur) {
    setTransactions(nextTx);
    const cur = nextCur !== undefined ? nextCur : currency;
    if (nextCur !== undefined) setCurrency(nextCur);
    saveData({ transactions: nextTx, currency: cur });
  }
  function addTx(t) { commit([{ ...t, id: uid() }, ...transactions]); }
  function deleteTx(id) { commit(transactions.filter((t) => t.id !== id)); setDetail(null); }
  function setCur(c) { commit(transactions, c); }
  function resetTo(arr) { commit(arr); }

  /* ---- agrégations ---- */
  const months6 = useMemo(() => {
    const arr = []; let k = curMonthKey();
    for (let i = 0; i < 6; i++) { arr.unshift(k); k = shiftMonth(k, -1); }
    return arr;
  }, []);

  const monthStats = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const k = monthKey(t.date);
      if (!map[k]) map[k] = { income: 0, expense: 0 };
      if (t.type === "income") map[k].income += t.amount;
      else map[k].expense += t.amount;
    });
    return map;
  }, [transactions]);

  const sel = monthStats[selMonth] || { income: 0, expense: 0 };
  const selNet = sel.income - sel.expense;
  const savingsRate = sel.income > 0 ? Math.round((selNet / sel.income) * 100) : 0;

  // évolution du solde cumulé (6 derniers mois)
  const cumData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0; const byMonth = {};
    sorted.forEach((t) => {
      const k = monthKey(t.date);
      running += t.type === "income" ? t.amount : -t.amount;
      byMonth[k] = running;
    });
    // on remplit les mois manquants avec le dernier solde connu
    let last = 0;
    return months6.map((k) => {
      if (byMonth[k] !== undefined) last = byMonth[k];
      else {
        // chercher le dernier solde avant ce mois
        const before = Object.keys(byMonth).filter((m) => m <= k).sort();
        if (before.length) last = byMonth[before[before.length - 1]];
      }
      return { key: k, label: monthShort(k), value: Math.round(last * 100) / 100 };
    });
  }, [transactions, months6]);

  const barData = useMemo(
    () => months6.map((k) => ({
      label: monthShort(k),
      revenus: Math.round((monthStats[k]?.income || 0)),
      depenses: Math.round((monthStats[k]?.expense || 0)),
    })),
    [months6, monthStats]
  );

  // répartition des dépenses du mois sélectionné
  const catBreakdown = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (t.type !== "expense" || monthKey(t.date) !== selMonth) return;
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const arr = Object.keys(map).map((id) => ({
      id, label: getCat(id).label, color: getCat(id).color, value: map[id],
    }));
    arr.sort((a, b) => b.value - a.value);
    const total = arr.reduce((s, c) => s + c.value, 0);
    arr.forEach((c) => (c.pct = total > 0 ? Math.round((c.value / total) * 100) : 0));
    return { arr, total };
  }, [transactions, selMonth]);

  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [transactions]
  );

  const filteredTx = useMemo(() => {
    let arr = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
    if (filter !== "all") arr = arr.filter((t) => t.type === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (t) => (t.description || "").toLowerCase().includes(q) ||
               getCat(t.category).label.toLowerCase().includes(q)
      );
    }
    return arr;
  }, [transactions, filter, query]);

  const animatedNet = useCountUp(selNet);

  /* ----------------------------------------------------------------- */
  const isCur = selMonth === curMonthKey();
  function MonthNav() {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 4 }}>
        <button onClick={() => setSelMonth(shiftMonth(selMonth, -1))} style={navBtn}>
          <ChevronLeft size={18} color={T.brume} />
        </button>
        <div style={{ minWidth: 150, textAlign: "center", fontSize: 14, fontWeight: 600, color: T.texte }}>
          {monthLabel(selMonth)}
        </div>
        <button onClick={() => !isCur && setSelMonth(shiftMonth(selMonth, 1))} style={{ ...navBtn, opacity: isCur ? 0.3 : 1 }}>
          <ChevronRight size={18} color={T.brume} />
        </button>
      </div>
    );
  }

  /* ============================ ÉCRANS ============================= */
  function Dashboard() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <MonthNav />

        {/* Hero solde */}
        <Card style={{
          background: `linear-gradient(160deg, ${T.ardoise2} 0%, ${T.ardoise} 60%)`,
          padding: 22, position: "relative", overflow: "hidden",
        }}>
          <div style={{ color: T.brume, fontSize: 13, fontWeight: 500 }}>Solde du mois</div>
          <div style={{
            fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", marginTop: 4,
            color: selNet >= 0 ? T.texte : T.corail, fontVariantNumeric: "tabular-nums",
          }}>
            {fmtSigned(animatedNet, currency)}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <MiniStat label="Revenus" value={fmt(sel.income, currency)} color={T.menthe} up />
            <MiniStat label="Dépenses" value={fmt(sel.expense, currency)} color={T.corail} />
          </div>

          <div style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 6,
            background: savingsRate >= 0 ? T.mentheSoft : T.corailSoft, color: savingsRate >= 0 ? T.menthe : T.corail,
            padding: "6px 12px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
          }}>
            <Sparkles size={13} />
            Taux d'épargne&nbsp;: {savingsRate}%
          </div>
        </Card>

        {/* Évolution du solde */}
        <Card>
          <div style={cardTitle}>Évolution du solde</div>
          <div style={{ fontSize: 12, color: T.faible, marginBottom: 10 }}>6 derniers mois</div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={cumData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.menthe} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={T.menthe} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fill: T.faible, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip content={<ChartTip currency={currency} />} cursor={{ stroke: T.bordureFort }} />
              <Area type="monotone" dataKey="value" name="Solde" stroke={T.menthe} strokeWidth={2.5} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Répartition dépenses */}
        <Card>
          <div style={cardTitle}>Dépenses par catégorie</div>
          {catBreakdown.total === 0 ? (
            <Empty texte="Aucune dépense ce mois-ci." />
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative", height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catBreakdown.arr} dataKey="value" nameKey="label"
                      innerRadius={58} outerRadius={82} paddingAngle={2} stroke="none">
                      {catBreakdown.arr.map((e) => <Cell key={e.id} fill={e.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTip currency={currency} />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", pointerEvents: "none",
                }}>
                  <div style={{ fontSize: 11, color: T.brume }}>Total</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: T.texte, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(catBreakdown.total, currency)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {catBreakdown.arr.slice(0, 5).map((c) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: c.color }} />
                    <span style={{ flex: 1, fontSize: 13.5, color: T.texte }}>{c.label}</span>
                    <span style={{ fontSize: 12, color: T.brume }}>{c.pct}%</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: T.texte, fontVariantNumeric: "tabular-nums" }}>
                      {fmt(c.value, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Récentes */}
        <Card style={{ padding: "18px 18px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={cardTitle}>Transactions récentes</div>
            <button onClick={() => setTab("transactions")} style={{
              background: "none", border: "none", color: T.menthe, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              Tout voir
            </button>
          </div>
          {recent.length === 0
            ? <Empty texte="Ajoutez votre première transaction." />
            : recent.map((t) => <TxRow key={t.id} t={t} onClick={() => setDetail(t)} />)}
        </Card>
      </div>
    );
  }

  function Transactions() {
    let lastMonth = "";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h1 style={pageTitle}>Transactions</h1>

        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: T.ardoise,
          border: `1px solid ${T.bordure}`, borderRadius: 14, padding: "10px 14px",
        }}>
          <Search size={17} color={T.brume} />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.texte, fontSize: 15 }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {[["all", "Tous"], ["income", "Revenus"], ["expense", "Dépenses"]].map(([k, lab]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              flex: 1, padding: "9px 0", borderRadius: 12, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${filter === k ? T.bordureFort : T.bordure}`,
              background: filter === k ? T.ardoise2 : "transparent",
              color: filter === k ? T.texte : T.brume,
            }}>
              {lab}
            </button>
          ))}
        </div>

        {filteredTx.length === 0 ? (
          <Card><Empty texte="Aucune transaction trouvée." /></Card>
        ) : (
          <Card style={{ padding: "6px 18px" }}>
            {filteredTx.map((t) => {
              const mk = monthKey(t.date);
              const header = mk !== lastMonth ? monthLabel(mk) : null;
              lastMonth = mk;
              return (
                <React.Fragment key={t.id}>
                  {header && (
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: T.faible, textTransform: "uppercase",
                      letterSpacing: "0.04em", padding: "14px 0 4px",
                    }}>
                      {header}
                    </div>
                  )}
                  <TxRow t={t} onClick={() => setDetail(t)} />
                </React.Fragment>
              );
            })}
          </Card>
        )}
      </div>
    );
  }

  function Stats() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={pageTitle}>Statistiques</h1>

        <Card>
          <div style={cardTitle}>Revenus & dépenses</div>
          <div style={{ fontSize: 12, color: T.faible, marginBottom: 12 }}>6 derniers mois</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: T.faible, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<ChartTip currency={currency} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
              <Bar dataKey="revenus" name="Revenus" fill={T.menthe} radius={[5, 5, 0, 0]} maxBarSize={18} />
              <Bar dataKey="depenses" name="Dépenses" fill={T.corail} radius={[5, 5, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 18, marginTop: 8, justifyContent: "center" }}>
            <Legend color={T.menthe} label="Revenus" />
            <Legend color={T.corail} label="Dépenses" />
          </div>
        </Card>

        <Card>
          <MonthNav />
          <div style={{ ...cardTitle, marginTop: 8 }}>Répartition des dépenses</div>
          {catBreakdown.total === 0 ? (
            <Empty texte="Aucune dépense ce mois-ci." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}>
              {catBreakdown.arr.map((c) => (
                <div key={c.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <CatIcon id={c.id} size={16} />
                    <span style={{ flex: 1, fontSize: 14, color: T.texte, fontWeight: 500 }}>{c.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: T.texte, fontVariantNumeric: "tabular-nums" }}>
                      {fmt(c.value, currency)}
                    </span>
                  </div>
                  <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ width: c.pct + "%", height: "100%", background: c.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  }

  function Reglages() {
    const [confirmReset, setConfirmReset] = useState(false);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={pageTitle}>Réglages</h1>

        <Card style={{ padding: "8px 0" }}>
          <div style={{ ...cardTitle, padding: "12px 18px 6px" }}>Devise</div>
          {Object.keys(CURRENCIES).map((code) => (
            <button key={code} onClick={() => setCur(code)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
              borderTop: `1px solid ${T.bordure}`,
            }}>
              <span style={{ color: T.texte, fontSize: 15 }}>{CURRENCIES[code].label}</span>
              {currency === code && <Check size={18} color={T.menthe} />}
            </button>
          ))}
        </Card>

        <Card style={{ padding: "8px 0" }}>
          <div style={{ ...cardTitle, padding: "12px 18px 6px" }}>Données</div>
          <button onClick={() => resetTo(generateSeed())} style={listBtn}>
            <span style={{ color: T.texte, fontSize: 15 }}>Recharger les données d'exemple</span>
            <RotateCcw size={17} color={T.brume} />
          </button>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} style={{ ...listBtn, borderTop: `1px solid ${T.bordure}` }}>
              <span style={{ color: T.corail, fontSize: 15 }}>Tout effacer</span>
              <Trash2 size={17} color={T.corail} />
            </button>
          ) : (
            <div style={{ padding: "14px 18px", borderTop: `1px solid ${T.bordure}` }}>
              <div style={{ color: T.brume, fontSize: 13.5, marginBottom: 10 }}>
                Supprimer toutes vos transactions ? Cette action est définitive.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirmReset(false)} style={{ ...ghostBtn, flex: 1 }}>Annuler</button>
                <button onClick={() => { resetTo([]); setConfirmReset(false); }} style={{
                  flex: 1, padding: "11px 0", borderRadius: 12, border: "none", cursor: "pointer",
                  background: T.corail, color: "#fff", fontWeight: 600, fontSize: 14,
                }}>
                  Effacer
                </button>
              </div>
            </div>
          )}
        </Card>

        <div style={{ textAlign: "center", color: T.faible, fontSize: 12.5, lineHeight: 1.6, padding: "4px 12px" }}>
          Vos données restent privées et stockées sur votre appareil.<br />
          Flux · version 1.0
        </div>
      </div>
    );
  }

  /* ----------------------------------------------------------------- */
  if (!loaded) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: T.brume, fontSize: 14 }}>Chargement…</div>
      </div>
    );
  }

  return (
    <div style={shell}>
      <style>{KEYFRAMES}</style>

      {/* En-tête */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px 10px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.menthe}, ${T.indigo})`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ArrowUpRight size={18} color="#06120F" strokeWidth={2.8} />
          </div>
          <span style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: T.texte }}>Flux</span>
        </div>
        <button onClick={() => setTab("reglages")} style={navBtn}>
          <Settings size={19} color={T.brume} />
        </button>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 24px", WebkitOverflowScrolling: "touch" }}>
        <div key={tab} style={{ animation: "fadeUp 0.35s ease" }}>
          {tab === "dashboard" && <Dashboard />}
          {tab === "transactions" && <Transactions />}
          {tab === "stats" && <Stats />}
          {tab === "reglages" && <Reglages />}
        </div>
      </div>

      {/* Barre d'onglets */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-around",
        padding: "8px 8px 14px", background: "rgba(8,9,13,0.92)",
        borderTop: `1px solid ${T.bordure}`, backdropFilter: "blur(12px)", flexShrink: 0,
      }}>
        <TabBtn icon={LayoutDashboard} label="Accueil" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
        <TabBtn icon={ListIcon} label="Transactions" active={tab === "transactions"} onClick={() => setTab("transactions")} />
        <button onClick={() => setShowAdd(true)} style={{
          width: 56, height: 56, borderRadius: 18, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${T.menthe}, #1FB58C)`, marginTop: -22,
          boxShadow: `0 8px 24px ${T.menthe}55`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Plus size={28} color="#06120F" strokeWidth={2.8} />
        </button>
        <TabBtn icon={BarChart3} label="Stats" active={tab === "stats"} onClick={() => setTab("stats")} />
        <TabBtn icon={Settings} label="Réglages" active={tab === "reglages"} onClick={() => setTab("reglages")} />
      </div>

      {showAdd && <AddSheet currency={currency} onClose={() => setShowAdd(false)} onAdd={addTx} />}
      {detail && <DetailSheet t={detail} currency={currency} onClose={() => setDetail(null)} onDelete={deleteTx} />}
    </div>
  );

  /* ---- sous-composants dépendant du contexte ---- */
  function MiniStat({ label, value, color, up }) {
    return (
      <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: T.brume, fontSize: 12 }}>
          {up ? <ArrowUpRight size={13} color={color} /> : <ArrowDownRight size={13} color={color} />}
          {label}
        </div>
        <div style={{ fontSize: 17, fontWeight: 700, color: T.texte, marginTop: 3, fontVariantNumeric: "tabular-nums" }}>
          {value}
        </div>
      </div>
    );
  }
  function TxRow({ t, onClick }) {
    const cat = getCat(t.category);
    const isInc = t.type === "income";
    return (
      <button onClick={onClick} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 0",
        background: "none", border: "none", borderBottom: `1px solid ${T.bordure}`, cursor: "pointer", textAlign: "left",
      }}>
        <CatIcon id={t.category} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: T.texte, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {t.description || cat.label}
          </div>
          <div style={{ fontSize: 12, color: T.brume }}>{cat.label}</div>
        </div>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: isInc ? T.menthe : T.texte, fontVariantNumeric: "tabular-nums" }}>
          {isInc ? "+" : "−"}{fmt(t.amount, currency)}
        </div>
      </button>
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Feuille « Ajouter »                                                */
/* ------------------------------------------------------------------ */
function AddSheet({ onClose, onAdd, currency }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [cat, setCat] = useState(null);
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const cats = type === "expense" ? EXPENSE_CATS : INCOME_CATS;
  const valid = parseAmount(amount) > 0 && cat;

  function submit() {
    if (!valid) return;
    onAdd({ type, amount: parseAmount(amount), category: cat, description: desc.trim(), date });
    onClose();
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={sheetHandle} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.texte }}>Nouvelle transaction</div>
          <button onClick={onClose} style={navBtn}><X size={20} color={T.brume} /></button>
        </div>

        {/* Type */}
        <div style={{ display: "flex", gap: 8, background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 4, marginBottom: 18 }}>
          {[["expense", "Dépense", T.corail], ["income", "Revenu", T.menthe]].map(([k, lab, col]) => (
            <button key={k} onClick={() => { setType(k); setCat(null); }} style={{
              flex: 1, padding: "10px 0", borderRadius: 11, border: "none", cursor: "pointer",
              fontSize: 14.5, fontWeight: 600,
              background: type === k ? col : "transparent",
              color: type === k ? "#06120F" : T.brume,
            }}>
              {lab}
            </button>
          ))}
        </div>

        {/* Montant */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
              inputMode="decimal" placeholder="0"
              style={{
                width: "auto", maxWidth: 220, background: "none", border: "none", outline: "none",
                textAlign: "center", fontSize: 46, fontWeight: 800, color: T.texte,
                fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
              }}
            />
            <span style={{ fontSize: 30, fontWeight: 700, color: T.brume }}>
              {(CURRENCIES[currency] || CURRENCIES.EUR).symbole}
            </span>
          </div>
        </div>

        {/* Catégories */}
        <div style={{ fontSize: 12.5, color: T.brume, marginBottom: 10, fontWeight: 600 }}>Catégorie</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
          {cats.map((c) => {
            const Ico = ICONS[c.icon] || MoreHorizontal;
            const on = cat === c.id;
            return (
              <button key={c.id} onClick={() => setCat(c.id)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 4px",
                borderRadius: 14, cursor: "pointer", background: on ? c.color + "26" : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${on ? c.color : "transparent"}`,
              }}>
                <Ico size={20} color={c.color} strokeWidth={2.2} />
                <span style={{ fontSize: 10.5, color: on ? T.texte : T.brume, textAlign: "center", lineHeight: 1.1 }}>
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Description & date */}
        <input
          value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (facultatif)"
          style={inputStyle}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 10, ...inputStyle, marginTop: 10 }}>
          <Calendar size={17} color={T.brume} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{
            flex: 1, background: "none", border: "none", outline: "none", color: T.texte, fontSize: 15, colorScheme: "dark",
          }} />
        </div>

        <button onClick={submit} disabled={!valid} style={{
          width: "100%", marginTop: 18, padding: "15px 0", borderRadius: 16, border: "none",
          fontSize: 16, fontWeight: 700, cursor: valid ? "pointer" : "not-allowed",
          background: valid ? `linear-gradient(135deg, ${T.menthe}, #1FB58C)` : "rgba(255,255,255,0.06)",
          color: valid ? "#06120F" : T.faible,
        }}>
          Ajouter
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feuille « Détail »                                                 */
/* ------------------------------------------------------------------ */
function DetailSheet({ t, currency, onClose, onDelete }) {
  const cat = getCat(t.category);
  const isInc = t.type === "income";
  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={sheetHandle} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "8px 0 18px" }}>
          <CatIcon id={t.category} size={26} />
          <div style={{ fontSize: 30, fontWeight: 800, color: isInc ? T.menthe : T.texte, fontVariantNumeric: "tabular-nums" }}>
            {isInc ? "+" : "−"}{fmt(t.amount, currency)}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.texte }}>{t.description || cat.label}</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
          <DetailRow label="Catégorie" value={cat.label} />
          <DetailRow label="Type" value={isInc ? "Revenu" : "Dépense"} />
          <DetailRow label="Date" value={cap(fmtDate(t.date))} last />
        </div>

        <button onClick={() => onDelete(t.id)} style={{
          width: "100%", padding: "14px 0", borderRadius: 16, border: `1px solid ${T.corail}44`,
          background: T.corailSoft, color: T.corail, fontSize: 15, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <Trash2 size={17} /> Supprimer
        </button>
      </div>
    </div>
  );
}
function DetailRow({ label, value, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", padding: "13px 16px",
      borderBottom: last ? "none" : `1px solid ${T.bordure}`,
    }}>
      <span style={{ color: T.brume, fontSize: 14 }}>{label}</span>
      <span style={{ color: T.texte, fontSize: 14, fontWeight: 600 }}>{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Briques UI génériques                                              */
/* ------------------------------------------------------------------ */
function TabBtn({ icon: Ico, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3, width: 64,
      background: "none", border: "none", cursor: "pointer", padding: "4px 0",
    }}>
      <Ico size={22} color={active ? T.menthe : T.faible} strokeWidth={active ? 2.4 : 2} />
      <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500, color: active ? T.menthe : T.faible }}>{label}</span>
    </button>
  );
}
function Legend({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 12.5, color: T.brume }}>{label}</span>
    </div>
  );
}
function Empty({ texte }) {
  return (
    <div style={{ textAlign: "center", padding: "26px 10px", color: T.faible, fontSize: 13.5 }}>
      {texte}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles partagés                                                    */
/* ------------------------------------------------------------------ */
const shell = {
  display: "flex", flexDirection: "column", height: "100vh", maxWidth: 480, margin: "0 auto",
  background: T.encre, color: T.texte, position: "relative",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif",
};
const cardTitle = { fontSize: 15, fontWeight: 700, color: T.texte };
const pageTitle = { fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", color: T.texte, margin: "8px 2px 4px" };
const navBtn = {
  width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
};
const listBtn = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "14px 18px", background: "none", border: "none", cursor: "pointer",
};
const ghostBtn = {
  padding: "11px 0", borderRadius: 12, border: `1px solid ${T.bordure}`, background: "transparent",
  color: T.texte, fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(3px)",
  display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50, animation: "fade 0.2s ease",
};
const sheet = {
  width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto", background: T.encre2,
  borderTopLeftRadius: 26, borderTopRightRadius: 26, border: `1px solid ${T.bordure}`,
  padding: "12px 20px 28px", animation: "slideUp 0.32s cubic-bezier(0.22,1,0.36,1)",
};
const sheetHandle = {
  width: 40, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.18)", margin: "0 auto 14px",
};
const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.04)",
  border: `1px solid ${T.bordure}`, borderRadius: 14, padding: "13px 15px",
  color: T.texte, fontSize: 15, outline: "none",
};
const KEYFRAMES = `
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
input::placeholder { color: ${T.faible}; }
::-webkit-scrollbar { width: 0; height: 0; }
`;
