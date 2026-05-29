# API Reference

All endpoints are prefixed with `/api`. Authentication is enforced via an HttpOnly cookie named `token` set during login or registration.

---

## Authentication

### POST /api/auth/register

Create a new user account.

**Rate limit:** 3 requests per hour per IP.

**Request body**

```json
{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "secret123"
}
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | 2–50 characters |
| `email` | string | Valid email format |
| `password` | string | Min 8 chars, must contain at least one letter and one number |

**Response `201`**

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

Sets `token` HttpOnly cookie (7-day expiry).

**Errors**

| Status | Reason |
|---|---|
| 400 | Validation failed or email already in use |
| 429 | Rate limit exceeded |

---

### POST /api/auth/login

Authenticate an existing user.

**Rate limit:** 5 requests per 15 minutes per IP.

**Request body**

```json
{
  "email": "alice@example.com",
  "password": "secret123"
}
```

**Response `200`**

```json
{
  "message": "Login successful",
  "user": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

Sets `token` HttpOnly cookie.

**Errors**

| Status | Reason |
|---|---|
| 400 | Missing fields |
| 401 | Invalid credentials |
| 429 | Rate limit exceeded |

---

### POST /api/auth/logout

Invalidate the current session.

**Auth required:** Yes.

**Response `200`**

```json
{ "message": "Logged out successfully" }
```

Clears the `token` cookie. Records `lastLogout` timestamp on the user so previously issued tokens for this session are rejected.

---

### GET /api/auth/me

Return the currently authenticated user.

**Auth required:** Yes.

**Response `200`**

```json
{
  "user": {
    "id": "64a1b2c3d4e5f6a7b8c9d0e1",
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

**Errors**

| Status | Reason |
|---|---|
| 401 | Not authenticated |

---

## Loans

A loan represents an ongoing financial relationship with one person — either money you gave them (`type: "given"`) or money you took from them (`type: "taken"`).

### GET /api/loans

Return all loans belonging to the authenticated user.

**Auth required:** Yes.

**Response `200`** — array of loan objects, each augmented with a `lastTransaction` field.

```json
[
  {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e2",
    "userId": "64a1b2c3d4e5f6a7b8c9d0e1",
    "personName": "Bob",
    "type": "given",
    "initialAmount": 0,
    "currentBalance": 5000,
    "currency": "BDT",
    "notes": "For emergency",
    "contactEmail": "bob@example.com",
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-03-20T14:30:00.000Z",
    "lastTransaction": {
      "type": "given",
      "amount": 2000,
      "transactionDate": "2024-03-20T14:30:00.000Z"
    }
  }
]
```

---

### POST /api/loans

Create a new loan.

**Auth required:** Yes.

**Request body**

```json
{
  "personName": "Bob",
  "type": "given",
  "currency": "BDT",
  "notes": "For emergency",
  "contactEmail": "bob@example.com"
}
```

| Field | Type | Rules |
|---|---|---|
| `personName` | string | Required, 1–100 characters |
| `type` | string | Required. `"given"` or `"taken"` |
| `currency` | string | Optional. `"BDT"` (default), `"USD"`, `"EUR"` |
| `notes` | string | Optional, max 500 characters |
| `contactEmail` | string | Optional, valid email. Used for transaction notifications |

**Response `201`** — the created loan object.

**Errors**

| Status | Reason |
|---|---|
| 400 | Validation failed |
| 401 | Not authenticated |

---

### GET /api/loans/:id

Return a single loan.

**Auth required:** Yes.

**Response `200`** — loan object (same shape as in GET /api/loans, without `lastTransaction`).

**Errors**

| Status | Reason |
|---|---|
| 404 | Loan not found or does not belong to user |

---

### PUT /api/loans/:id

Update a loan's metadata. The `type` field cannot be changed after creation.

**Auth required:** Yes.

**Request body** (all fields optional)

```json
{
  "personName": "Robert",
  "notes": "Updated notes",
  "currency": "USD",
  "contactEmail": "robert@example.com"
}
```

**Response `200`** — updated loan object.

---

### DELETE /api/loans/:id

Delete a loan and all its associated transactions.

**Auth required:** Yes.

**Response `200`**

```json
{ "message": "Loan and associated transactions deleted successfully" }
```

---

## Transactions

A transaction records a movement of money on a loan. The allowed transaction types depend on the parent loan's type:

| Loan type | Allowed transaction types |
|---|---|
| `given` | `given` (lend more), `paidBack` (they repaid you) |
| `taken` | `taken` (borrow more), `returned` (you repaid them) |

### GET /api/transactions/loan/:loanId

Return all transactions for a loan, sorted newest first.

**Auth required:** Yes.

**Response `200`** — array of transaction objects (max 200).

```json
[
  {
    "_id": "64a1b2c3d4e5f6a7b8c9d0e3",
    "userId": "64a1b2c3d4e5f6a7b8c9d0e1",
    "loanId": "64a1b2c3d4e5f6a7b8c9d0e2",
    "type": "given",
    "amount": 3000,
    "method": "Mobile Banking",
    "transactionDate": "2024-03-20T14:30:00.000Z",
    "notes": "First installment",
    "createdAt": "2024-03-20T14:30:00.000Z",
    "updatedAt": "2024-03-20T14:30:00.000Z"
  }
]
```

---

### POST /api/transactions

Record a new transaction. Atomically updates the loan's `currentBalance`.

**Auth required:** Yes.

**Request body**

```json
{
  "loanId": "64a1b2c3d4e5f6a7b8c9d0e2",
  "type": "given",
  "amount": 3000,
  "method": "Mobile Banking",
  "transactionDate": "2024-03-20",
  "notes": "First installment"
}
```

| Field | Type | Rules |
|---|---|---|
| `loanId` | string | Required, valid ObjectId |
| `type` | string | Required. Must be valid for the loan type (see table above) |
| `amount` | number | Required, positive, max 1,000,000,000 |
| `method` | string | Optional. `"Cash"` (default), `"Bank Transfer"`, `"Mobile Banking"`, `"Check"`, `"Other"` |
| `transactionDate` | string | Optional ISO date, defaults to now |
| `notes` | string | Optional, max 500 characters |

**Side effects**

- Loan `currentBalance` is updated atomically.
- A repayment (`paidBack` / `returned`) that would push balance below 0 is rejected.
- If the loan has a `contactEmail`, a notification email is sent asynchronously.

**Response `201`** — created transaction object.

**Errors**

| Status | Reason |
|---|---|
| 400 | Validation failed, invalid transaction type for loan, or balance would go negative |
| 404 | Loan not found |

---

### GET /api/transactions/:id

Return a single transaction.

**Auth required:** Yes.

**Response `200`** — transaction object.

---

### PUT /api/transactions/:id

Update a transaction. Recalculates the loan balance based on the delta.

**Auth required:** Yes.

**Request body** (all fields optional)

```json
{
  "amount": 3500,
  "method": "Bank Transfer",
  "notes": "Corrected amount"
}
```

**Response `200`** — updated transaction object.

---

### DELETE /api/transactions/:id

Delete a transaction and reverse its effect on the loan balance.

**Auth required:** Yes.

**Response `200`**

```json
{ "message": "Transaction deleted successfully" }
```

---

## Summary

### GET /api/summary/overview

Return aggregated financial statistics for the authenticated user.

**Auth required:** Yes.

**Response `200`**

```json
{
  "totalLent": 15000,
  "totalTaken": 8000,
  "netAmount": 7000,
  "totalLoans": 6,
  "activeLentLoans": 3,
  "activeTakenLoans": 2
}
```

| Field | Description |
|---|---|
| `totalLent` | Sum of `currentBalance` across all `given` loans |
| `totalTaken` | Sum of `currentBalance` across all `taken` loans |
| `netAmount` | `totalLent - totalTaken` |
| `totalLoans` | Total loan count |
| `activeLentLoans` | Count of `given` loans with `currentBalance > 0` |
| `activeTakenLoans` | Count of `taken` loans with `currentBalance > 0` |

---

## Error response shape

All error responses follow this structure:

```json
{
  "error": "Human-readable error message"
}
```

## Common HTTP status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (resource belongs to another user) |
| 404 | Not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
