# TKGen - Generator Nama Titik Kartometrik (TK Reguler & TK Simpul)

Aplikasi web modern, cepat, dan responsif untuk menghasilkan kode nama **Titik Kartometrik (TK)** batas desa/kelurahan sesuai standar pedoman teknis **Kementerian Dalam Negeri (Permendagri)** dan **Badan Informasi Geospasial (BIG)**.

![TKGen Banner](favicon.svg)

---

## 📌 Aturan & Format Penamaan Titik Kartometrik

Berdasarkan pedoman penetapan dan penegasan batas desa dengan metode kartometrik:

### 1. Struktur Format Kode
```text
TK [Kode Prov].[Kode Kab].[Kode Kec 1].[Kode Desa 1]-[Kode Kec 2].[Kode Desa 2]-[No.TK]
```
- **TK**: Singkatan Titik Kartometrik (diikuti tanda spasi)
- **Kode Prov** *(Kuning)*: 2 digit kode provinsi
- **Kode Kab** *(Hijau)*: 2 digit kode kabupaten/kota
- **Kode Kec** *(Biru)*: 2 digit kode kecamatan
- **Kode Desa** *(Pink/Merah Muda)*: 4 digit kode desa/kelurahan
- **Pemisah Antardesa**: Tanda hubung `-`
- **No.TK** *(Abu-abu)*: Nomor urut titik

### 2. TK Reguler vs TK Simpul
| Jenis Titik | Jumlah Desa | Format Akhiran | Contoh Hasil |
| :--- | :--- | :--- | :--- |
| **TK Reguler** | Tepat 2 Desa | `-001`, `-002`, dst. | `TK 72.04.04.2001-04.2003-009` |
| **TK Simpul** | 3+ Desa (Tanpa Batas) | Selalu `-000` | `TK 74.13.01.2001-02.2001-03.2001-000` |

---

## ✨ Fitur Unggulan

- 🎛️ **Slider Tengah Interaktif**: Beralih antara **TK Reguler** dan **TK Simpul** secara instan dengan animasi halus.
- 🏘️ **Kolom Desa Adaptif**:
  - Pada *TK Reguler*: 2 kolom desa dengan dropdown nama & kode.
  - Pada *TK Simpul*: Kolom desa dinamis dilengkapi tombol **Tambah Desa** dan **Hapus Kolom**.
- 📋 **1 Kolom Output Klik-untuk-Salin**: Menampilkan nama TK ukuran besar dengan feedback visual saat disalin ke clipboard.
- 🎨 **Visual Breakdown Sesuai Diagram BIG**: Blok warna interaktif (Kuning, Hijau, Biru, Pink, Abu-abu) yang mengurai setiap segmen kode.
- 🔢 **Auto-Increment Cerdas**: Otomatis menaikkan nomor urut titik (+1) setiap kali nama TK disalin (pada mode TK Reguler).
- 🌓 **Light & Dark Mode**: Tampilan estetis, nyaman di mata, dan tersimpan di memori browser.
- 🕒 **Riwayat & Ekspor Data**: Menyimpan riwayat titik yang dibuat dengan fitur unduh ke format CSV atau TXT (siap diimpor ke ArcGIS / QGIS).
- 📱 **Desain Responsif**: Rapi diakses dari smartphone, tablet, maupun komputer desktop.

---

## 🚀 Panduan Hosting di GitHub Pages

Aplikasi ini dibangun menggunakan *Vanilla Web Technologies* (HTML5, CSS3 murni, dan JavaScript tanpa framework berat), sehingga dapat langsung di-hosting gratis di **GitHub Pages** dalam hitungan detik:

1. Buat repositori baru di GitHub (misal: `tkgen` atau `titik-kartometrik`).
2. Unggah semua file proyek ini (`index.html`, `style.css`, `app.js`, `data.js`, `favicon.svg`, `README.md`) ke repositori tersebut:
   ```bash
   git init
   git add .
   git commit -m "Initial commit TKGen"
   git branch -M main
   git remote add origin https://github.com/USERNAME/tkgen.git
   git push -u origin main
   ```
3. Di halaman repositori GitHub, buka menu **Settings** > **Pages** (di sidebar kiri).
4. Di bagian **Build and deployment** > **Branch**:
   - Pilih Branch: `main`
   - Pilih Folder: `/ (root)`
   - Klik **Save**.
5. Tunggu 1–2 menit, website Anda sudah aktif dan dapat diakses publik melalui URL:
   `https://USERNAME.github.io/tkgen/`

---

## 👨‍💻 Watermark & Pengembang

Develop with Antigravity by **[@ekabudiku](https://instagram.com/ekabudiku)**.
