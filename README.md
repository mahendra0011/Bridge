// Change 153 - Adding interface definitions
// Change 144 - Improving graceful shutdown
// Change 135 - Adding proper caching
// Change 126 - Fixing injection risks
// Change 117 - Adding service worker
// Change 108 - Improving performance metrics
// Change 99 - Added auto-save feature
// Change 90 - Fixing layout alignment
// Change 81 - Adding proper validation rules
// Change 72 - Improving protected routes
// Change 63 - Adding responsive design fixes
// Change 54 - Enhancing user experience
// Change 45 - Secured API endpoints properly
// Change 36 - Fixed form validation issue
// Change 27 - Added file upload capability
// Change 18 - Improved file organization layout
// Change 9 - Updated health check endpoint response
// Change 0 - Updated README with project overview
// Change 156
// Change 144
// Change 132
// Change 120
// Change 108
// Change 96
// Change 84
// Change 72
// Change 60
// Change 48
// Change 36
// Change 24
// Change 12
// Change 0
// Update 168
// Update 156
// Update 144
// Update 132
// Update 120
// Update 108
// Update 96
// Update 84
// Update 72
// Update 60
// Update 48
// Update 36
// Update 24
// Update 12
// Update 0
# Bridge — Internship & Job Platform

A full-stack platform connecting students with internships and jobs. Built with React + Vite (frontend) and Node.js + Express + MongoDB (backend).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Auth | JWT + email verification |
| Real-time | Socket.io (live notifications) |
| Email | Brevo transactional API |
| File uploads | Multer |

---

## Project Structure

```
bridge-project/
├── backend/
│   ├── src/
│   │   ├── middleware/   # auth, rateLimit, validate, upload
│   │   ├── models/       # User, StudentProfile, Company, Internship, Job, Application, Notification
│   │   ├── routes/       # auth, student, company, internships, jobs, admin
│   │   ├── scripts/      # seedAdmin.js
│   │   └── utils/        # email, jwt, socket
│   ├── uploads/          # (auto-created) uploaded files
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/      # AuthContext
    │   ├── lib/          # api client
    │   └── pages/        # auth, student, company, admin
    ├── .env.example
    └── package.json
```

---

## Local Setup (Step by Step)

### Prerequisites
- Node.js >= 18
- MongoDB (local) or MongoDB Atlas account
- Brevo account (free tier works)

---

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment Variables

**Backend — copy and fill:**
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/bridge
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=7d
BREVO_API_KEY=<your Brevo API key>
EMAIL_FROM=Bridge <no-reply@yourdomain.com>
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@bridge.io
ADMIN_PASSWORD=<strong password>
ADMIN_NAME=Admin
```

**Frontend — copy and fill:**
```bash
cp frontend/.env.example frontend/.env
```

`frontend/.env` for local dev — leave `VITE_API_URL` empty (Vite proxy handles it):
```env
VITE_API_URL=
```

---

### 3. Set Up Brevo Email (Required for signup/reset)

1. Sign up at https://app.brevo.com (free)
2. Go to **SMTP & API → API Keys → Create API key**
3. Paste key into `backend/.env` as `BREVO_API_KEY`
4. Go to **Senders & IPs → Senders → Add a new sender** and verify your sender email
5. Set `EMAIL_FROM` to that verified email address

---

### 4. Create uploads folder

```bash
mkdir -p backend/uploads
```

---

### 5. Create Admin User

```bash
cd backend
npm run seed:admin
```

This creates (or updates) an admin account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env`.

---

### 6. Run the App

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open: http://localhost:5173

---

## User Roles

| Role | What they can do |
|---|---|
| **Student** | Browse internships/jobs, apply, save, view notifications, manage profile |
| **Company** | Post internships/jobs, view applicants, manage applications & interview details |
| **Admin** | View platform stats, manage students/companies, approve/delete postings |

---

## Key API Endpoints

### Auth
```
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/verify-email/:token
POST /api/auth/forgot-password
POST /api/auth/reset-password/:token
GET  /api/auth/me
```

### Student
```
GET/PUT  /api/student/profile
GET      /api/student/applications
GET      /api/student/saved
POST     /api/student/saved/:id
DELETE   /api/student/saved/:id
GET      /api/student/notifications
```

### Company
```
GET/PUT  /api/company/profile
GET      /api/company/dashboard
GET      /api/company/postings
GET      /api/company/applicants/:postingId
PATCH    /api/company/applications/:id/status
```

### Admin
```
GET   /api/admin/dashboard
GET   /api/admin/students
GET   /api/admin/companies
GET   /api/admin/internships
GET   /api/admin/jobs
PATCH /api/admin/users/:id/block
PATCH /api/admin/users/:id/unblock
PATCH /api/admin/postings/:id/approve
DELETE /api/admin/postings/:id
```

---

## Deployment

See deployment configs in project root:
- **Render** (backend): `render.yaml`
- **Docker**: `Dockerfile` (backend), `docker-compose.yml`
- **Vercel** (frontend): `vercel.json` inside `frontend/`

### Quick Deploy Steps

**Backend on Render:**
1. Push to GitHub
2. Create new Web Service on Render, point to `backend/` folder
3. Set all env vars from `.env.example` in Render dashboard

**Frontend on Vercel:**
1. Import repo on Vercel
2. Set root directory to `frontend/`
3. Set `VITE_API_URL=https://your-backend.onrender.com`

---

## Security Features

- JWT authentication with token expiry
- Rate limiting on auth routes (login: 10/15min, signup: 5/hour, forgot-password: 5/hour)
- Global API rate limit (300 req/15min)
- Input validation + sanitization via express-validator
- Password hashing with bcryptjs
- Helmet security headers
- CORS locked to `CLIENT_URL`
- Blocked users cannot log in

---

## Troubleshooting

**MongoDB connection failed:** Make sure MongoDB is running locally (`mongod`) or check your Atlas connection string.

**Emails not sending:** Verify `BREVO_API_KEY` is set and sender email is verified in Brevo dashboard.

**Uploads 404:** Make sure `backend/uploads/` folder exists.

**Socket not connecting:** `CLIENT_URL` in backend `.env` must match the exact origin your frontend runs on.

**Login says "blocked":** Admin has blocked that user — unblock from `/admin/students` or `/admin/companies`.















































