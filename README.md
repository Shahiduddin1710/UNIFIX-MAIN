# UNIFIX — Campus Complaint Management System

A full-stack campus management system for handling complaints, maintenance workflows, and lost & found operations within a college environment.

---

## Project Structure

```
UNIFIX-MAIN/
├── frontend/        # React Native (Expo) Mobile App
│   ├── app/
│   ├── components/
│   ├── constants/
│   ├── firebase/
│   ├── hooks/
│   ├── services/
│   └── assets/
│
├── backend/         # Node.js + Express API
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── validators/
│   └── server.js
│
├── admin/           # React Admin Panel
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   └── components/
│   └── .env
│
└── README.md
```

---

## Features

### Authentication

* Firebase Authentication (Email/Password)
* OTP-based signup verification
* Password reset with OTP
* Secure token-based API access

### Complaint System

* Submit complaints with category and location
* Auto-assignment to staff
* Status tracking (pending, active, completed, rejected)
* Complaint rating system

### Lost & Found

* Post found items with image upload (Cloudinary)
* Categorization and descriptions
* Item feed for all users
* Handover tracking

### Admin Panel

* JWT-based admin authentication
* Staff approval/rejection
* Complaint monitoring
* ID card request management
* Account deletion handling
* Security issue resolution

### Security

* Firebase Admin SDK (backend verification)
* Rate limiting (API protection)
* Input validation (express-validator)
* Centralized error handling

---

## Tech Stack

| Layer        | Technology                      |
| ------------ | ------------------------------- |
| Mobile App   | React Native (Expo), TypeScript |
| Backend      | Node.js, Express                |
| Database     | Firebase Firestore              |
| Auth         | Firebase Authentication         |
| Admin Panel  | React                           |
| Image Upload | Cloudinary                      |
| Email        | Nodemailer (Gmail SMTP)         |

---

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/Shahiduddin1710/UNIFIX-MAIN.git
cd UNIFIX-MAIN
```

---

### 2. Install Dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
cd ../admin && npm install
```

---

### 3. Environment Variables

#### Frontend (.env)

```env
EXPO_PUBLIC_BASE_URL=http://YOUR_IP:3000
```

---

#### Admin (.env)

```env
REACT_APP_API_URL=http://YOUR_IP:3000
```

---

#### Backend (.env)

```env
PORT=3000

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

FIREBASE_DATABASE_URL=your_database_url
FIREBASE_STORAGE_BUCKET=your_bucket_url

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_UPLOAD_PRESET=your_upload_preset
```

---

## Firebase Setup

1. Create Firebase project
2. Enable:

   * Authentication (Email/Password)
   * Firestore Database
3. Generate Service Account Key
4. Place file in:

```
backend/serviceAccountKey.json
```

---

## Run the Project

### Backend

```bash
cd backend
node server.js
```

---

### Frontend

```bash
cd frontend
npx expo start --clear
```

---

### Admin Panel

```bash
cd admin
npm run dev
```

---

## Important Notes

* Ensure mobile and backend are on the same network
* Update IP address in `.env` when WiFi changes
* Restart Expo after changing `.env`

---

## API Flow

```
Mobile App / Admin Panel
        ↓
   API Layer (fetch / axios)
        ↓
   Express Routes
        ↓
   Controllers
        ↓
   Firebase (Auth + Firestore)
```

---

## Roles

| Role    | Access                     |
| ------- | -------------------------- |
| student | Submit & track complaints  |
| teacher | Submit & track complaints  |
| staff   | Manage assigned complaints |
| admin   | Full system control        |

---

## Author

Shahiduddin
Email: [shahiduddin153@gmail.com](mailto:shahiduddin153@gmail.com)
