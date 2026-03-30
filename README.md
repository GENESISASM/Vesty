# Vesty

> **EN:** A full-stack web application for simple joint financial recording and stock management.
>
> **ID:** Aplikasi web fullstack untuk mencatat keuangan bersama dan manajemen stok barang secara sederhana.

---

## Features

### Finance Management
- **EN:** Record income & expenses with categories, descriptions, and dates
- **ID:** Catat pemasukan & pengeluaran dengan kategori, deskripsi, dan tanggal

### Stock Management
- **EN:** Add items, record stock in/out movements, and view full history
- **ID:** Tambah barang, catat stok masuk/keluar, dan lihat riwayat lengkap

### Dashboard Overview
- **EN:** Real-time financial summary — total income, expenses, and balance
- **ID:** Ringkasan keuangan real-time — total pemasukan, pengeluaran, dan saldo

### Authentication
- **EN:** Secure login with JWT — each user only sees their own data
- **ID:** Login aman dengan JWT — setiap user hanya bisa lihat data miliknya

---

## Tech Stack

### Frontend
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

### Database & Deployment
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)

---

## Project Structure

```
Vesty/
├── vesty_fe/          # Frontend — Next.js 14 (App Router)
│   ├── app/
│   │   ├── (auth)/login/
│   │   └── (dashboard)/dashboard/
│   │       ├── finance/
│   │       └── stock/
│   ├── context/       # Auth Context
│   └── lib/           # Axios instance & types
│
└── Vesty_BE/          # Backend — Express.js REST API
    └── src/
        ├── routes/        # API route definitions
        ├── controllers/   # Request handlers
        ├── services/      # Business logic & DB queries
        ├── middlewares/   # JWT auth middleware
        └── config/        # Prisma client
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm v9+
- Git

### 1. Clone the repository
```bash
git clone https://github.com/GENESISASM/Vesty.git
cd Vesty
```

### 2. Setup Backend
```bash
cd Vesty_BE
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

> Buat file `.env` di folder `Vesty_BE` — lihat `.env.example` untuk referensi variabel yang dibutuhkan.

Backend akan berjalan di `http://localhost:5000`

### 3. Setup Frontend
```bash
cd ../vesty_fe
npm install
npm run dev
```

> Buat file `.env.local` di folder `vesty_fe` — lihat `.env.example` untuk referensi variabel yang dibutuhkan.

Frontend akan berjalan di `http://localhost:3000`

---

## Author

**Muhamad Saiful Arif**

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/GENESISASM)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/muhamad-saiful-arif-8529432a2/)

> This project is for personal and portfolio use.
> Built to learn, designed to use.