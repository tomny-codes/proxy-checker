# Proxy Checker

A full-featured, SaaS-grade Proxy Checker web application built with:

- ✅ React + TypeScript
- ✅ Material UI (MUI)
- ✅ TanStack React Table
- ✅ Express + Node.js backend
- ✅ Full concurrency with cancel support
- ✅ Responsive design for desktop & mobile
- ✅ Live filtering, sorting, pagination, and latency measurement

---

## ✨ Features

- Upload and test lists of HTTP, SOCKS4, SOCKS5 proxies
- Concurrency-limited testing for optimal speed and stability
- Full cancellation of in-progress requests
- Real-time progress bar during testing
- Detailed result table with:
  - ✅ Sorting (per column)
  - ✅ Filtering (status & type)
  - ✅ Search box
  - ✅ Pagination
  - ✅ Export filtered proxies (download)
  - ✅ Latency measurements (in milliseconds)
- Fully responsive design using Material UI
- Clean SaaS-style UI ready for production use

---

## 📦 Tech Stack

| Frontend  | Backend   |
| ---------- | ---------- |
| React 18   | Node.js + Express |
| TypeScript | TypeScript |
| Material UI | axios |
| TanStack React Table | socks package |
| Axios | |

---

## 🚀 Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/yourusername/proxy-tester-dashboard.git
cd proxy-checker
```

### 2️⃣ Install dependencies

For frontend:

```bash
cd frontend
npm install
```

For backend:

```bash
cd backend
npm install
```

### 3️⃣ Run backend

```bash
cd backend
npm run dev
```

By default runs on http://localhost:4000

### 4️⃣ Run frontend

```bash
cd frontend
npm start
```

By default runs on http://localhost:3000

## 🔧 Backend Notes
- Uses Express server with /test endpoint
- Supports parsing & auto-detecting proxy formats (HTTP, SOCKS4, SOCKS5)
- Measures latency per proxy test
- Uses socks package for SOCKS proxy handling
- Automatically retries multiple protocols for unknown types

## ⚠ Proxy Format Accepted
- ip:port
- http://ip:port
- socks4://ip:port
- socks5://ip:port

Example input:

```bash
http://91.107.154.214:80
socks4://192.111.137.34:18765
133.18.234.13:80
```

## 📊 Architecture Summary
- Proxy list submitted from frontend.
- Frontend tests proxies sequentially (concurrent workers) by sending individual HTTP POST requests to backend.
- Backend tests each proxy and returns result with type and latency.
- Results table updates live.

## 🖼 Sample Screenshot
![default](/screenshots/default.png)
![complete](/screenshots/complete.png)

## 📝 License
MIT License.
You are free to use, modify, and extend for your own SaaS projects!

