// tools/cleanup-sites.mjs — pembersihan data satu kali di produksi (tanpa dependensi).
// 1) Normalisasi whitespace semua deskripsi (\r\n / baris ganda -> spasi tunggal).
// 2) Koreksi tertarget: nama & deskripsi yang bermasalah (replacement char, kutip sisa, spasi hilang).
// Usage:  node tools/cleanup-sites.mjs --base <url> --email <e> --password <p>

import { readFileSync } from "node:fs";

function parseArgs(argv) {
  const args = { base: null, email: null, password: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--base") args.base = argv[++i];
    else if (argv[i] === "--email") args.email = argv[++i];
    else if (argv[i] === "--password") args.password = argv[++i];
  }
  return args;
}

function cleanWhitespace(s) {
  return (s || "").replace(/[\s\u00A0\u200B]+/g, " ").trim();
}

// Koreksi tertarget per id (nama & deskripsi final).
const FIXES = {
  9: {
    nama: "Rumah Jil (Rutan Kelas I) Belanda",
    deskripsi:
      "Beberapa sumber menyebutkan bahwa bangunan ini pada tahap awalnya dibangun oleh Portugis setelah menjatuhkan Malaka tahun 1511, kemudian diselesaikan pembangunannya oleh Belanda pada tahun 1867. Penjara ini merupakan penjara terbesar pada masanya di pantai timur Sumatra, mengimbangi penjara Sawah Lunto-Sumatra Barat.",
  },
  10: {
    nama: "Kompleks Gedung Daerah (Ambtswoning van Resident)",
    deskripsi:
      "Gedung ini dibangun oleh Pemerintah Kolonial Belanda sekitar tahun 1822 dan awalnya digunakan sebagai Kantor Residen Riau. Setelah masa kemerdekaan, bangunan ini pernah menjadi kediaman Gubernur Riau pertama dan Bupati Kepulauan Riau. Hingga kini, gedung masih digunakan untuk berbagai kegiatan kenegaraan meskipun telah mengalami renovasi dan penambahan bangunan.",
  },
  14: {
    nama: "SMPN 1 Tanjungpinang (Middelbare School)",
  },
  16: {
    deskripsi:
      "Kelenteng-kelenteng yang terdapat dalam kompleks Vihara ini, berdasarkan informasi pada bangunannya, diperkirakan berusia sekitar abad ke-18, yaitu sejak masa Yang Dipertuan Muda Riau (YDMR) II Daeng Celak (memerintah tahun 1728\u20131748). YDMR II memberikan kelonggaran kepada para pendatang Tiongkok untuk menempati daerah Senggarang. Sejak itulah, di kawasan ini dibangun perkampungan dan sejumlah rumah ibadah (Tionghoa).",
  },
  19: {
    deskripsi:
      "Daeng Celak merupakan Yang Dipertuan Muda Riau II yang memerintah pada tahun 1728\u20131745 dan menjadi tokoh penting dalam berkembangnya keturunan Melayu-Bugis di Kesultanan Riau. Setelah wafat pada tahun 1745, beliau dimakamkan di Kota Riau dengan gelar \u201cMarhum Mangkat di Kota\u201d.",
  },
  21: {
    deskripsi:
      "Daeng Marewah Kelana Jaya adalah Yang Dipertuan Muda (YDMR) I yang diangkat oleh Sultan Sulaiman Badrul Alamsyah I karena telah berjasa menaklukkan Raja Kecik. Pada masa pemerintahan Sultan Sulaiman di Kemaharajaan Melayu, Daeng Marewah yang menjalankan pemerintahan dari tahun 1722\u20131728 mangkat di Pulau Pitung. Jenazah beliau dibawa pulang ke Riau untuk dimakamkan di Bukit Sungai Baru bergelar \u201cMarhum Sungai Baru\u201d.",
  },
  22: {
    deskripsi:
      "Keberadaan Pulau Basing ditandai dengan sisa struktur dan bangunan serta sisa artefak yang belum tentu terbantu oleh sumber tertulis/sejarah, namun secara arkeologis sudah dapat diduga bahwa itu berkenaan dengan kronologi sekitar akhir abad ke-18 hingga awal abad ke-20. Hal ini memungkinkan dugaan bahwa Situs Pulau Basing merupakan bagian dari keberadaan objek-objek bersejarah di Tanjungpinang dalam perjalanan sejarah panjang Kerajaan Melayu Riau hingga mendekati masa-masa akhir formalnya sebagai sebuah institusi kekuasaan di lingkungan masyarakat Melayu Riau. Sayangnya, informasi kesejarahan Pulau Basing dengan struktur bangunan yang dikandungnya belum diperoleh, baik dalam kitab Tuhfat al-Nafis sebagai sumber historiografi Melayu, maupun dalam arsip masa pemerintahan Hindia Belanda.",
  },
  25: {
    deskripsi:
      "Bangunan ini awalnya merupakan aula bagi kegiatan siswa-siswa sekolah lanjutan yang didirikan pada tahun 1955 atas prakarsa Bupati Rakanadalian, bertempat di kompleks SPG sehingga lebih dikenal sebagai aula SPG. Aula ini kemudian menjadi tempat pertunjukan kesenian dan pertandingan olahraga, khususnya olahraga bulutangkis, hingga pada tahun 1970-an diubah menjadi kampus Pendidikan Guru Sekolah Lanjutan Pertama (PGSLP).",
  },
};

const args = parseArgs(process.argv.slice(2));
if (!args.base || !args.email || !args.password) {
  console.error("Usage: node cleanup-sites.mjs --base <url> --email <e> --password <p>");
  process.exit(1);
}

async function login(base, email, password) {
  const res = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    console.error(`Login gagal (${res.status}): ${await res.text()}`);
    process.exit(1);
  }
  const data = await res.json();
  return data.token || (data.data && data.data.token);
}

async function getSites(base) {
  const res = await fetch(`${base}/cagar-budaya`);
  if (!res.ok) throw new Error(`GET gagal (${res.status})`);
  const data = await res.json();
  return Array.isArray(data.data) ? data.data : data;
}

async function updateSite(base, token, id, body) {
  const res = await fetch(`${base}/cagar-budaya/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, text: await res.text() };
}

(async () => {
  const token = await login(args.base, args.email, args.password);
  const sites = await getSites(args.base);
  console.log(`Situs terbaca: ${sites.length}`);

  const plan = [];
  for (const s of sites) {
    const fix = FIXES[s.id];
    const changes = {};
    const nameCleaned = cleanWhitespace(s.nama);
    if (fix && fix.nama && nameCleaned !== fix.nama) changes.nama = fix.nama;
    if (fix && fix.deskripsi && cleanWhitespace(s.deskripsi) !== cleanWhitespace(fix.deskripsi)) {
      changes.deskripsi = cleanWhitespace(fix.deskripsi);
    } else if (cleanWhitespace(s.deskripsi) !== s.deskripsi) {
      changes.deskripsi = cleanWhitespace(s.deskripsi);
    }
    if (Object.keys(changes).length > 0) plan.push({ id: s.id, slug: s.slug, changes });
  }

  if (plan.length === 0) {
    console.log("Tidak ada perubahan yang diperlukan.");
    return;
  }

  console.log(`Akan diperbarui ${plan.length} situs:`);
  let ok = 0;
  for (const p of plan) {
    const r = await updateSite(args.base, token, p.id, p.changes);
    const fields = Object.keys(p.changes).join(",");
    if (r.ok) {
      ok++;
      console.log(`  [${p.id}] ${p.slug} -> ${fields}`);
    } else {
      console.error(`  [${p.id}] ${p.slug} GAGAL (${r.status}): ${r.text}`);
    }
    await new Promise((res) => setTimeout(res, 200));
  }
  console.log(`Selesai: ${ok} berhasil, ${plan.length - ok} gagal.`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});