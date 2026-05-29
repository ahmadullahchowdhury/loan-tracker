# Database

The application uses MongoDB with Mongoose as the ODM. All models are in `src/lib/models/`.

---

## Connection

**File:** `src/lib/mongoose.js`

Connections are cached on the Node.js global object to prevent connection pool exhaustion in serverless/edge environments where the module is re-imported on every cold start.

```js
// The connection is reused if already established
global._mongooseCache = global._mongooseCache || { conn: null, promise: null }
```

**Connection settings:**
- `maxPoolSize: 10`

---

## Models

### User

**File:** `src/lib/models/User.js`  
**Collection:** `users`

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | String | Yes | Trimmed, 2–50 characters |
| `email` | String | Yes | Unique, lowercase, regex-validated |
| `password` | String | Yes | Stored as bcrypt hash |
| `lastLogout` | Date | No | Set on logout; used to invalidate older JWTs |
| `createdAt` | Date | Auto | Mongoose timestamps |
| `updatedAt` | Date | Auto | Mongoose timestamps |

**Indexes:** Unique index on `email` (defined via `unique: true` in schema).

**Notes:**
- The `password` field is never returned in API responses — it is selected with `+password` only during authentication.
- `lastLogout` being `null` (never logged out) means all issued tokens for that user are still valid.

---

### Loan

**File:** `src/lib/models/Loan.js`  
**Collection:** `loans`

| Field | Type | Required | Rules |
|---|---|---|---|
| `userId` | ObjectId | Yes | Ref to `User` |
| `personName` | String | Yes | Trimmed |
| `type` | String | Yes | Enum: `"given"`, `"taken"` |
| `initialAmount` | Number | No | Default `0`, min `0` |
| `currentBalance` | Number | No | Default `0`, min `0` — maintained automatically |
| `currency` | String | No | Enum: `"BDT"` (default), `"USD"`, `"EUR"` |
| `notes` | String | No | Max 500 characters |
| `contactEmail` | String | No | Valid email; used for transaction notification emails |
| `createdAt` | Date | Auto | Mongoose timestamps |
| `updatedAt` | Date | Auto | Mongoose timestamps |

**Indexes:**

```js
{ userId: 1, personName: 1, type: 1 }
```

Supports efficient per-user loan lookups and sorting by name/type.

**Balance invariant:**  
`currentBalance` is always `>= 0`. The API enforces this atomically using a `$gte` filter on update operations (see [ARCHITECTURE.md](ARCHITECTURE.md#balance-calculation)).

**Loan types:**

| Type | Meaning | Balance represents |
|---|---|---|
| `given` | You lent money | How much they still owe you |
| `taken` | You borrowed money | How much you still owe them |

---

### Transaction

**File:** `src/lib/models/Transaction.js`  
**Collection:** `transactions`

| Field | Type | Required | Rules |
|---|---|---|---|
| `userId` | ObjectId | Yes | Ref to `User` |
| `loanId` | ObjectId | Yes | Ref to `Loan` |
| `type` | String | Yes | Enum: `"given"`, `"paidBack"`, `"taken"`, `"returned"` |
| `amount` | Number | Yes | Min `0` |
| `method` | String | No | Enum: `"Cash"` (default), `"Bank Transfer"`, `"Mobile Banking"`, `"Check"`, `"Other"` |
| `transactionDate` | Date | No | Default: current time |
| `notes` | String | No | Max 500 characters |
| `createdAt` | Date | Auto | Mongoose timestamps |
| `updatedAt` | Date | Auto | Mongoose timestamps |

**Indexes:**

```js
{ userId: 1, loanId: 1, transactionDate: -1 }
```

Supports efficient per-loan transaction history sorted by date descending.

**Transaction type semantics:**

| Transaction type | Applies to loan type | Effect on `currentBalance` |
|---|---|---|
| `given` | `given` | `+amount` (you lent more) |
| `paidBack` | `given` | `-amount` (they repaid you) |
| `taken` | `taken` | `+amount` (you borrowed more) |
| `returned` | `taken` | `-amount` (you repaid them) |

---

## Relationships and Cascades

```
User (1)
 └── Loan (N)   ← userId
       └── Transaction (N)   ← loanId + userId
```

Cascading deletes are handled in application code (not MongoDB):

- `DELETE /api/loans/:id` → deletes the loan **and** all transactions where `loanId` matches.
- There is no automatic cascade at the database level.

---

## Common Queries

**All loans for a user with last transaction:**

```js
Loan.aggregate([
  { $match: { userId: new ObjectId(userId) } },
  {
    $lookup: {
      from: 'transactions',
      let: { loanId: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$loanId', '$$loanId'] } } },
        { $sort: { transactionDate: -1 } },
        { $limit: 1 }
      ],
      as: 'lastTransaction'
    }
  },
  { $addFields: { lastTransaction: { $arrayElemAt: ['$lastTransaction', 0] } } }
])
```

**Summary overview:**

```js
Loan.aggregate([
  { $match: { userId: new ObjectId(userId) } },
  {
    $group: {
      _id: null,
      totalLent: { $sum: { $cond: [{ $eq: ['$type', 'given'] }, '$currentBalance', 0] } },
      totalTaken: { $sum: { $cond: [{ $eq: ['$type', 'taken'] }, '$currentBalance', 0] } },
      totalLoans: { $sum: 1 },
      activeLentLoans: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'given'] }, { $gt: ['$currentBalance', 0] }] }, 1, 0] } },
      activeTakenLoans: { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'taken'] }, { $gt: ['$currentBalance', 0] }] }, 1, 0] } }
    }
  }
])
```

---

## Setup

No migration scripts are needed — Mongoose creates collections and indexes automatically on first use. Just provide a valid `MONGODB_URI` in your environment and start the app.

For production, use a dedicated database with authentication:

```
mongodb+srv://<user>:<password>@cluster.xxxxx.mongodb.net/loan-tracker?retryWrites=true&w=majority
```
