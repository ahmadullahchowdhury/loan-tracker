# Contributing

## Development Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd loan-tracker
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your local values. At minimum you need:
- `MONGODB_URI` — a local or Atlas MongoDB instance
- `JWT_SECRET` — any string of 32+ characters works locally

### 3. Start the dev server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/api/          ← Route Handlers (REST API)
├── app/(app)/        ← Authenticated pages
├── app/login/        ← Public auth pages
├── app/register/
├── components/       ← Feature components
├── components/ui/    ← Radix UI primitives (don't add business logic here)
├── contexts/         ← React Context providers
├── lib/              ← Server-side utilities and Mongoose models
├── middleware.js     ← Route protection
└── providers/        ← Top-level React providers
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for a full explanation of how the layers interact.

---

## Coding Conventions

### API routes

Every Route Handler must:
1. Call `verifyAuth(request)` before any business logic.
2. Validate all input fields before touching the database.
3. Scope all DB queries to the authenticated `userId`.

```js
// Example skeleton
export async function POST(request) {
  const authResult = await verifyAuth(request)
  if (authResult.error) return authResult.response

  const body = await request.json()
  // validate body...

  await connectDB()
  const result = await MyModel.create({ userId: authResult.user._id, ...body })
  return Response.json(result, { status: 201 })
}
```

### Components

- Feature components live in `src/components/`. They may import from `lib/` and `components/ui/`.
- UI primitives in `src/components/ui/` are Radix-based — keep them generic and stateless.
- Data fetching uses React Query (`useQuery` / `useMutation`). Do not call axios directly from components.

### Styling

- Use Tailwind utility classes.
- Use the `cn()` helper from `src/lib/utils.js` for conditional classes.
- Do not write custom CSS files unless Tailwind cannot express the style.

---

## Adding a New Feature

### Adding a new API endpoint

1. Create `src/app/api/<resource>/route.js`.
2. Add `verifyAuth`, input validation, and DB logic.
3. Document the endpoint in [docs/API.md](docs/API.md).

### Adding a new page

1. Create `src/app/(app)/<page-name>/page.jsx` for authenticated pages.
2. Create `src/app/<page-name>/page.jsx` for public pages.
3. If it needs auth protection, the `(app)` group layout handles it automatically. For public pages, update `src/middleware.js` if needed.

### Adding a new Mongoose model

1. Create `src/lib/models/MyModel.js` following the existing model pattern.
2. Always include `{ userId: ObjectId }` if the data belongs to a specific user.
3. Add appropriate indexes for the queries you'll run.
4. Document the schema in [docs/DATABASE.md](docs/DATABASE.md).

---

## Common Tasks

### Check for lint errors

```bash
npm run lint
```

### Build and check for type / compile errors

```bash
npm run build
```

### Test email notifications locally

After logging in, call:

```
GET /api/test-email?to=your@email.com
```

This uses the `RESEND_API_KEY` and `FROM_EMAIL` from your `.env.local`.

> Remove `src/app/api/test-email/route.js` before deploying to production.

---

## Pull Request Guidelines

- Keep PRs focused — one feature or fix per PR.
- Run `npm run lint` and `npm run build` before opening a PR; both must pass.
- Update the relevant docs (`docs/API.md`, `docs/DATABASE.md`, etc.) if your change affects the public API or schema.
- Write a clear PR description explaining *why* the change is needed, not just what it does.
