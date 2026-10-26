import fs from "node:fs";

const file = "src/App.jsx";
if (!fs.existsSync(file)) {
  console.error("Tidak menemukan src/App.jsx. Jalankan skrip ini dari folder project (yang ada package.json).");
  process.exit(1);
}

// backup file lama (hanya sekali, supaya tidak tertimpa kalau skrip dijalankan ulang)
fs.mkdirSync("backup", { recursive: true });
if (!fs.existsSync("backup/App.jsx.lama")) fs.copyFileSync(file, "backup/App.jsx.lama");

let s = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").replace(/\n+$/, "") + "\n";

function rep(oldS, newS, n = 1) {
  const c = s.split(oldS).length - 1;
  if (c !== n) throw new Error("Pola tidak cocok (" + c + "x, harusnya " + n + "x): " + oldS.slice(0, 60));
  s = s.split(oldS).join(newS);
}

try {
  // 1. perbaiki emoji/simbol yang rusak karena salah encoding
  if (/\u00f0\u0178|\u00e2\u0153|\u00e2\u02dc|\u00e2\u2122/.test(s)) {
    const dec = new TextDecoder("windows-1252");
    const rev = new Map();
    for (let b = 0; b < 256; b++) rev.set(dec.decode(new Uint8Array([b])), b);
    const bytes = [];
    for (const ch of s) {
      const code = ch.codePointAt(0);
      if (code < 128) bytes.push(code);
      else if (rev.has(ch)) bytes.push(rev.get(ch));
      else bytes.push(...new TextEncoder().encode(ch));
    }
    s = new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
  }

  // 2. ikon yang tidak dipakai
  rep("ChartNoAxesColumn, ShoppingBag, Target", "ChartNoAxesColumn, Target");
  rep("Cat, CircleDollarSign, Trash2", "Cat, Trash2");
  rep("ChevronRight, Gift\n}", "ChevronRight\n}");

  // 3. helper tanggal
  rep(`const today = () => {
  const d = new Date();
  return \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,"0")}-\${String(d.getDate()).padStart(2,"0")}\`;
};`, `const ymd = (d) => \`\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,"0")}-\${String(d.getDate()).padStart(2,"0")}\`;
const today = () => ymd(new Date());`);

  // 4. bug filter Mingguan
  rep(`    const now = new Date();
    const startWeek = new Date(now);
    startWeek.setDate(now.getDate() - 6);
    startWeek.setHours(0,0,0,0);
    return transactions.filter(t => {
      const d = new Date(\`\${t.date}T12:00:00\`);
      const inPeriod = period === "Harian" ? t.date === today()
        : period === "Mingguan" ? d >= startWeek && d <= now
        : d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();`, `    const now = new Date();
    const todayStr = ymd(now);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const weekStartStr = ymd(weekStart);
    const monthPrefix = todayStr.slice(0, 7);
    return transactions.filter(t => {
      const inPeriod = period === "Harian" ? t.date === todayStr
        : period === "Mingguan" ? t.date >= weekStartStr && t.date <= todayStr
        : t.date.startsWith(monthPrefix);`);

  // 5. Laporan: kategori ikut periode
  rep("  const topLeakage = Object.entries(leakage).sort((a,b) => b[1]-a[1]).slice(0,4);",
`  const topLeakage = Object.entries(leakage).sort((a,b) => b[1]-a[1]).slice(0,4);
  const periodLeakage = Object.entries(filteredTransactions.filter(t => t.type === "expense").reduce((acc,t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc;
  }, {})).sort((a,b) => b[1]-a[1]).slice(0,4);`);
  const a = s.indexOf('{active === "Laporan"');
  const b = s.indexOf('{active === "Rem Belanja"');
  if (a < 0 || b < a) throw new Error("Bagian Laporan tidak ditemukan");
  let blk = s.slice(a, b);
  if (blk.split("topLeakage").length - 1 !== 3) throw new Error("Bagian Laporan berbeda dari yang diharapkan");
  blk = blk.split("topLeakage").join("periodLeakage")
    .split("expenses?amount/Math.max(...periodLeakage.map(x=>x[1]))*100:0")
    .join("amount/Math.max(...periodLeakage.map(x=>x[1]))*100");
  s = s.slice(0, a) + blk + s.slice(b);

  // 6. quest anggaran
  rep("done: spentToday <= budget,", "done: transactions.some(t => t.date === today()) && spentToday <= Number(budget),");

  // 7. tombol reset
  rep("resetDemo", "resetAll", 2);
  rep('"Kembalikan data contoh? Data transaksi dan progres saat ini akan diganti."', '"Reset semua data? Transaksi, tabungan, wishlist, dan XP akan dihapus dan tidak bisa dikembalikan."');
  rep('"Data contoh berhasil dipulihkan."', '"Semua data berhasil direset."');
  rep("Pulihkan data contoh", "Reset semua data");

  // 8. emoji yang hilang total
  rep("diperbarui! ??", "diperbarui! \u2728");
} catch (e) {
  console.error("\nGAGAL, file TIDAK diubah:\n" + e.message);
  console.error("Kalau pesan ini muncul setelah skrip pernah berhasil, berarti perbaikan sudah terpasang.");
  process.exit(1);
}

fs.writeFileSync(file, s, "utf8");
console.log("BERHASIL: src/App.jsx sudah diperbaiki. Backup lama ada di backup/App.jsx.lama");