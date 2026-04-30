# 📚 SPPU Question Bank — Full-Stack Web Application

A complete, production-ready question bank for SPPU Engineering students.
Built with **Node.js + Express + MongoDB + Vanilla JS**.

---

## 🗂️ Project Structure

```
sppu-qbank/
│
├── server.js                  ← Express app entry point
├── package.json
│
├── models/
│   ├── User.js                ← Student & Admin schema
│   ├── Question.js            ← Exam question schema
│   └── Notification.js        ← Broadcast notification schema
│
├── routes/
│   ├── authRoutes.js          ← POST /api/auth/register, /login, GET /me
│   ├── questionRoutes.js      ← GET questions (students, auth-protected)
│   ├── adminRoutes.js         ← Full CRUD (admin only)
│   └── notifRoutes.js         ← Notifications CRUD
│
├── middleware/
│   └── auth.js                ← JWT authenticate + authorize middleware
│
└── public/
    ├── index.html             ← Landing page
    ├── css/
    │   └── main.css           ← Full design system
    ├── js/
    │   ├── auth.js            ← Shared helpers (token, fetch, toast)
    │   ├── dashboard.js       ← Student dashboard logic
    │   └── admin.js           ← Admin panel logic
    └── pages/
        ├── login.html
        ├── register.html
        ├── dashboard.html     ← Student app (browse, saved, important, notifs)
        └── admin.html         ← Admin panel (questions, users, stats, notifs)
```

---

## ✅ Features

| Feature | Students | Admin |
|---|---|---|
| Register / Login (JWT) | ✅ | ✅ |
| Browse questions by subject + topic | ✅ | ✅ |
| Filter by year | ✅ | ✅ |
| View ⭐ Important questions | ✅ | ✅ |
| Save / bookmark questions | ✅ | — |
| Receive notifications | ✅ | — |
| Add / Edit / Delete questions | ❌ | ✅ |
| Manage users (activate/deactivate) | ❌ | ✅ |
| Send notifications | ❌ | ✅ |
| Dashboard stats | ❌ | ✅ |

---

## 🚀 Running the Project Locally

### Step 1 — Prerequisites

Make sure you have installed:
- **Node.js** v18+ → https://nodejs.org
- **MongoDB** (Community Edition) → https://www.mongodb.com/try/download/community
  - OR use **MongoDB Atlas** (free cloud DB) → https://cloud.mongodb.com

Verify installations:
```bash
node -v      # should print v18.x or higher
npm -v       # should print 9.x or higher
mongod --version  # if using local MongoDB
```

### Step 2 — Install Dependencies

```bash
cd sppu-qbank
npm install
```

This installs: `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `nodemon`

### Step 3 — Start MongoDB

**Option A — Local MongoDB:**
```bash
# macOS / Linux
mongod --dbpath /data/db

# Windows (run as Administrator)
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```

**Option B — MongoDB Atlas (Cloud, no install needed):**
1. Go to https://cloud.mongodb.com → Create free cluster
2. Get your connection string, e.g.:
   `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/sppu_qbank`
3. Set the environment variable before starting:
   ```bash
   # Linux / macOS
   export MONGO_URI="your-atlas-connection-string"
   
   # Windows PowerShell
   $env:MONGO_URI="your-atlas-connection-string"
   ```

### Step 4 — Start the Server

```bash
# Development (auto-restarts on file changes)
npm run dev

# OR Production
npm start
```

You should see:
```
✅ MongoDB connected
👤 Default admin created → admin@sppu.edu / Admin@123
🚀 Server running → http://localhost:3000
```

### Step 5 — Open the App

Open your browser and visit: **http://localhost:3000**

---

## 👤 Default Accounts

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@sppu.edu | Admin@123 |
| Student | Register at /register | (your choice) |

> ⚠️ **Change the admin password** in production!

---

## 🔌 REST API Reference

### Auth Routes
| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| POST | `/api/auth/register` | Register new student | Public |
| POST | `/api/auth/login` | Login, returns JWT | Public |
| GET | `/api/auth/me` | Get current user | 🔐 Any |

### Question Routes (Students)
| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/questions` | All questions | 🔐 Any |
| GET | `/api/questions/filter?subject=X&topic=Y&year=Z` | Filter questions | 🔐 Any |
| GET | `/api/questions/subjects` | Distinct subjects | 🔐 Any |
| GET | `/api/questions/topics?subject=X` | Topics for a subject | 🔐 Any |
| GET | `/api/questions/important` | Important questions | 🔐 Any |
| POST | `/api/questions/:id/save` | Save/unsave question | 🔐 Any |
| GET | `/api/questions/saved/me` | My saved questions | 🔐 Any |

### Admin Routes
| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/admin/stats` | Dashboard stats | 🔐 Admin |
| GET | `/api/admin/questions` | All questions (with creator) | 🔐 Admin |
| POST | `/api/admin/questions` | Add question | 🔐 Admin |
| PUT | `/api/admin/questions/:id` | Edit question | 🔐 Admin |
| DELETE | `/api/admin/questions/:id` | Delete question | 🔐 Admin |
| GET | `/api/admin/users` | List all students | 🔐 Admin |
| PATCH | `/api/admin/users/:id/toggle` | Activate/deactivate user | 🔐 Admin |

### Notification Routes
| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/api/notifications` | Get all notifications | 🔐 Any |
| POST | `/api/notifications` | Send notification | 🔐 Admin |
| DELETE | `/api/notifications/:id` | Delete notification | 🔐 Admin |

---

## 🔒 How Authentication Works

1. User logs in → server returns a **JWT token**
2. Token is stored in **localStorage** on the browser
3. Every API request sends the token in the `Authorization: Bearer <token>` header
4. Middleware on the server verifies the token and attaches `req.user`
5. Admin routes additionally check `req.user.role === 'admin'`

---

## 📦 Sample API Requests (using curl)

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sppu.edu","password":"Admin@123"}'

# Add question (admin)
curl -X POST http://localhost:3000/api/admin/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"subject":"DBMS","topic":"Normalization","question":"Explain 3NF with example.","year":"2023","marks":5,"isImportant":true}'
```

---

## 🛠️ Customization Tips

- **Change port**: Set `PORT=5000` as env variable
- **Change JWT expiry**: Edit `expiresIn: '7d'` in `authRoutes.js`
- **Add subjects**: They auto-populate from questions in the DB
- **Add more roles**: Extend the `role` enum in `models/User.js`

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| `MongoDB connection failed` | Make sure `mongod` is running, or check Atlas URI |
| `Cannot find module 'express'` | Run `npm install` first |
| `Port 3000 already in use` | Run `PORT=4000 npm start` |
| Login says "Invalid email or password" | Use admin@sppu.edu / Admin@123 |
| White screen on dashboard | Check browser console for errors |

---

*Built with ❤️ for SPPU Engineering Students*
