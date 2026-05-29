# Loan Tracker

A full-stack web application for tracking personal loans — money you've lent to others and money you've borrowed. Built with Next.js 15, MongoDB, and JWT authentication.

## Features

- **Authentication** — Register, login, and logout with secure JWT cookies. Rate-limited to prevent abuse.
- **Money Lent** — Track loans you've given out. Record partial repayments and view running balances.
- **Money Borrowed** — Track loans you've taken. Record payments you've made back.
- **Transaction History** — Full audit trail for every loan with amounts, dates, payment methods, and notes.
- **Dashboard** — Overview of total lent, total borrowed, net position, and active loan counts.
- **Email Notifications** — Automatic email to a contact address whenever a transaction is recorded.
- **Multi-currency** — Supports BDT, USD, and EUR.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | JavaScript (JSX) |
| Database | MongoDB via Mongoose |
| Auth | JWT + HttpOnly cookies |
| UI | Radix UI + Tailwind CSS v4 |
| Data fetching | TanStack React Query v5 |
| Forms | React Hook Form + Zod |
| Email | Resend |
| Icons | Lucide React |

## Quick Start

### Prerequisites

- Node.js 20+
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Resend](https://resend.com) account for email (optional)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd loan-tracker
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

See [.env.example](.env.example) for all required variables.

### 3. Run in development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

### 4. Build for production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── (app)/                    # Authenticated route group
│   │   ├── dashboard/            # Dashboard page
│   │   ├── money-lent/           # Loans you've given
│   │   ├── money-borrowed/       # Loans you've taken
│   │   └── layout.jsx            # Shared nav layout
│   ├── api/
│   │   ├── auth/                 # register, login, logout, me
│   │   ├── loans/                # CRUD for loans
│   │   ├── transactions/         # CRUD for transactions
│   │   └── summary/overview      # Dashboard aggregation
│   ├── login/
│   ├── register/
│   └── layout.jsx
├── components/
│   ├── auth/                     # LoginForm, RegisterForm
│   ├── ui/                       # Radix-based UI primitives
│   ├── Dashboard.jsx
│   ├── LoanForm.jsx
│   ├── MoneyLentSection.jsx
│   ├── MoneyBorrowedSection.jsx
│   ├── PersonTransactionDetails.jsx
│   ├── TransactionForm.jsx
│   └── Navigation.jsx
├── contexts/
│   └── AuthContext.jsx           # Global auth state
├── lib/
│   ├── models/                   # Mongoose models
│   │   ├── User.js
│   │   ├── Loan.js
│   │   └── Transaction.js
│   ├── api.js                    # Axios client
│   ├── auth.js                   # JWT helpers
│   ├── email.js                  # Resend integration
│   ├── mongoose.js               # DB connection
│   ├── rateLimit.js              # In-memory rate limiter
│   └── utils.js
├── middleware.js                 # Route protection
└── providers/
    └── Providers.jsx             # QueryClient + AuthContext
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs (min 32 chars) |
| `RESEND_API_KEY` | No | Resend API key for email notifications |
| `FROM_EMAIL` | No | Sender address for notification emails |
| `NEXT_PUBLIC_APP_URL` | No | Public URL (used in email links) |

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production configuration guidance.

## Documentation

| Document | Description |
|---|---|
| [docs/API.md](docs/API.md) | Complete REST API reference |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema definitions and indexes |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploying to production |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |

## Security

- Passwords hashed with bcryptjs (12 salt rounds)
- JWT stored in HttpOnly, SameSite=Strict cookies — not accessible to JavaScript
- Token invalidation on logout via `lastLogout` timestamp check
- Rate limiting: 5 login attempts per 15 min, 3 registrations per hour (per IP)
- All API routes validate and sanitize input before touching the database
- Users can only access their own loans and transactions
- Security headers set via `next.config.js` (X-Frame-Options, X-Content-Type-Options, etc.)

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
