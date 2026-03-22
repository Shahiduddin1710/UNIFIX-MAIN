# UNIFIX — Campus Maintenance Portal

A production-ready React Native Expo app with Firebase Authentication and Firestore.

---

## 📁 Project Structure

```
unifix/
├── firebase/
│   └── firebaseConfig.ts          # Firebase initialization
└── frontend/
    ├── app/
    │   ├── _layout.tsx             # Root layout + auth state listener
    │   ├── index.tsx               # Dashboard (home screen)
    │   ├── login.tsx               # Login screen
    │   ├── signup.tsx              # Signup screen
    │   ├── complete-profile.tsx    # Profile completion (role-based)
    │   └── modal.tsx               # Modal screen
    ├── app.json                    # Expo config
    ├── babel.config.js
    ├── package.json
    └── tsconfig.json
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named **unifix**
3. Enable **Authentication → Email/Password**
4. Enable **Email Verification** (it's on by default)
5. Create a **Firestore Database** in production mode
6. Go to **Project Settings → General → Your apps → Add App (Web)**
7. Copy your config and paste it into `firebase/firebaseConfig.ts`:

```ts
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

### 3. Firestore Security Rules

In Firebase Console → Firestore → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 4. Run the App

```bash
npx expo start
```

Press `i` for iOS simulator, `a` for Android emulator, or scan the QR code with Expo Go.

---

## 🔐 Authentication Flow

### Signup
- Students & Teachers → must use `@vcet.edu.in` email
- Maintenance Staff → any email allowed
- Firebase email verification is sent after signup
- Firestore document created with `profileCompleted: false`

### Login
1. Validates email + password
2. Checks `emailVerified === true`
3. Reads Firestore user doc
4. If `profileCompleted === false` → `/complete-profile`
5. If `profileCompleted === true` → `/index` (dashboard)

### Forgot Password
- Uses Firebase `sendPasswordResetEmail()`
- Enter email in login screen, tap "Forgot Password?"

---

## 👤 Complete Profile Fields

| Role    | Fields                                      |
|---------|---------------------------------------------|
| Student | Year (1–4), Branch, Phone                   |
| Teacher | Department, Phone                           |
| Staff   | Employee ID, Designation, Phone             |

After staff submits profile:
- `profileCompleted = true`
- `status = "pending"`
- Shown a "Your account is under verification" screen

---

## 🗄️ Firestore User Document Structure

```
users/{uid}
  uid: string
  name: string
  email: string
  role: "student" | "teacher" | "staff"
  phone?: string
  year?: string                  // students only
  branch?: string                // students only
  department?: string            // teachers only
  employeeId?: string            // staff only
  designation?: string           // staff only
  profileCompleted: boolean
  status?: "pending" | "approved" // staff only
  createdAt: Timestamp
```

---

## 🎨 UI Design

- Background: `#F1F8F1` (light green tint)
- Primary: `#2E7D32` (deep green)
- Cards: White with soft shadow
- Rounded inputs (12px radius)
- Green CTA buttons
- Inline custom dropdowns (no native picker dependency)

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo-router` | File-based navigation |
| `firebase` | Auth + Firestore |
| `@react-native-async-storage/async-storage` | Auth persistence |

---

## ⚠️ Important Notes

1. **Firebase config**: Never commit real API keys to version control. Use environment variables in production.
2. **AsyncStorage**: Required for Firebase auth persistence in React Native.
3. **Email Verification**: Users must verify email before they can log in.
4. **Staff Approval**: Staff accounts require manual admin approval (status = "pending").