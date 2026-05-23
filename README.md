# CreditFlow LMS — Backend

Express + TypeScript + MongoDB API for the Loan Management System.

## Tech stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (HS256) + bcrypt (10 rounds)
- **File uploads**: Multer (disk storage, 5 MB cap)

## Folder layout

```
backend/
├── src/
│   ├── config/db.ts              Mongoose connection
│   ├── models/
│   │   ├── User.ts               name, email, hashed password, role
│   │   ├── BorrowerProfile.ts    PAN, DOB, salary, employment, slip path
│   │   ├── Loan.ts               amount, tenure, status, audit fields
│   │   └── Payment.ts            UTR (unique), amount, recordedBy
│   ├── middleware/
│   │   ├── auth.ts               JWT verification
│   │   ├── rbac.ts               role guard (admin bypasses)
│   │   ├── upload.ts             multer config (PDF/JPG/PNG, ≤5 MB)
│   │   └── error.ts              404 + central error handler
│   ├── controllers/              auth, profile, loan, payment, dashboard
│   ├── routes/                   REST routes mounted under /api
│   ├── utils/
│   │   ├── bre.ts                Business Rule Engine
│   │   └── loanMath.ts           Simple-interest calculator + validators
│   ├── scripts/seed.ts           seeds one account per role
│   ├── types/index.ts            shared TS types
│   └── server.ts                 entry point
├── uploads/                      salary slips (gitignored)
├── .env.example
├── package.json
└── tsconfig.json
```

## Setup

### 1. Prerequisites

- Node.js 18+
- A MongoDB connection string (local server, Docker container, or Atlas)

### 2. Configure environment

```bash
cp .env.example .env
```

Then edit `.env`:

| Variable         | Purpose                                                      |
| ---------------- | ------------------------------------------------------------ |
| `PORT`           | HTTP port (default `5001`; avoid `5000` on macOS — AirPlay)  |
| `MONGO_URI`      | Mongo connection string (e.g. `mongodb+srv://...` for Atlas) |
| `JWT_SECRET`     | Long random string used to sign JWTs                         |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`)                                   |
| `CLIENT_ORIGIN`  | Frontend origin for CORS (default `http://localhost:3000`)   |
| `UPLOAD_DIR`     | Where salary slips are stored                                |

### 3. Install + seed + run

```bash
npm install
npm run seed       # creates one account per role
npm run dev        # http://localhost:5001
```

### 4. Production build

```bash
npm run build
npm start
```

## Seeded credentials

Running `npm run seed` (re-runnable; upserts) creates:

| Role         | Email                 | Password     |
| ------------ | --------------------- | ------------ |
| Admin        | admin@lms.test        | admin1234    |
| Sales        | sales@lms.test        | sales1234    |
| Sanction     | sanction@lms.test     | sanction1234 |
| Disbursement | disbursement@lms.test | disburse1234 |
| Collection   | collection@lms.test   | collect1234  |
| Borrower     | borrower@lms.test     | borrow1234   |

Borrower signups (`POST /api/auth/signup`) always get the `borrower` role.

## Business rules

### Business Rule Engine (`utils/bre.ts`)

Reject the application if **any** rule fails:

| Rule       | Reject when                                                  |
| ---------- | ------------------------------------------------------------ |
| Age        | Not between 23 and 50                                        |
| Salary     | Below ₹25,000 / month                                        |
| PAN        | Does not match `^[A-Z]{5}[0-9]{4}[A-Z]$`                     |
| Employment | Applicant is `unemployed`                                    |

BRE runs on the **server** (authoritative; returns HTTP 422 with reasons). The client also mirrors it for instant UX feedback but cannot bypass the server check.

### Loan math (`utils/loanMath.ts`)

Simple interest:

```
SI = (P × R × T) / (365 × 100)        # T in days
Total Repayment = P + SI
```

Defaults: rate = **12% p.a.**, amount ∈ [50,000, 500,000], tenure ∈ [30, 365] days.

### Status machine

```
applied ─┬─► sanctioned ─► disbursed ─► closed
         └─► rejected
```

| Transition          | Triggered by   |
| ------------------- | -------------- |
| → sanctioned        | Sanction role  |
| → rejected (reason) | Sanction role  |
| → disbursed         | Disbursement   |
| → closed            | Auto, when `amountPaid >= totalRepayment` |

### Payment rules

- `utrNumber` is unique across the whole `payments` collection (Mongo unique index).
- Amount must be `> 0` and `≤ outstanding balance` (`totalRepayment − amountPaid`).
- Loan must be in `disbursed` state to accept payments.

## REST API

Base URL: `http://localhost:5001/api`. Authenticated requests must send `Authorization: Bearer <token>`.

| Method | Path                                                  | Role(s)              |
| ------ | ----------------------------------------------------- | -------------------- |
| POST   | `/auth/signup`                                        | public               |
| POST   | `/auth/login`                                         | public               |
| GET    | `/auth/me`                                            | any authenticated    |
| GET    | `/profile/me`                                         | borrower             |
| PUT    | `/profile/me`                                         | borrower (runs BRE)  |
| POST   | `/profile/me/salary-slip` (multipart `file`)          | borrower             |
| GET    | `/loans/quote?amount=&tenureDays=`                    | borrower             |
| GET    | `/loans/mine`                                         | borrower             |
| POST   | `/loans`                                              | borrower             |
| GET    | `/dashboard/sales/leads`                              | sales / admin        |
| GET    | `/dashboard/sanction/loans`                           | sanction / admin     |
| POST   | `/dashboard/sanction/loans/:id/approve`               | sanction / admin     |
| POST   | `/dashboard/sanction/loans/:id/reject`                | sanction / admin     |
| GET    | `/dashboard/disbursement/loans`                       | disbursement / admin |
| POST   | `/dashboard/disbursement/loans/:id/disburse`          | disbursement / admin |
| GET    | `/dashboard/collection/loans`                         | collection / admin   |
| GET    | `/dashboard/collection/loans/:id/payments`            | collection / admin   |
| POST   | `/dashboard/collection/loans/:loanId/payments`        | collection / admin   |

### Status codes

| Code  | Meaning                                                  |
| ----- | -------------------------------------------------------- |
| `200` | OK                                                       |
| `201` | Resource created (signup, loan application, payment)     |
| `400` | Validation error / bad input / illegal state transition  |
| `401` | Missing / invalid token                                  |
| `403` | Authenticated but wrong role                             |
| `404` | Resource not found                                       |
| `409` | Conflict — duplicate email or UTR                        |
| `422` | BRE rejection (body includes `reasons[]`)                |
| `500` | Unhandled error                                          |

### Example: end-to-end with `curl`

```bash
# 1. Sign up borrower
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"name":"Demo","email":"demo@x.com","password":"demo1234"}' | jq -r .token)

# 2. Submit personal details (runs BRE)
curl -s -X PUT http://localhost:5001/api/profile/me \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"fullName":"Demo User","pan":"ABCDE1234F","dob":"1995-01-01",
       "monthlySalary":40000,"employmentMode":"salaried"}'

# 3. Upload salary slip
curl -s -X POST http://localhost:5001/api/profile/me/salary-slip \
  -H "Authorization: Bearer $TOKEN" -F file=@./payslip.pdf

# 4. Apply for a loan
curl -s -X POST http://localhost:5001/api/loans \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"amount":100000,"tenureDays":90}'
```

## Notes

- Tokens have a 7-day TTL by default. The frontend stores them in `localStorage`. For production prefer httpOnly cookies + CSRF protection.
- Uploaded files are served as static assets at `/uploads/<filename>`.
- BRE could be split client/server for UX vs. authority; this project does both — client for feedback, server is the source of truth.
# credit-sea-backend
