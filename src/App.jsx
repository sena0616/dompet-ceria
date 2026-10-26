import { useEffect, useMemo, useState } from "react";
import {
  House, ArrowLeftRight, ChartNoAxesColumn, Target,
  Settings, Plus, Wallet, TrendingUp, TrendingDown, Sparkles,
  Cat, Trash2, Pencil, X, Search, CheckCircle2,
  Clock, Trophy, PiggyBank, ShieldCheck, Coins, CalendarDays,
  AlertTriangle, Heart, ChevronRight
} from "lucide-react";
import Bibble from "./Bibble";
import "./App.css";

const money = (value) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0
}).format(Number(value) || 0);
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today = () => ymd(new Date());
const initialTransactions = [];
const expenseCategories = ["Makanan & Minuman", "Belanja Online", "Transportasi", "Tagihan", "Hiburan", "Pendidikan", "Kesehatan", "Pembelian Impulsif", "Lainnya"];
const incomeCategories = ["Uang Saku", "Gaji", "Bonus", "Usaha", "Investasi", "Lainnya"];
const read = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};

function App() {
  const [transactions, setTransactions] = useState(() => read("dc-transactions", initialTransactions));
  const [startingBalance, setStartingBalance] = useState(() => read("dc-starting-balance", 0));
  const [budget, setBudget] = useState(() => read("dc-budget", 50000));
  const [goal, setGoal] = useState(() => read("dc-goal", 500000));
  const [saved, setSaved] = useState(() => read("dc-saved", 0));
  const [wishes, setWishes] = useState(() => read("dc-wishes", []));
  const [xp, setXp] = useState(() => read("dc-xp", 0));
  const [active, setActive] = useState("Dashboard");
  const [period, setPeriod] = useState("Harian");
  const [showTransaction, setShowTransaction] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [showWish, setShowWish] = useState(false);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [transactionForm, setTransactionForm] = useState({ name: "", amount: "", type: "expense", category: expenseCategories[0], date: today() });
  const [reminderForm, setReminderForm] = useState({ name: "", amount: "", category: "Belanja Online" });
  const [wishForm, setWishForm] = useState({ name: "", amount: "" });
  const [deposit, setDeposit] = useState("");

  useEffect(() => localStorage.setItem("dc-transactions", JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem("dc-starting-balance", JSON.stringify(startingBalance)), [startingBalance]);
  useEffect(() => localStorage.setItem("dc-budget", JSON.stringify(budget)), [budget]);
  useEffect(() => localStorage.setItem("dc-goal", JSON.stringify(goal)), [goal]);
  useEffect(() => localStorage.setItem("dc-saved", JSON.stringify(saved)), [saved]);
  useEffect(() => localStorage.setItem("dc-wishes", JSON.stringify(wishes)), [wishes]);
  useEffect(() => localStorage.setItem("dc-xp", JSON.stringify(xp)), [xp]);

  const income = transactions.filter(t => t.type === "income").reduce((s,t) => s + Number(t.amount), 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s,t) => s + Number(t.amount), 0);
  const balance = Number(startingBalance) + income - expenses;
  const spentToday = transactions.filter(t => t.type === "expense" && t.date === today()).reduce((s,t) => s + Number(t.amount), 0);
  const remaining = Number(budget) - spentToday;
  const budgetPercent = Number(budget) > 0 ? Math.min(100, spentToday / Number(budget) * 100) : 0;
  const level = Math.floor(xp / 100) + 1;

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = ymd(now);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const weekStartStr = ymd(weekStart);
    const monthPrefix = todayStr.slice(0, 7);
    return transactions.filter(t => {
      const inPeriod = period === "Harian" ? t.date === todayStr
        : period === "Mingguan" ? t.date >= weekStartStr && t.date <= todayStr
        : t.date.startsWith(monthPrefix);
      return inPeriod && `${t.name} ${t.category}`.toLowerCase().includes(query.toLowerCase());
    }).sort((a,b) => b.date.localeCompare(a.date) || b.id-a.id);
  }, [transactions, period, query]);

  const leakage = transactions.filter(t => t.type === "expense").reduce((acc,t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc;
  }, {});
  const topLeakage = Object.entries(leakage).sort((a,b) => b[1]-a[1]).slice(0,4);
  const periodLeakage = Object.entries(filteredTransactions.filter(t => t.type === "expense").reduce((acc,t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc;
  }, {})).sort((a,b) => b[1]-a[1]).slice(0,4);
  const quests = [
    { title: "Catat transaksi hari ini", detail: "Jujur pada setiap pengeluaran", done: transactions.some(t => t.date === today()), reward: "+10 XP" },
    { title: "Jaga anggaran harian", detail: "Belanja sesuai rencana", done: transactions.some(t => t.date === today()) && spentToday <= Number(budget), reward: "+20 XP" },
    { title: "Mulai menabung", detail: "Sisihkan uang untuk tujuanmu", done: saved > 0, reward: "+20 XP" }
  ];

  const openNewTransaction = () => {
    setEditing(null);
    setTransactionForm({ name: "", amount: "", type: "expense", category: expenseCategories[0], date: today() });
    setShowTransaction(true);
  };
  const changeType = (type) => setTransactionForm(f => ({ ...f, type, category: type === "income" ? incomeCategories[0] : expenseCategories[0] }));

  function saveTransaction(e) {
    e.preventDefault();
    const amount = Number(transactionForm.amount);
    if (!transactionForm.name.trim() || !Number.isFinite(amount) || amount <= 0 || !transactionForm.date) {
      setNotice("Isi nama, tanggal, dan jumlah yang valid dulu, ya."); return;
    }
    if (editing) {
      setTransactions(list => list.map(t => t.id === editing ? { ...transactionForm, amount, id: editing } : t));
      setNotice("Transaksi berhasil diperbarui ✨");
    } else {
      setTransactions(list => [{ ...transactionForm, amount, id: Date.now() }, ...list]);
      setXp(x => x + 10);
      setNotice("Transaksi tersimpan! Kamu mendapat 10 XP ⭐");
    }
    setShowTransaction(false);
  }
  function editTransaction(t) {
    setEditing(t.id);
    setTransactionForm({ name: t.name, amount: String(t.amount), type: t.type, category: t.category, date: t.date });
    setShowTransaction(true);
  }
  function deleteTransaction(id) {
    if (window.confirm("Hapus transaksi ini?")) {
      setTransactions(list => list.filter(t => t.id !== id));
      setNotice("Transaksi dihapus.");
    }
  }
  function saveWish(e) {
    e.preventDefault();
    if (!wishForm.name.trim() || Number(wishForm.amount) <= 0) return;
    setWishes(list => [{ id: Date.now(), name: wishForm.name.trim(), amount: Number(wishForm.amount), created: today(), ready: false }, ...list]);
    setWishForm({ name: "", amount: "" });
    setShowWish(false);
    setNotice("Wishlist disimpan. Beri waktu 24 jam sebelum memutuskan! 💭");
  }
  function checkPurchase(e) {
    e.preventDefault();
    const amount = Number(reminderForm.amount);
    if (!reminderForm.name.trim() || amount <= 0) return;
    const affordable = amount <= Math.max(0, remaining);
    setWishes(list => [{ id: Date.now(), name: reminderForm.name.trim(), amount, category: reminderForm.category, created: today(), ready: false }, ...list]);
    setNotice(affordable
      ? `🟡 Anggaran masih cukup. Simpan dulu ke wishlist dan pertimbangkan lagi besok.`
      : `🔴 Harga melebihi sisa anggaran ${money(Math.max(0,remaining))}. Sebaiknya tunda dulu.`);
    setReminderForm({ name: "", amount: "", category: "Belanja Online" });
    setShowReminder(false);
  }
  function removeWish(id) {
    setWishes(list => list.filter(w => w.id !== id));
    setNotice("Barang dihapus dari wishlist.");
  }
  function addSavings(e) {
    e.preventDefault();
    const amount = Number(deposit);
    if (!amount || amount <= 0) return;
    if (amount > Math.max(0, balance - saved)) {
      setNotice("Setoran melebihi saldo tersedia yang tercatat. Periksa saldo dan transaksi dulu."); return;
    }
    setSaved(n => n + amount);
    setXp(n => n + 20);
    setDeposit("");
    setNotice("Tabungan bertambah! Kamu mendapat 20 XP 💰");
  }
  function clearTransactions() {
    if (window.confirm("Kosongkan semua riwayat transaksi?")) {
      setTransactions([]);
      setNotice("Semua riwayat transaksi berhasil dikosongkan.");
    }
  }
  function resetAll() {
    if (window.confirm("Reset semua data? Transaksi, tabungan, wishlist, dan XP akan dihapus dan tidak bisa dikembalikan.")) {
      setTransactions(initialTransactions); setStartingBalance(0); setBudget(50000); setGoal(500000); setSaved(0); setWishes([]); setXp(0);
      setNotice("Semua data berhasil direset.");
    }
  }

  return <div className="app-layout">
    <aside className="sidebar">
      <div className="logo-row"><div className="logo-cat"><Cat size={27}/></div><div><div className="logo-name">dompet ceria<span>✦</span></div><div className="logo-caption">TEMAN UANGMU</div></div></div>
      <div className="mini-profile"><div className="avatar">🐱</div><div className="profile-text"><b>Petualang Hemat</b><span><Sparkles size={13}/> Level {level} · {xp} XP</span></div><div className="level-star">★</div></div>
      <div className="nav-label">MENU UTAMA</div>
      <nav className="nav-list">
        {[
          ["Dashboard", House], ["Transaksi", ArrowLeftRight], ["Laporan", ChartNoAxesColumn],
          ["Rem Belanja", ShieldCheck], ["Daftar Keinginan", Heart], ["Target Tabungan", Target]
        ].map(([label,Icon]) => <button key={label} className={`nav-item ${active===label?"active":""}`} onClick={() => setActive(label)}><Icon size={18}/><span>{label}</span>{label==="Rem Belanja" && <span className="nav-dot"/>}</button>)}
      <button className={`nav-item nav-mobile-only ${active==="Pengaturan"?"active":""}`} onClick={() => setActive("Pengaturan")}><Settings size={18}/><span>Pengaturan</span></button></nav>
      <div className="sidebar-bottom"><div className="mascot-card"><div className="mascot-spark">✦</div><b>Pelan-pelan asal konsisten!</b><p>Setiap keputusan kecil bisa bikin tabunganmu tumbuh.</p><div className="mascot-stars">✦ ✧ ✦</div></div><button className="nav-item settings" onClick={() => setActive("Pengaturan")}><Settings size={18}/>Pengaturan</button><div className="sidebar-footer">Made with ♡ for your future</div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div><div className="breadcrumb">Ruang keuanganmu <ChevronRight size={14}/> <b>{active}</b></div><h1>{active === "Dashboard" ? "Hai, Pejuang Hemat!" : active}</h1><p className="subheading">{active === "Dashboard" ? "Yuk, cek kondisi dompetmu hari ini." : "Langkah kecil hari ini, bikin tujuanmu makin dekat."}</p></div><div className="top-actions"><div className="date-chip"><CalendarDays size={16}/>{new Date().toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</div><button className="primary-btn" onClick={openNewTransaction}><Plus size={18}/> Catat Transaksi</button></div></header>
      {notice && <div className="notice"><Sparkles size={17}/><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Tutup pesan"><X size={16}/></button></div>}

      {active === "Dashboard" && <>
        <Bibble balance={balance} />
<section className="hero-grid">
          <div className="balance-card"><div className="balance-top"><div><div className="eyebrow">TOTAL SALDO TERCATAT <span className="tiny-spark">✦</span></div><div className="balance-number" key={balance}>{money(balance)}</div><div className="balance-note"><span className="balance-status">●</span> Tetap semangat mengatur uang!</div></div><div className="wallet-illustration"><div className="wallet-shape"><div className="wallet-button">♡</div><div className="wallet-coin">Rp</div></div><span className="float-star star-a">✦</span><span className="float-star star-b">✧</span><span className="float-star star-c">✦</span></div></div><div className="balance-divider"/><div className="balance-bottom"><div><span className="small-icon green"><TrendingUp size={16}/></span><span>Total pemasukan</span><b>{money(income)}</b></div><div><span className="small-icon coral"><TrendingDown size={16}/></span><span>Total pengeluaran</span><b>{money(expenses)}</b></div></div></div>
          <div className="budget-card"><div className="section-heading"><div><div className="eyebrow dark">ANGGARAN HARIAN</div><h3>Jatah hari ini <span>☀️</span></h3></div><div className="budget-icon"><Wallet size={21}/></div></div><div className="budget-amount">{money(Math.max(0,remaining))}<span> tersisa</span></div><div className="budget-caption">dari {money(budget)} anggaran harian</div><div className="progress-track"><div className={`progress-fill ${budgetPercent>=100?"over":budgetPercent>=75?"warn":""}`} style={{width:`${budgetPercent}%`}}/></div><div className="progress-meta"><span>{money(spentToday)} terpakai</span><b>{Math.round(budgetPercent)}%</b></div>{budgetPercent>=100?<div className="budget-tip danger"><AlertTriangle size={15}/> Anggaran harianmu sudah habis. Yuk, tahan belanja dulu!</div>:budgetPercent>=75?<div className="budget-tip warning"><AlertTriangle size={15}/> Hati-hati, anggaranmu mulai menipis.</div>:<div className="budget-tip"><Sparkles size={15}/> Kamu masih punya ruang untuk hari ini!</div>}</div>
        </section>

        <section className="stat-grid"><div className="stat-card"><div className="stat-icon lilac"><Coins size={20}/></div><div className="stat-label">Total tabungan</div><div className="stat-value">{money(saved)}</div><div className="stat-foot"><span className="foot-dot purple"/>Sedikit demi sedikit</div></div><div className="stat-card"><div className="stat-icon mint"><Target size={20}/></div><div className="stat-label">Target tabungan</div><div className="stat-value">{money(goal)}</div><div className="stat-foot"><span className="foot-dot green"/> {goal>0?Math.min(100,Math.round(saved/goal*100)):0}% tercapai</div></div><div className="stat-card"><div className="stat-icon peach"><Sparkles size={20}/></div><div className="stat-label">Poin pengalaman</div><div className="stat-value">{xp} <small>XP</small></div><div className="stat-foot"><span className="foot-dot orange"/>Level {level} · Penjelajah Dompet</div></div></section>

        <section className="content-grid"><div className="panel transactions-panel"><div className="panel-heading"><div><h2>Transaksi terbaru <span className="heading-emoji">🧾</span></h2><p>Setiap catatan bikin kamu makin sadar.</p></div><button className="text-btn" onClick={() => setActive("Transaksi")}>Lihat semua <ChevronRight size={15}/></button></div><TransactionList items={[...transactions].sort((a,b)=>b.id-a.id).slice(0,5)} onEdit={editTransaction} onDelete={deleteTransaction}/></div>
          <div className="panel quest-panel"><div className="panel-heading"><div><h2>Quest harian <span className="heading-emoji">🎯</span></h2><p>Misi kecil untuk dompet yang sehat.</p></div><div className="quest-badge"><Trophy size={17}/></div></div><div className="quest-list">{quests.map((q,i)=><div className={`quest-item ${q.done?"done":""}`} key={q.title}><div className="quest-check">{q.done?<CheckCircle2 size={19}/>:<span>{i+1}</span>}</div><div className="quest-copy"><b>{q.title}</b><small>{q.detail}</small></div><span className="quest-xp">{q.done?"Selesai":q.reward}</span></div>)}</div><div className="level-progress"><div className="level-row"><span>Progress level {level}</span><b>{xp%100}/100 XP</b></div><div className="progress-track"><div className="level-fill" style={{width:`${xp%100}%`}}/></div><small>Terus catat aktivitasmu untuk mengumpulkan XP!</small></div></div></section>

        <section className="content-grid lower-grid"><div className="panel leakage-panel"><div className="panel-heading"><div><h2>Detektif kebocoran uang <span className="heading-emoji">🕵️</span></h2><p>Kategori pengeluaran yang paling banyak menyerap uangmu.</p></div><div className="leak-icon"><Search size={18}/></div></div>{topLeakage.length===0?<Empty text="Belum ada pengeluaran untuk dianalisis."/>:<div className="leak-list">{topLeakage.map(([cat,amount],i)=><div className="leak-row" key={cat}><div className={`leak-emoji leak-${i}`}>{cat.includes("Makanan")?"🍜":cat.includes("Online")?"📦":cat.includes("Impulsif")?"🛍️":"💸"}</div><div className="leak-detail"><b>{cat}</b><div className="leak-bar"><span style={{width:`${expenses?amount/Math.max(...topLeakage.map(x=>x[1]))*100:0}%`}}/></div></div><strong>{money(amount)}</strong></div>)}</div>}</div>
          <div className="savings-banner"><div className="banner-decoration">✦</div><div className="banner-copy"><span className="banner-label">KAMU PASTI BISA!</span><h2>Impian besar<br/>dimulai dari receh.</h2><p>Setiap rupiah yang kamu simpan adalah langkah menuju tujuanmu.</p><button onClick={() => setActive("Target Tabungan")}>Lihat targetku <ChevronRight size={16}/></button></div><div className="piggy">🐷<span>✦</span></div></div></section>
      </>}

      {active === "Transaksi" && <section className="panel page-panel"><div className="panel-heading"><div><h2>Riwayat transaksi 🧾</h2><p>Catat dengan jujur, tanpa menghakimi diri sendiri.</p></div><button className="primary-btn" onClick={openNewTransaction}><Plus size={17}/> Tambah</button></div><div className="filter-row"><div className="period-tabs">{["Harian","Mingguan","Bulanan"].map(p=><button key={p} className={period===p?"selected":""} onClick={()=>setPeriod(p)}>{p}</button>)}</div><label className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari transaksi..."/></label></div><TransactionList items={filteredTransactions} onEdit={editTransaction} onDelete={deleteTransaction}/><div className="table-total"><span>{filteredTransactions.length} transaksi ditemukan</span><b>Pengeluaran periode: {money(filteredTransactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0))}</b></div></section>}

      {active === "Laporan" && <section className="panel page-panel"><div className="panel-heading"><div><h2>Laporan keuangan 📊</h2><p>Lihat pola uangmu agar bisa membuat keputusan lebih baik.</p></div></div><div className="period-tabs report-tabs">{["Harian","Mingguan","Bulanan"].map(p=><button key={p} className={period===p?"selected":""} onClick={()=>setPeriod(p)}>{p}</button>)}</div><div className="report-summary"><div><span>Pemasukan</span><b className="green-text">{money(filteredTransactions.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0))}</b></div><div><span>Pengeluaran</span><b className="red-text">{money(filteredTransactions.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0))}</b></div><div><span>Jumlah transaksi</span><b>{filteredTransactions.length}</b></div></div><h3 className="subsection-title">Pengeluaran per kategori</h3>{periodLeakage.length===0?<Empty text="Belum ada data pengeluaran."/>:<div className="report-categories">{periodLeakage.map(([cat,amount],i)=><div className="report-cat" key={cat}><div className="report-cat-head"><span>{cat}</span><b>{money(amount)}</b></div><div className="progress-track"><div className={`report-fill fill-${i}`} style={{width:`${amount/Math.max(...periodLeakage.map(x=>x[1]))*100}%`}}/></div></div>)}</div>}</section>}

      {active === "Rem Belanja" && <section className="panel page-panel reminder-page"><div className="reminder-hero"><div className="reminder-art">🛍️<span>⏰</span></div><div><div className="eyebrow dark">PAUSE BEFORE YOU PAY</div><h2>Rem belanja dulu, yuk!</h2><p>Sebelum checkout, cek apakah barang ini sesuai anggaran. Kamu tidak harus langsung memutuskan sekarang.</p><button className="primary-btn" onClick={()=>setShowReminder(true)}><ShieldCheck size={17}/> Periksa rencana belanja</button></div></div><div className="reminder-rules"><div><span>01</span><b>Berhenti sebentar</b><p>Tarik napas dan tanya diri sendiri: aku butuh atau cuma ingin?</p></div><div><span>02</span><b>Cek anggaran</b><p>Pastikan kebutuhan utama dan anggaran harian tidak terganggu.</p></div><div><span>03</span><b>Tunggu 24 jam</b><p>Masukkan ke wishlist dan tinjau lagi besok sebelum memutuskan.</p></div></div><h3 className="subsection-title">Sisa anggaran hari ini: <span className={remaining<0?"red-text":"green-text"}>{money(Math.max(0,remaining))}</span></h3><p className="muted">Pengingat ini membantu mempertimbangkan belanja, bukan pengganti keputusanmu.</p></section>}

      {active === "Daftar Keinginan" && <section className="panel page-panel"><div className="panel-heading"><div><h2>Daftar keinginan 💗</h2><p>Keinginan boleh ada; keputusan tidak harus sekarang.</p></div><button className="primary-btn" onClick={()=>setShowWish(true)}><Plus size={17}/> Tambah keinginan</button></div>{wishes.length===0?<Empty text="Belum ada keinginan. Simpan barang yang ingin kamu beli di sini."/>:<div className="wish-grid">{wishes.map(w=><div className="wish-card" key={w.id}><div className="wish-picture">🎁</div><div className="wish-info"><b>{w.name}</b><strong>{money(w.amount)}</strong><small><Clock size={13}/> Ditambahkan {w.created}</small><div className="wish-actions"><button onClick={()=>setNotice("Beri jeda 24 jam, cek anggaran, lalu putuskan dengan tenang.")}><Clock size={14}/> Pertimbangkan lagi</button><button className="icon-btn" onClick={()=>removeWish(w.id)} aria-label="Hapus keinginan"><Trash2 size={15}/></button></div></div></div>)}</div>}</section>}

      {active === "Target Tabungan" && <section className="panel page-panel savings-page"><div className="savings-hero"><div className="savings-hero-art">🐷<span>🪙</span></div><div><div className="eyebrow dark">SMALL STEPS, BIG DREAMS</div><h2>Tabungan impianmu</h2><p>Tetapkan tujuan yang realistis dan isi sedikit demi sedikit.</p></div></div><div className="goal-progress-card"><div className="goal-top"><div><span>Total terkumpul</span><h2>{money(saved)}</h2></div><div className="goal-percent">{goal>0?Math.min(100,Math.round(saved/goal*100)):0}%</div></div><div className="progress-track big"><div className="goal-fill" style={{width:`${goal>0?Math.min(100,saved/goal*100):0}%`}}/></div><div className="goal-meta"><span>Mulai dari langkah kecil 🌱</span><b>Target {money(goal)}</b></div></div><div className="savings-forms"><form className="mini-form" onSubmit={addSavings}><h3><PiggyBank size={19}/> Tambah tabungan</h3><label>Jumlah setoran (Rp)<input type="number" min="1" value={deposit} onChange={e=>setDeposit(e.target.value)} placeholder="Contoh: 10000" required/></label><button className="primary-btn" type="submit">Simpan setoran</button><small>Setoran dicatat terpisah dari transaksi. Catat juga pengeluaran nyata agar saldo tetap akurat.</small></form><form className="mini-form" onSubmit={e=>{e.preventDefault();setGoal(Math.max(0,Number(e.currentTarget.goal.value)));setNotice("Target tabungan diperbarui!");}}><h3><Target size={19}/> Ubah target</h3><label>Target tabungan (Rp)<input name="goal" type="number" min="0" defaultValue={goal} required/></label><button className="secondary-btn" type="submit">Perbarui target</button></form></div></section>}

      {active === "Pengaturan" && <section className="panel page-panel"><div className="panel-heading"><div><h2>Pengaturan ⚙️</h2><p>Sesuaikan rencana keuangan dengan kebutuhanmu.</p></div></div><div className="settings-grid">
        <form className="mini-form" onSubmit={e => {
          e.preventDefault();
          const value = Number(e.currentTarget.startingBalance.value);
          if (!Number.isFinite(value) || value < 0) {
            setNotice("Saldo awal tidak boleh negatif.");
            return;
          }
          setStartingBalance(value);
          setNotice("Saldo awal berhasil diperbarui! ✨");
        }}>
          <h3><Wallet size={19}/> Atur saldo awal</h3>
          <p>Masukkan jumlah uang yang kamu miliki sebelum transaksi tercatat.</p>
          <label>Saldo awal (Rp)
            <input name="startingBalance" type="number" min="0" step="1" defaultValue={startingBalance} required/>
          </label>
          <button className="primary-btn" type="submit">Simpan saldo awal</button>
          <small>Saldo saat ini = saldo awal + pemasukan - pengeluaran.</small>
        </form><form className="mini-form" onSubmit={e=>{e.preventDefault();setBudget(Math.max(0,Number(e.currentTarget.budget.value)));setNotice("Anggaran harian diperbarui.");}}><h3><Wallet size={19}/> Anggaran harian</h3><label>Anggaran maksimal (Rp)<input name="budget" type="number" min="0" defaultValue={budget} required/></label><button className="primary-btn" type="submit">Simpan anggaran</button></form><div className="mini-form"><h3><Heart size={19}/> Data aplikasi</h3><p>Data tersimpan di browser yang sedang kamu gunakan melalui localStorage. Data tidak otomatis tersinkron ke perangkat lain.</p><button className="secondary-btn" onClick={clearTransactions}>Kosongkan riwayat transaksi</button>
<button className="secondary-btn" onClick={resetAll}>Reset semua data</button></div></div></section>}
      <footer className="app-footer"><span>🐾</span> Dompet Ceria · Teman kecil untuk keputusan keuangan yang lebih sadar <span>♡</span></footer>
    </main>

    {showTransaction && <Modal title={editing?"Edit transaksi":"Catat transaksi baru"} onClose={()=>setShowTransaction(false)}><form className="modal-form" onSubmit={saveTransaction}><div className="type-switch"><button type="button" className={transactionForm.type==="expense"?"expense-active":""} onClick={()=>changeType("expense")}><TrendingDown size={16}/> Pengeluaran</button><button type="button" className={transactionForm.type==="income"?"income-active":""} onClick={()=>changeType("income")}><TrendingUp size={16}/> Pemasukan</button></div><label>Nama transaksi<input autoFocus value={transactionForm.name} onChange={e=>setTransactionForm(f=>({...f,name:e.target.value}))} placeholder="Contoh: makan siang" required/></label><label>Jumlah (Rp)<input type="number" min="1" value={transactionForm.amount} onChange={e=>setTransactionForm(f=>({...f,amount:e.target.value}))} placeholder="Contoh: 15000" required/></label><label>Kategori<select value={transactionForm.category} onChange={e=>setTransactionForm(f=>({...f,category:e.target.value}))}>{(transactionForm.type==="income"?incomeCategories:expenseCategories).map(c=><option key={c}>{c}</option>)}</select></label><label>Tanggal<input type="date" value={transactionForm.date} onChange={e=>setTransactionForm(f=>({...f,date:e.target.value}))} required/></label><button className="primary-btn full-btn" type="submit">{editing?"Simpan perubahan":"Simpan transaksi"}</button></form></Modal>}
    {showReminder && <Modal title="Cek sebelum checkout 🛒" onClose={()=>setShowReminder(false)}><form className="modal-form" onSubmit={checkPurchase}><p className="modal-intro">Jeda sebentar. Kita cek dulu apakah belanja ini sesuai rencana.</p><label>Barang yang ingin dibeli<input autoFocus value={reminderForm.name} onChange={e=>setReminderForm(f=>({...f,name:e.target.value}))} placeholder="Contoh: tumbler lucu" required/></label><label>Harga (Rp)<input type="number" min="1" value={reminderForm.amount} onChange={e=>setReminderForm(f=>({...f,amount:e.target.value}))} placeholder="Contoh: 45000" required/></label><label>Kategori<select value={reminderForm.category} onChange={e=>setReminderForm(f=>({...f,category:e.target.value}))}>{expenseCategories.map(c=><option key={c}>{c}</option>)}</select></label><div className="modal-budget">Anggaran tersisa hari ini <b>{money(Math.max(0,remaining))}</b></div><button className="primary-btn full-btn" type="submit">Periksa & simpan keinginan</button></form></Modal>}
    {showWish && <Modal title="Tambah daftar keinginan 💗" onClose={()=>setShowWish(false)}><form className="modal-form" onSubmit={saveWish}><p className="modal-intro">Simpan dulu, beri jeda 24 jam sebelum memutuskan membeli.</p><label>Nama barang<input autoFocus value={wishForm.name} onChange={e=>setWishForm(f=>({...f,name:e.target.value}))} placeholder="Apa yang kamu inginkan?" required/></label><label>Perkiraan harga (Rp)<input type="number" min="1" value={wishForm.amount} onChange={e=>setWishForm(f=>({...f,amount:e.target.value}))} placeholder="Contoh: 75000" required/></label><button className="primary-btn full-btn" type="submit">Simpan ke wishlist</button></form></Modal>}
  </div>;
}

function TransactionList({ items, onEdit, onDelete }) {
  if (!items.length) return <Empty text="Belum ada transaksi pada periode ini. Tambahkan catatan pertamamu, yuk!"/>;
  return <div className="transaction-list">{items.map(t=><div className="transaction-row" key={t.id}><div className={`transaction-icon ${t.type==="income"?"income-bg":"expense-bg"}`}>{t.type==="income"?<TrendingUp size={18}/>:t.category.includes("Makanan")?"🍜":t.category.includes("Online")?"📦":t.category.includes("Transportasi")?"🚌":"🧾"}</div><div className="transaction-main"><b>{t.name}</b><span>{t.category} · {new Date(`${t.date}T12:00:00`).toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</span></div><strong className={t.type==="income"?"green-text":"red-text"}>{t.type==="income"?"+":"−"}{money(t.amount)}</strong><div className="transaction-actions"><button className="icon-btn" title="Edit transaksi" onClick={()=>onEdit(t)}><Pencil size={15}/></button><button className="icon-btn delete-btn" title="Hapus transaksi" onClick={()=>onDelete(t.id)}><Trash2 size={15}/></button></div></div>)}</div>;
}
function Empty({text}) { return <div className="empty-state"><div>🌱</div><p>{text}</p></div>; }
function Modal({title,onClose,children}) { return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="modal-card" role="dialog" aria-modal="true" aria-label={title}><div className="modal-heading"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={19}/></button></div>{children}</section></div>; }

export default App;
