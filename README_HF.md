# Panduan Deploy SIAM MPA API ke Hugging Face Spaces (Docker)

Ikuti langkah-langkah berikut untuk menjalankan Backend (API) SIAM MPA secara gratis di Hugging Face Spaces:

## 1. Persiapan di Hugging Face
1. Buat akun di [Hugging Face](https://huggingface.co/).
2. Klik **New Space**.
3. Beri nama (misal: `siam-mpa-api`).
4. Pilih **SDK: Docker**.
5. Pilih template **Blank** (jangan pilih yang lain).
6. Pilih **Public** atau **Private** (keduanya gratis, tapi disarankan Private jika ingin menyembunyikan log).

## 2. Pengaturan Variabel Lingkungan (Environment Variables)
Sebelum mengunggah kode, masukkan rahasia di tab **Settings** > **Variables and secrets** > **New secret**:
- `DATABASE_URL`: (URL dari Supabase/Neon)
- `JWT_SECRET`: (String acak kuat)
- `FONNTE_TOKEN`: (Token dari Fonnte)
- `FRONTEND_URL`: (URL Vercel Anda)
- `EMAIL_USER`: (Opsional)
- `EMAIL_PASS`: (Opsional)

## 3. Unggah Kode
Ada dua cara:

### Cara A: Melalui GitHub (Paling Mudah)
1. Hubungkan Space Anda ke repositori GitHub `siammpa`.
2. Pastikan file `Dockerfile` berada di lokasi yang benar. Karena struktur monorepo, Anda mungkin perlu mengatur `Dockerfile Path` di Settings Space ke `apps/api/Dockerfile`.

### Cara B: Melalui Git LFS (Langsung ke HF)
1. Clone repositori Space Anda ke komputer.
2. Salin seluruh isi folder proyek `siam_mpa` ke dalam folder clone tersebut.
3. Jalankan:
   ```bash
   git add .
   git commit -m "Deploy to HF Spaces"
   git push
   ```

## 4. Penting Diketahui
- **Port:** Hugging Face otomatis menggunakan port `7860`. Dockerfile sudah dikonfigurasi untuk ini.
- **URL API:** URL Anda akan menjadi `https://[USERNAME]-[SPACE_NAME].hf.space/api/v1`.
- **Tanpa Mode Tidur:** Hugging Face Spaces cenderung lebih stabil dan jarang "tidur" dibandingkan Render gratis.

---
*Dibuat untuk MPA HIMAKOM POLBAN - 2026*
