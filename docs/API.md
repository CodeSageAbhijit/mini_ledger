# MiniLedger REST API Specification

Base URL: `http://localhost:4000/api/v1`

All responses are JSON. Monetary values are strictly in **integer paise** (₹1 = 100 paise).

---

## 1. Public Authentication Endpoints

### 1.1 Request WhatsApp OTP
`POST /auth/otp/request`

Sends a 6-digit verification code to the specified phone number.

**Headers:** `Content-Type: application/json`

**Request:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

**Success Response (202 Accepted):**
```json
{
  "expiresInSeconds": 300,
  "resendAfterSeconds": 30
}
```

---

### 1.2 Verify OTP & Login
`POST /auth/otp/verify`

Verifies the 6-digit OTP code, creates the user if they don't exist, and returns JWT access + refresh tokens.

**Request:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210", "code": "123456"}'
```

**Success Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1Ni...",
  "refreshToken": "4a7b9c...",
  "user": {
    "id": "1075d848-8c57-4e81-8651-c9955251862b",
    "phone": "+919876543210",
    "name": "Rahul Sharma"
  }
}
```

---

### 1.3 Rotate Refresh Token
`POST /auth/refresh`

Rotates the refresh token (revokes old token, issues new token pair).

**Request:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "4a7b9c..."}'
```

---

### 1.4 Logout
`POST /auth/logout`

Revokes the refresh token.

**Request:**
```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "4a7b9c..."}'
```

---

## 2. Protected Endpoints (Require `Authorization: Bearer <accessToken>`)

### 2.1 Get Current User Profile
`GET /me`

```bash
curl -X GET http://localhost:4000/api/v1/me \
  -H "Authorization: Bearer <accessToken>"
```

---

### 2.2 Create Loan Entry
`POST /loans`

Records money lent to a friend.

**Request:**
```bash
curl -X POST http://localhost:4000/api/v1/loans \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "friendName": "Amit Verma",
    "amountPaise": 500000,
    "dueDate": "2026-11-15",
    "note": "Weekend trip flight booking"
  }'
```

**Success Response (201 Created):**
```json
{
  "id": "76ec2da1-4475-4fc1-a9aa-fce9147ebbe8",
  "friendName": "Amit Verma",
  "amountPaise": 500000,
  "currency": "INR",
  "note": "Weekend trip flight booking",
  "dueDate": "2026-11-15",
  "status": "PENDING",
  "repaidAt": null,
  "isOverdue": false,
  "daysOverdue": 0,
  "receiptCount": 0,
  "createdAt": "2026-10-22T14:20:00.000Z"
}
```

---

### 2.3 List Loans
`GET /loans?filter=all|pending|overdue|repaid&limit=50&cursor=<uuid>`

Returns loans sorted with overdue entries first, then by due date ascending.

```bash
curl -X GET "http://localhost:4000/api/v1/loans?filter=pending" \
  -H "Authorization: Bearer <accessToken>"
```

---

### 2.4 Mark Loan as Repaid
`PATCH /loans/:id/repay`

Marks loan as repaid. Returns 409 if already repaid.

```bash
curl -X PATCH http://localhost:4000/api/v1/loans/<loanId>/repay \
  -H "Authorization: Bearer <accessToken>"
```

---

### 2.5 Attach Receipt Photo
`POST /loans/:id/receipt`

Uploads an image receipt (JPEG, PNG, WebP ≤ 5MB) linked to a loan.

```bash
curl -X POST http://localhost:4000/api/v1/loans/<loanId>/receipt \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@/path/to/bill.jpg"
```

---

### 2.6 Get Summary Metrics
`GET /summary`

Returns dynamically calculated totals and status counts.

```bash
curl -X GET http://localhost:4000/api/v1/summary \
  -H "Authorization: Bearer <accessToken>"
```

**Response (200 OK):**
```json
{
  "totalLentPaise": 4500000,
  "totalRepaidPaise": 1450000,
  "outstandingPaise": 3050000,
  "overduePaise": 1950000,
  "counts": {
    "total": 8,
    "pending": 6,
    "repaid": 2,
    "overdue": 3
  }
}
```

---

### 2.7 Health Check
`GET /health`

```bash
curl -X GET http://localhost:4000/health
```
```json
{
  "status": "ok",
  "db": "up"
}
```
