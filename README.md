# 🎓 Course Selling Platform (Backend)

A backend system for a course-selling platform with **authentication, email verification (OTP), admin course management, and user purchase flow**.

---

## 🚀 Features

* 🔐 JWT Authentication (User & Admin)
* 📧 Email Verification (6-digit OTP)
* 👨‍💼 Admin: Create & manage courses
* 👤 User: Signup, login, purchase courses
* 📚 Course preview & protected content

---

## 🛠 Tech Stack

* Node.js + Express
* MongoDB (Mongoose)
* JWT + bcrypt
* Zod validation
* Nodemailer (Gmail)

---

## ⚙️ Setup

```bash
git clone https://github.com/your-username/your-repo.git
cd backend
npm install
```

---

## 🔐 Environment Variables

Create `.env` inside backend:

```env
PORT=3005
MONGO_URI=your_mongodb_uri

JWT_SECRET_USER=your_secret
JWT_SECRET_ADMIN=your_secret

EMAIL_DEV_MODE=0
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_app_password
```

---

## ▶️ Run Server

```bash
npm run dev
```

Server runs on:

```
http://localhost:3005
```

---

## 📩 Email Setup

* Enable Gmail 2FA
* Generate App Password
* Use it as `EMAIL_PASS`

---

## 🔑 API Overview

### User

* POST `/api/v1/user/signup`
* POST `/api/v1/user/verify-email`
* POST `/api/v1/user/signin`

### Admin

* POST `/api/v1/admin/signup`
* POST `/api/v1/admin/signin`
* POST `/api/v1/admin/` (create course)

### Course

* GET `/api/v1/course/preview`
* POST `/api/v1/course/purchase`

---

## 🔒 Protected Routes

Add header:

```
token: YOUR_JWT_TOKEN
```

---

## 🚧 Status

✅ Backend complete
🚀 Frontend coming next

---

## ⭐ Author

Made with ❤️ by **Your Name**
