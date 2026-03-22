# 🔧 UNIFIX — Campus Complaint Management System

A mobile-based complaint management system for VCET college. Students and teachers can submit complaints, maintenance staff can accept and resolve them, and admins can manage the entire system.

---

## 📁 Project Structure

```
UNIFIX-MAIN/
├── frontend/        # React Native + Expo Router (Mobile App)
├── backend/         # Node.js + Express (REST API)
└── admin/           # React + Vite (Admin Web Panel)
```

---

## ⚙️ Prerequisites

Make sure you have these installed on your laptop:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18 or above | https://nodejs.org |
| npm | comes with Node.js | — |
| Git | latest | https://git-scm.com |
| Expo Go App | latest | Play Store / App Store |

---

## 🚀 Getting Started

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Shahiduddin1710/UNIFIX-MAIN.git
cd UNIFIX-MAIN
```

### Step 2 — Install all packages

Open **3 separate terminals** and run `npm install` in each folder:

```bash
# Terminal 1
cd frontend
npm install

# Terminal 2
cd backend
npm install

# Terminal 3
cd admin
npm install
```

---

## 🔁 Change the Backend IP Address

This is the **most important step**. You must update the IP address in these files:

```
frontend/app/index.tsx
frontend/app/staff-dashboard.tsx
frontend/app/submit-complaint.tsx
frontend/app/my-complaints.tsx
frontend/app/complete-profile.tsx
admin/src/pages/Login.jsx
admin/src/pages/Dashboard.jsx
admin/src/pages/StaffDetail.jsx
```

In each file, find this line:

```js
const BACKEND_URL = "http://YOUR_IP_ADDRESS:3000";
```

Replace `YOUR_IP_ADDRESS` with your actual laptop IP address:

```js
const BACKEND_URL = "http://192.168.1.XXX:3000";
```

> **How to find your IP address:**
> - Windows: Open CMD → type `ipconfig` → look for **IPv4 Address**
> - Make sure your phone and laptop are on the **same WiFi network**

> **Fastest way — change all files at once in VS Code:**
> Press `Ctrl + Shift + H` → Find: `YOUR_IP_ADDRESS` (whatever IP is currently in the files) → Replace with your IP → Click **Replace All** ✅

---

## 📱 Frontend Setup (React Native App)

```bash
cd frontend
npx expo start
```

Then scan the QR code with **Expo Go** app on your phone.

---


### Add Firebase Service Account

1. Go to **Firebase Console → Project Settings → Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file
4. Rename it to `serviceAccountKey.json`
5. Place it inside the `backend/` folder

### Run the Backend

```bash
cd backend
node server.js
```

You should see:
```
Server running on port 3000
Firebase connected ✅
```

---

## 🌐 Admin Panel Setup (React + Vite)

```bash
cd admin
npm run dev
```

---

## 🔥 Firebase Setup

This project uses Firebase. You need to create your own Firebase project OR get the config from the original developer.

### If setting up fresh:

1. Go to **https://firebase.google.com** and create a new project
2. Enable **Authentication** → Email/Password
3. Enable **Firestore Database**
4. Go to **Project Settings → General** → copy the Firebase config
5. Replace the config in `frontend/firebase/firebaseConfig.ts`

### Required Firestore Indexes

Create these composite indexes in Firebase Console → Firestore → Indexes:

| Collection | Fields | Order |
|------------|--------|-------|
| complaints | submittedBy (Asc), createdAt (Desc) | — |
| complaints | assignableTo (Array), status (Asc), createdAt (Desc) | — |
| complaints | assignedTo (Asc), createdAt (Desc) | — |

---

## 📧 Gmail Setup (for OTP emails)

1. Go to your Google Account → **Security → 2-Step Verification** → enable it
2. Then go to **App Passwords** → create a new app password
3. Copy the 16-character password
4. Paste it in `.env` as `EMAIL_PASSWORD`

---

## 👥 User Roles

| Role | Access |
|------|--------|
| `student` | Submit complaints, track status |
| `teacher` | Submit complaints, track status |
| `staff` | View assigned complaints, accept/reject/complete |
| `admin` | Approve/reject staff, view all complaints |

> **Note:** Staff accounts require admin approval before they can login.

---

## 🗂️ Running All 3 Together

Open **3 separate terminals**:

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
npx expo start

# Terminal 3 - Admin Panel
cd admin
npm run dev
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native, Expo Router |
| Backend | Node.js, Express.js |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Admin Panel | React, Vite |
| Email | Nodemailer + Gmail SMTP |

---

## 📞 Contact

For any issues, contact the developer:
**Shahiduddin** — shahiduddin153@gmail.com
