# Architecture

## Overview

Loan Tracker is a full-stack Next.js application using the App Router. The frontend and backend run in the same process — React Server Components handle rendering while Route Handlers (`app/api/**`) serve as the REST API. MongoDB is the only external data store.

```
Browser
  │
  │  HTTP (cookie auth)
  ▼
Next.js App (Node.js)
  ├── Middleware          ← route protection, redirect logic
  ├── React pages/layouts ← client-side UI (React Query, Context)
  └── Route Handlers      ← REST API, JWT verification, DB access
          │
          ▼
       MongoDB
```

---

## Request Lifecycle

### Authenticated page load

```
1. Browser → Next.js middleware
2. Middleware reads `token` cookie
   ├── Missing/invalid → redirect to /login
   └── Present → pass through to page
3. Page renders (server)
4. Client hydrates; AuthContext calls GET /api/auth/me
5. React Query fetches page data (loans, transactions, summary)
```

### API request

```
1. Client calls e.g. POST /api/transactions (axios, withCredentials)
2. Route Handler: verifyAuth(request)
   ├── Decode JWT → extract userId
   ├── Load user from DB → check lastLogout (token invalidation)
   └── Return user or 401 response
3. Validate request body
4. Business logic + DB write
5. Side effects (email, cache invalidation)
6. Return JSON response
```

---

## Authentication Flow

```
Register / Login
      │
      ▼
  bcrypt.compare / bcrypt.hash
      │
      ▼
  generateToken(userId)   ←  JWT, 7-day expiry, signed with JWT_SECRET
      │
      ▼
  setAuthCookie(response) ←  HttpOnly, SameSite=Strict, Secure (prod)
      │
      ▼
  AuthContext.user updated (via /api/auth/me response)
```

**Token invalidation on logout:**

The `User` document stores a `lastLogout` timestamp. `verifyAuth` rejects any token whose `iat` (issued-at) is before `lastLogout`. This means all tokens issued before the last logout are immediately invalid — no token blacklist needed.

---

## Data Model Relationships

```
User
 └─── Loan (userId FK)
        └─── Transaction (userId FK, loanId FK)
```

- Deleting a Loan cascades: all Transactions for that loan are deleted in the same API call.
- `userId` is stored on Transaction as well as Loan, allowing direct user-scoped queries without a join.

### Balance calculation

`Loan.currentBalance` is maintained as a running total — it is **not** recalculated from scratch on every read. Transactions mutate it atomically:

```
POST /api/transactions
  → MongoDB findOneAndUpdate with:
      $inc: { currentBalance: +amount }   (for "given" / "taken")
      $inc: { currentBalance: -amount }   (for "paidBack" / "returned")
      filter: { currentBalance: { $gte: amount } }  ← prevents negative balance
```

On transaction update or delete, the delta is computed and applied the same way.

---

## Frontend Architecture

### State layers

| Layer | Tool | What lives here |
|---|---|---|
| Server state | React Query | Loans, transactions, summary — fetched from API |
| Auth state | React Context (AuthContext) | `user`, `isAuthenticated`, `login/logout` helpers |
| Form state | React Hook Form | Form values, validation errors |
| UI state | Local `useState` | Modal open/close, loading flags |

### Data fetching strategy

React Query is configured with `staleTime: 0` and `refetchOnMount: true`. This means every component mount triggers a fresh API call — intentional for a financial app where stale balances could be confusing. Cache invalidation is done manually with `queryClient.invalidateQueries()` after mutations.

### Component hierarchy

```
Providers (QueryClient + AuthContext)
└── RootLayout
    ├── /login  → LoginForm
    ├── /register → RegisterForm
    └── (app)/layout  → Navigation + auth guard
        ├── /dashboard → Dashboard
        ├── /money-lent → MoneyLentSection
        │     └── PersonTransactionDetails (when a row is selected)
        └── /money-borrowed → MoneyBorrowedSection
              └── PersonTransactionDetails (when a row is selected)
```

Modals (`LoanForm`, `TransactionForm`) are rendered inside their parent sections and controlled by local state.

---

## Security Architecture

### Defense in depth

```
Layer 1: Middleware
  - Rejects unauthenticated requests to protected routes before they reach any handler

Layer 2: verifyAuth() in every Route Handler
  - Validates JWT signature
  - Checks token age against lastLogout
  - Returns the authenticated user object

Layer 3: User-scoped DB queries
  - Every query includes { userId } filter
  - A user cannot read or modify another user's data even with a valid token

Layer 4: Input validation
  - Every Route Handler validates and sanitizes all input fields before touching the DB

Layer 5: Mongoose schema validation
  - A last line of defense at the model level
```

### Rate limiting

Implemented in-memory (`src/lib/rateLimit.js`). Keys are per-IP.

| Endpoint | Limit |
|---|---|
| POST /api/auth/login | 5 per 15 minutes |
| POST /api/auth/register | 3 per hour |

> **Note:** In-memory rate limiting resets on server restart and does not work across multiple Node.js instances. For production at scale, replace with a Redis-backed solution.

### Security headers

Configured in `next.config.js`:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## Email Notifications

```
POST /api/transactions (success)
  │
  └─ loan.contactEmail exists?
       ├── No  → skip
       └── Yes → sendTransactionNotification() [fire-and-forget, does not block response]
                   │
                   └─ Resend API → HTML email to contactEmail
```

Failures in email sending are caught and logged but do not fail the transaction.

---

## File Organization Conventions

- `src/app/api/**/route.js` — Route Handlers (API endpoints)
- `src/app/(app)/**/page.jsx` — Authenticated pages (grouped layout)
- `src/components/ui/` — Radix UI primitives (never import business logic)
- `src/components/*.jsx` — Feature components (import from `ui/` and `lib/`)
- `src/lib/` — Pure utilities and server-side helpers
- `src/lib/models/` — Mongoose schemas
- `src/contexts/` — React Context providers
- `src/providers/` — Top-level provider wrappers
