# To-Do List Manager 📋

A minimal, full-stack task management application designed for a 45-minute workshop. It features phone number authentication via **Minimoth OTP API**, a lightweight **Node.js** backend, and a modern **React + Vite** frontend.

---

## ⚡ Workshop Architecture Highlights

* **Frontend (React + Vite):** 3 clean views (Auth/OTP screen, Task list, API info modal) styled with modern vanilla CSS & glassmorphism.
* **Backend (Node.js + Express):** Strictly 5 core API endpoints with JWT session authentication.
* **Database (JSON File Storage):** 3 core models (`User`, `Todo`, `OtpRecord`) requiring zero database engine setup.
* **OTP Service:** Integrated with the **Minimoth API** (with simulated fallback for local workshop testing).

---

## 🔌 API Endpoints (5 Total)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/send-otp` | Sends 6-digit OTP code to phone via Minimoth API |
| `POST` | `/api/auth/verify-otp` | Verifies OTP, creates/finds User, and returns JWT |
| `GET` | `/api/todos` | Retrieves authenticated user's to-do items |
| `POST` | `/api/todos` | Creates a new to-do item (with priority: low / normal / high) |
| `PATCH` | `/api/todos/:id` | Toggles completed state, updates text, or deletes item |

---

## 📦 Project Structure

```text
To Do List Manager/
├── backend/
│   ├── .env.example        # Backend environment template
│   ├── .env                # Backend environment config
│   ├── db.js               # 3 Entities: User, Todo, OtpRecord
│   ├── package.json
│   └── server.js           # 5 Express API endpoints
├── frontend/
│   ├── .env.example        # Frontend environment template
│   ├── .env                # Frontend environment config
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api.js          # API client with token storage
│       ├── App.jsx         # Main application controller
│       ├── index.css       # Responsive dark aesthetic
│       ├── main.jsx
│       └── components/
│           ├── AuthView.jsx
│           ├── Navbar.jsx
│           └── TodoListView.jsx
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

* Backend will run on: `http://localhost:5000`
* Configure `MINIMOTH_API_KEY` in `backend/.env` with your Minimoth API key. If left blank, the server runs in workshop demo mode and logs OTPs directly in the terminal console.

### 2. Frontend Setup

In a separate terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

* Frontend will run on: `http://localhost:3000` (or `http://localhost:5173`)
* Open your browser and test phone login with OTP!

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
JWT_SECRET=workshop_super_secret_jwt_key_2026
MINIMOTH_API_KEY=your_minimoth_api_key_here
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```
