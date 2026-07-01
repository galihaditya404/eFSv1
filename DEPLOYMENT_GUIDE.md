# 📘 Buku Panduan: e-Faktur di Ubuntu Server (Docker)

Dokumen ini adalah panduan lengkap *(Administrator Guide)* untuk mengelola siklus hidup aplikasi e-Faktur di lingkungan Ubuntu Server menggunakan Docker. Simpan panduan ini sebagai rujukan teknis Anda di masa mendatang.

---

## 1. 🚀 Instalasi Awal (Deployment)

Jika ini adalah pertama kalinya Anda memindahkan aplikasi ini ke server baru, jalankan langkah-langkah berikut secara berurutan.

1. **Pastikan Docker & Compose terinstal:**
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose-v2 -y
   ```
2. **Masuk ke folder proyek aplikasi:**
   ```bash
   cd /home/sasu/eFSv1
   ```
3. **PENTING: Siapkan file database agar tidak korup saat dimuat Docker:**
   ```bash
   touch faktur_data.json
   ```
4. **Bangun dan Jalankan Container:**
   ```bash
   sudo docker compose up -d --build
   ```

> [!NOTE]
> Argumen `-d` berarti *Detached* (berjalan di latar belakang), sehingga terminal Anda tidak akan terkunci. `--build` berarti Docker akan membaca kode Anda dan membangun citra *(image)* baru.

---

## 2. 🛠️ Maintenance & Pemantauan (Monitoring)

Selama aplikasi berjalan, Anda mungkin perlu memantau kesehatannya. Gunakan perintah-perintah berikut:

- **Melihat status kontainer aktif:**
  ```bash
  sudo docker ps
  ```
- **Melihat jejak Log (Siapa saja yang mengakses, adakah error?):**
  ```bash
  sudo docker compose logs --tail=100 -f
  ```
  *(Tekan `CTRL + C` untuk keluar dari tampilan log).*

- **Me-restart aplikasi secara paksa jika terasa *lag*:**
  ```bash
  sudo docker compose restart
  ```

---

## 3. 🔄 Panduan Pembaruan Aplikasi (Updating)

Jika pengembang (*developer*) memberikan revisi kode baru kepada Anda (misalnya Anda melakukan `git pull` atau menyalin file baru ke server), Anda **harus** membangun ulang kontainer agar kode baru tersebut terbaca.

1. Matikan kontainer lama:
   ```bash
   sudo docker compose down
   ```
2. Bangun kembali menggunakan kode baru:
   ```bash
   sudo docker compose up -d --build
   ```

> [!IMPORTANT]
> Jangan khawatir! Data *history* faktur pajak yang tersimpan tidak akan terhapus saat melakukan langkah di atas, karena data Anda diamankan di luar kontainer melalui sistem *Docker Volumes*.

---

## 4. 🛡️ Saran Keamanan (Security)

Untuk memastikan aplikasi perusahaan Anda tetap tertutup dan aman dari serangan internet luar:

1. **Gunakan Reverse Proxy (Nginx) & SSL:** Pastikan akses ke aplikasi ini selalu menggunakan `https://domain-anda.com`. Nginx bertugas menerima koneksi masuk dengan aman (Port 443), lalu mem- *bypass* / meneruskannya secara lokal ke port Docker `3000`.
2. **Tutup Port Asli:** Jangan biarkan jaringan publik menembak langsung port 3000. Konfigurasi `ufw` Ubuntu Anda agar port 3000 diblokir dari luar, dan hanya Nginx (Localhost) yang berhak berkomunikasi dengan port 3000 tersebut.
3. **Backup Rutin Database:** File `faktur_data.json` adalah jatung data Anda. Buat sebuah tugas otomatis (*Cron Job*) di Ubuntu untuk meng-copy file tersebut ke folder penyimpanan aman atau ke cloud (misal Google Drive) setiap pukul 12 malam.

---

## 5. 🚑 Troubleshooting (Saran & Perbaikan Umum)

- **Masalah:** `Error response from daemon: driver failed programming external connectivity (bind: address already in use)`
  **Solusi:** Port 3000 masih dikunci oleh aplikasi lain (seperti PM2). Pastikan untuk mematikan proses lama menggunakan `pm2 kill` atau cari prosesnya dengan `sudo lsof -i:3000`.

- **Masalah:** Semua riwayat faktur menghilang setelah server mati listrik!
  **Solusi:** Berarti *Volume* pada `docker-compose.yml` terkonfigurasi salah atau Anda salah menghapus file `faktur_data.json`. Selalu perhatikan *backup*!

---

## 6. 🗑️ Penghapusan Sistem (Uninstallation)

Jika di masa depan perusahaan Anda tidak lagi menggunakan aplikasi e-Faktur ini dan Anda ingin mengembalikan memori server seperti semula:

1. Masuk ke folder proyek: `cd /home/sasu/eFSv1`
2. Matikan kontainer dan **hancurkan jaringan Docker** terkait:
   ```bash
   sudo docker compose down
   ```
3. Hapus *Image* (Cetakan memori) aplikasi ini dari mesin Docker:
   ```bash
   sudo docker rmi efs-app
   ```
4. Bersihkan folder kode:
   ```bash
   cd ..
   rm -rf /home/sasu/eFSv1
   ```

*(Setelah langkah 4 dilakukan, aplikasi dan seluruh riwayat data akan lenyap secara permanen).*
