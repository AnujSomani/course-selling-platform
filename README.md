# Upskilio — Full Stack Course Selling Platform

A production-ready course marketplace built with the MERN stack. Instructors can create and publish courses with video/PDF content. Learners browse, purchase, and stream content securely.

---

## Features

**For Learners**
- Browse and search courses by category and difficulty level
- Secure checkout via Razorpay
- Stream purchased video lessons through CloudFront signed URLs
- View and download PDF resources
- Email verification on signup
- Personal dashboard with purchase history

**For Instructors (Admin)**
- Full course management — create, edit, delete courses
- Content studio — upload videos and PDFs directly to S3
- Mark individual lessons as free previews
- Real-time upload progress with direct-to-S3 presigned URL flow
- Dashboard with course analytics (learners, catalog value, content mix)

**Platform**
- JWT authentication with separate user and admin tokens
- Rate limiting on auth routes
- Razorpay webhook for reliable payment confirmation
- CloudFront signed URLs (2-hour expiry) for video/PDF access control
- Responsive design — works on mobile, tablet, and desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Auth | JWT (jsonwebtoken), bcrypt |
| Payments | Razorpay |
| File Storage | AWS S3 (presigned URLs) |
| Video Delivery | AWS CloudFront (signed URLs) |
| Email | Nodemailer (Gmail) |
| Validation | Zod |

---

## Project Structure

```
upskilio/
├── backend/
│   ├── config/
│   │   ├── razorpay.js        # Razorpay client
│   │   └── s3.js              # AWS S3 client
│   ├── middlewares/
│   │   ├── admin.js           # Admin JWT middleware
│   │   ├── user.js            # User JWT middleware
│   │   └── rateLimiter.js     # Express rate limiting
│   ├── routes/
│   │   ├── admin.js           # Admin auth + course CRUD
│   │   ├── user.js            # User auth + purchases
│   │   ├── course.js          # Public course routes
│   │   ├── payment.js         # Razorpay order + webhook
│   │   ├── upload.js          # S3 presigned URL generation
│   │   └── stream.js          # CloudFront signed streaming URLs
│   ├── db.js                  # Mongoose models
│   ├── validation.js          # Zod schemas
│   ├── emailVerification.js   # OTP email logic
│   ├── config.js              # JWT secrets
│   └── index.js               # Express app entry
│
└── frontend/
    └── src/
        ├── api/               # Axios instance + interceptors
        ├── components/        # Reusable UI components
        ├── context/           # AuthContext (JWT + user state)
        ├── hooks/             # useRazorpay (SDK loader)
        ├── pages/             # Route-level page components
        └── constants/         # Category definitions
```

---

## Local Setup

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- AWS account (S3 bucket + CloudFront distribution + IAM user)
- Razorpay account (test mode is fine)
- Gmail account with an [App Password](https://support.google.com/accounts/answer/185833)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/upskilio.git
cd upskilio
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=3005
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/upskilio

# JWT
JWT_SECRET_USER=your_long_random_user_secret
JWT_SECRET_ADMIN=your_long_random_admin_secret

# Email (Gmail App Password)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_gmail_app_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# AWS S3
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_iam_access_key_id
AWS_SECRET_ACCESS_KEY=your_iam_secret_access_key
AWS_S3_BUCKET_NAME=your-s3-bucket-name

# AWS CloudFront
CLOUDFRONT_DOMAIN=d1234abcdef.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=APKAXXXXXXXXXXX
# Store private key as single line with \n for newlines
CLOUDFRONT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END RSA PRIVATE KEY-----"
```

Start the backend:

```bash
npm run dev     # development (nodemon)
npm start       # production
```

The server starts on `http://localhost:3005`.

---

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:3005/api/v1
```

Start the frontend:

```bash
npm run dev
```

The app opens at `http://localhost:5173`.

---

### 4. AWS S3 — CORS configuration

Your S3 bucket needs a CORS policy so the browser can PUT files directly from the uploader. Go to **S3 → your bucket → Permissions → Cross-origin resource sharing (CORS)** and paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": ["http://localhost:5173"],
    "ExposeHeaders": []
  }
]
```

For production, replace the origin with your deployed frontend URL.

---

### 5. AWS IAM — required permissions

The IAM user behind your credentials needs this policy on your bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

---

### 6. Razorpay webhook (optional for local dev)

For local development, payment completion is handled by the client-side `/payment/verify` route. In production, configure a webhook in the Razorpay Dashboard pointing to `https://yourdomain.com/api/v1/payment/webhook` and copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET`.

---

## API Overview

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/user/signup` | — | Register learner |
| POST | `/api/v1/user/signin` | — | Login learner |
| POST | `/api/v1/user/verify-email` | — | Verify OTP |
| GET | `/api/v1/user/purchases` | User | Get purchased courses |
| GET | `/api/v1/user/courses/:id/content` | User | Get course lessons |
| POST | `/api/v1/admin/signup` | — | Register instructor |
| POST | `/api/v1/admin/signin` | — | Login instructor |
| GET | `/api/v1/admin/bulk` | Admin | Get my courses |
| POST | `/api/v1/admin/courses` | Admin | Create course |
| PUT | `/api/v1/admin/courses` | Admin | Update course |
| DELETE | `/api/v1/admin/courses/:id` | Admin | Delete course |
| POST | `/api/v1/admin/courses/:id/content` | Admin | Add lesson |
| GET | `/api/v1/course/preview` | — | List all courses |
| GET | `/api/v1/course/:id/content/preview` | — | Free preview lessons |
| POST | `/api/v1/payment/create-order` | User | Create Razorpay order |
| POST | `/api/v1/payment/verify` | User | Verify payment |
| POST | `/api/v1/payment/webhook` | — | Razorpay webhook |
| GET | `/api/v1/upload/presigned-url` | Admin | Get S3 upload URL |
| GET | `/api/v1/stream/url/:contentId` | User | Get CloudFront stream URL |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3005) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET_USER` | Yes | Secret for user JWTs |
| `JWT_SECRET_ADMIN` | Yes | Secret for admin JWTs |
| `EMAIL_USER` | Yes | Gmail address for sending OTPs |
| `EMAIL_PASS` | Yes | Gmail App Password |
| `FRONTEND_URL` | Yes | Frontend origin for CORS |
| `RAZORPAY_KEY_ID` | Yes | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Razorpay webhook secret |
| `AWS_REGION` | Yes | AWS region (e.g. `ap-south-1`) |
| `AWS_ACCESS_KEY_ID` | Yes | IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | IAM secret access key |
| `AWS_S3_BUCKET_NAME` | Yes | S3 bucket name |
| `CLOUDFRONT_DOMAIN` | Yes | CloudFront domain (no https://) |
| `CLOUDFRONT_KEY_PAIR_ID` | Yes | CloudFront key pair ID |
| `CLOUDFRONT_PRIVATE_KEY` | Yes | RSA private key (single line, `\n` escaped) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Backend API base URL (default: `http://localhost:3005/api/v1`) |

---

## Scripts

### Backend
```bash
npm run dev     # Start with nodemon (hot reload)
npm start       # Start with node
```

### Frontend
```bash
npm run dev     # Vite dev server
npm run build   # Production build → dist/
npm run preview # Preview production build
npm run lint    # ESLint
```

---

## License

MIT
