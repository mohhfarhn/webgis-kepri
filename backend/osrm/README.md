# OSRM Lokal — Routing Kepulauan Riau saja (uji di PC)

Router OSRM (Open Source Routing Machine) yang dijalankan sendiri di Docker, memakai
data jalan OpenStreetMap dari [Geofabrik](https://download.geofabrik.de/asia.html).
Bebas lisensi (BSD + ODbL), biaya hanya sumber daya komputer Anda.

## Cakupan area

Server ini khusus **Provinsi Kepulauan Riau**: Karimun, Batam, Bintan, Lingga,
Anambas, dan Natuna. Ekstrak **Sumatra** (~270 MB) — bukan seluruh Indonesia
(~1,6 GB) — dipakai sebagai sumber lalu dipotong ke bbox Kepri dengan osmium
(`lon 102.8–109.9, lat −1.6–4.8`, lihat `Dockerfile`). Hasil indeks jauh lebih
kecil dan cepat, tetapi rute **tidak valid di luar bbox tersebut**.

## Prasyarat

- Docker Desktop (Windows/Mac) atau Docker Engine (Linux)
- RAM ≥ 4 GB (proses build indeks routing wilayah kecil)

## Menjalankan

```bash
docker compose up -d --build
```

- **Build pertama lama** (unduh `sumatra-latest.osm.pbf` ~270 MB + indeks routing):
  5–15 menit tergantung koneksi. Setelah selesai, container langsung live.
- Validasi cepat:

```bash
curl "http://localhost:5001/route/v1/driving/104.4150,0.9205;104.4380,0.9250?steps=true&overview=full"
```

## Mengarahkan aplikasi ke server ini

Buka `frontend/.env` lalu isi:

```
NEXT_PUBLIC_ROUTING_URL=http://localhost:5001/route/v1
```

Ulangi `npm run dev` (atau `npm run build`). Jika value tidak diisi, aplikasi
kembali memakai demo publik OSRM (mencakup seluruh dunia).

> Untuk dicoba dari HP di jaringan yang sama, ganti `localhost` dengan IP LAN komputernya,
> mis. `http://192.168.1.10:5001/route/v1`. Ini dipanggil dari browser via `fetch`
> (bukan geolocation), jadi aman walau HTTP.

## Memperluas area nanti

Ubah bbox di `Dockerfile`, mis. seluruh Indonesia:

```dockerfile
ADD https://download.geofabrik.de/asia/indonesia-latest.osm.pbf /data/indonesia.osm.pbf
RUN osmium extract -b 95,-11,141,6 indonesia.osm.pbf -o kepri.osm.pbf
```

> Tetap `extract` agar tidak memproses 1,6 GB penuh, butuh jarak antar bbox tidak
> terlalu lebar untuk hasil ringan.

## Catatan

- **Kualitas data**: rute sebaik apa pun sumber datanya, wilayah Kepulauan Riau
  (terutama pulau kecil seperti Anambas/Natuna) punya sedikit jalan di OSM —
  rute bisa tidak ada/nyasar di sana.
- **Atribusi**: data OpenStreetMap wajib ditampilkan "© OpenStreetMap contributors"
  sesuai lisensi ODbL.
- **Ganti kendaraan/profil**: Dockerfile memakai `car.lua` bawaan; profil lain
  (`foot.lua`, `bicycle.lua`) tersedia di `/opt/` image resmi.