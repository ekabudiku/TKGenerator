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
| **TK Simpul** | 3+ Desa (Tanpa Batas) | Selalu `-000` | `TK 72.04.01.2002-01.2009-01.2013-000` |

### 3. Aturan Pengurutan Kode Wilayah (Prioritas Kecamatan lalu Desa)
Sesuai standar teknis penegasan batas (Permendagri & BIG), segmen kode wilayah antardesa diurutkan dari angka **terkecil ke terbesar**:
1. **Prioritas Utama (Kode Kecamatan)**: Segmen desa diurutkan berdasarkan kode kecamatan terlebih dahulu (dari kecil ke besar).
2. **Prioritas Kedua (Kode Desa)**: Apabila kode kecamatan sama, maka pengurutan dilanjutkan berdasarkan kode desa (dari kecil ke besar).
- *Contoh TK Simpul*: Titik pertemuan tiga desa di kecamatan `01` dengan kode desa `2002`, `2009`, dan `2013` menghasilkan:
  `TK 72.04.01.2002-01.2009-01.2013-000` (urut dari `2002`, `2009`, lalu `2013`).
- *Contoh TK Reguler (Antarkecamatan)*: Pertemuan desa di kecamatan `04` dan `01` akan menempatkan kecamatan `01` di depan:
  `TK 72.04.01.2001-04.2003-001`.

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


## 👨‍💻 Watermark & Pengembang

Develop with Antigravity by **[@ekabudiku](https://instagram.com/ekabudiku)**.
