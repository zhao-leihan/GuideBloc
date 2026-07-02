# 🌍 Explomate.ly - Web3 Tour Marketplace & In-Person Guide Finder

Explomate.ly adalah platform marketplace pemandu wisata terdesentralisasi (DApp) premium yang dirancang untuk menghubungkan wisatawan (tourists) dengan pemandu lokal (guides) secara aman menggunakan Web3 smart escrow pada **Base Network**.

---

## 🔒 Lisensi Terbatas (Proprietary License)
Proyek ini dilindungi oleh lisensi komersial kepemilikan tertutup (**All Rights Reserved**). Penggandaan, modifikasi, penyebaran ulang, atau komersialisasi kode sumber ini tanpa persetujuan tertulis resmi dari pemilik hak cipta Explomate.ly sangat dilarang keras. Silakan merujuk pada berkas [LICENSE](LICENSE) untuk detail perjanjian lisensi yang membatasi hak guna.

---

## 🚀 Fitur Utama & Keunggulan

### 1. 🛡️ Base Smart Escrow Payouts
- Transaksi pembayaran aman menggunakan USDC/USDT secara langsung di jaringan **Base**.
- Uang pembayaran wisatawan dikunci sementara di kontrak escrow, dan hanya akan dilepaskan ke dompet Guide setelah tur selesai dikonfirmasi oleh Tourist.
- Integrasi proteksi: Pemandu wajib menghubungkan wallet Base mereka sebelum dapat mempublikasikan Gig, mencegah dana tertahan atau salah sasaran.

### 2. 📡 GPS Live Meetup Radar (Pertemuan Fisik)
- Fitur pencarian koordinat real-time menggunakan radar interaktif di dashboard pemesanan aktif.
- Perhitungan rumus Haversine secara instan untuk mendeteksi kedatangan Tourist & Guide dalam radius 50 meter.
- **Double Selfie Verification**: Meminta kedua pihak mengunggah selfie verifikasi wajah demi keamanan maksimal sebelum status diselesaikan.

### 3. 🎮 Gamification & Guide Rankings (XP, Level, Leaderboard)
- Pemandu mendapatkan XP secara dinamis setiap kali berhasil menyelesaikan pekerjaan tur (+10 XP per USD transaksi).
- Naik level secara dinamis (tiap 1000 XP) untuk meningkatkan skor publisitas penawaran di hasil pencarian.
- Papan peringkat global (Leaderboard) interaktif dan kotak masuk notifikasi penghargaan internal (System Mailbox).

### 4. 📈 Algorithmic Boost (1 USDC)
- Fitur peningkatan skor publisitas gig pemandu ke posisi teratas selama 7 hari dengan membayar Web3 Network Fee sebesar 1 USDC.

### 5. 🛠️ Moderasi Admin Mandiri
- Panel kontrol lengkap bagi Super Admin untuk memantau status pengguna, membekukan akun yang melanggar (Account Suspension), serta melayangkan surat peringatan keras (Warning Letter) yang langsung tampil di dashboard target.

---

## 📦 Prasyarat Instalasi
- **Node.js**: v18.x atau lebih baru
- **PostgreSQL**: Database relasional untuk menyimpan profil pengguna dan data relasi
- **Prisma**: ORM untuk migrasi schema database
- **Web3 Wallet**: MetaMask atau Coinbase Wallet yang terhubung ke jaringan Base Sepolia Testnet

---

## 🛠️ Cara Memulai Pengujian

### 1. Kloning & Instalasi Dependensi
```bash
npm install
```

### 2. Konfigurasi Environment (`.env`)
Salin berkas `.env.example` ke `.env` dan lengkapi konfigurasi database serta API keys:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/explomate"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Jalankan Migrasi Database
```bash
npx prisma db push
npx prisma db seed
```

### 4. Jalankan Server Development
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.
