# UniFiX: Campus Complaint Management System

## Download the App

Visit our website to download the latest UniFiX APK:

🌐 **https://unifixapp.vercel.app**

> Download the Android APK directly from the website and start using UniFiX on your device.

---

> **Campus Care at Your Fingertips**
> A full-stack campus management system for handling complaints, maintenance workflows, escalations, and lost & found operations within a college environment.


## Features

### Authentication
- Firebase Authentication (Email/Password)
- OTP-based signup verification
- Password reset with OTP
- Secure token-based API access (Firebase ID token for mobile, JWT for admin panel)

### Complaint System
- Submit complaints with category, location, and optional photo
- Auto-assignment to available staff based on category
- Status tracking: `pending → assigned → in_progress → completed`
- Rejection system — staff can reject; complaint stays pending until all assigned staff reject
- Complaint rating system (disabled when admin resolves directly)
- Time restrictions: complaints can only be submitted between **8 AM – 8 PM IST**

### Escalation & Flagging
- Complaints auto-flagged when unresolved beyond category time limits:
  - Cleaning / Housekeeping / Washroom → **1 hour**
  - Electrical / Plumbing / Civil / Carpentry → **24 hours**
  - Technician / IT / Lab / Safety / Others → **2 hours**
- Flagged complaints trigger **admin push notification**
- After **20 minutes** of no action → **HOD escalation email** sent
- Admin can take ownership via "I Will Handle" → student notified
- Admin can resolve directly via "Mark as Resolved" → HOD resolution email + student notified
- Staff completing a flagged complaint → admin notified + HOD resolution email if previously escalated
- Escalation powered by **BullMQ + Redis** (not setTimeout)

### Lost & Found
- Post found items with image upload (Cloudinary)
- Categorization and descriptions
- Item feed for all users
- Lost report posting
- Handover and claim tracking

### Push Notifications (FCM)
- Complaint status updates → student notified
- New assignments → staff notified
- Escalation events → admin notified
- Notification tap deep-links to relevant screen/tab
- Stale FCM tokens automatically cleaned from Firestore on send failure

### Admin Panel (Web)
- Staff approval / rejection
- Complaint monitoring with flagged/HOD indicators
- Complaint detail modal with full reporter info, progress tracker, assignment
- ID card request management
- Account deletion handling
- Security issue resolution
- Flagged complaints section
- History and overview dashboards

### Performance & Stability
- Student complaint list, Lost & Found feed, and claims use REST (not real-time)
- `hasFetchedRef` guard prevents repeated Firestore reads on Firebase auth token refresh (~every 60 min)
- Global skeleton loading system with per-screen skeleton types (dashboard, task, list)
- Minimum 300ms skeleton display to prevent flicker
- Redis error spam suppressed for `ECONNRESET` / `ENOTFOUND`

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Mobile App   | React Native (Expo), TypeScript     |
| Backend      | Node.js, Express                    |
| Database     | Firebase Firestore                  |
| Auth         | Firebase Authentication + JWT (admin) |
| Admin Panel  | React.js (Vite)                     |
| Image Upload | Cloudinary                          |
| Email        | Nodemailer (Gmail SMTP)             |
| Push Notifications | Expo FCM                      |
| Job Queue    | BullMQ + Redis                      |
| State (Mobile) | Zustand                           |

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
        ↓
   BullMQ + Redis (Escalation Jobs)
        ↓
   Nodemailer (HOD / Resolution Emails)
```

---

## Roles

| Role    | Access                          |
|---------|---------------------------------|
| student | Submit & track complaints, Lost & Found |
| teacher | Submit & track complaints, Lost & Found |
| staff   | Manage assigned complaints, Lost & Found posts |
| admin   | Full system control (web panel) |

---

### Student App

<p align="center">
  <img src="assets/student.jpeg" height="400" />
  &nbsp;&nbsp;&nbsp;
  <img src="assets/complaint.jpeg" height="400" />
  &nbsp;&nbsp;&nbsp;
  <img src="assets/tracking.jpeg" height="400" />
</p>
<p align="center">
  <img src="assets/lost.jpeg" height="400" />
  &nbsp;&nbsp;&nbsp;
  <img src="assets/found.jpeg" height="400" />
  &nbsp;&nbsp;&nbsp;
  <img src="assets/claims.jpeg" height="400" />
</p>

### Admin Panel

<p align="center">
  <img src="assets/admin.png" width="80%" />
</p>
<p align="center">
  <img src="assets/admincomplaint.png" width="80%" />
</p>

## Author

**Shahiduddin**
Email: shahiduddin153@gmail.com

---

*Built for Vidyavardhini's College of Engineering & Technology (VCET)*
