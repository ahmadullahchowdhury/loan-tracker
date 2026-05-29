# Deployment

## Prerequisites

- A MongoDB database (MongoDB Atlas recommended for production)
- A [Resend](https://resend.com) account with a verified sending domain (for email notifications)
- Node.js 20+ on your server, or a platform like Vercel / Railway / Render

---

## Environment Variables

Set the following on your hosting platform before deploying:

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | **Yes** | Full MongoDB connection string |
| `JWT_SECRET` | **Yes** | Random secret ≥ 32 characters |
| `RESEND_API_KEY` | No | Resend API key. Email notifications are silently skipped if missing |
| `FROM_EMAIL` | No | Verified sender address for emails |
| `NEXT_PUBLIC_APP_URL` | No | Public URL of your app (e.g. `https://loans.yourdomain.com`) |

**Generating a JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Vercel (recommended)

Vercel is the easiest deployment target for Next.js apps.

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
3. Under **Environment Variables**, add all required variables from the table above.
4. Click **Deploy**.

Vercel automatically runs `npm run build` and sets up the serverless functions.

**Important:** The in-memory rate limiter resets on every function cold start. For a production app with real traffic, replace `src/lib/rateLimit.js` with a Redis-backed solution (e.g. Upstash Redis via `@upstash/ratelimit`).

---

## Railway / Render

Both platforms support standard Node.js deployments.

1. Connect your repository.
2. Set the build command to `npm run build`.
3. Set the start command to `npm start`.
4. Add environment variables in the platform dashboard.
5. Deploy.

---

## Self-hosted (VPS / Docker)

### Without Docker

```bash
# Install dependencies
npm install

# Build
npm run build

# Start (uses PORT env var, defaults to 3000)
npm start
```

Use a process manager like PM2 to keep the app running:

```bash
npm install -g pm2
pm2 start "npm start" --name loan-tracker
pm2 save
pm2 startup
```

Set up a reverse proxy (nginx, Caddy) in front of port 3000 to handle HTTPS.

### With Docker

Create a `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

Enable standalone output in `next.config.js`:

```js
const nextConfig = {
  output: 'standalone',
  // ... rest of config
}
```

Build and run:

```bash
docker build -t loan-tracker .
docker run -p 3000:3000 \
  -e MONGODB_URI="..." \
  -e JWT_SECRET="..." \
  loan-tracker
```

---

## MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Under **Database Access**, create a user with **readWrite** access to your database.
3. Under **Network Access**, add your server IP (or `0.0.0.0/0` for Vercel serverless).
4. Click **Connect → Drivers** and copy the connection string.
5. Replace `<password>` in the string with your database user's password.
6. Set `MONGODB_URI` to this string.

---

## Resend Email Setup

1. Sign up at [resend.com](https://resend.com).
2. Add and verify your sending domain under **Domains**.
3. Create an API key under **API Keys**.
4. Set `RESEND_API_KEY` to the key and `FROM_EMAIL` to a verified address on your domain.

If you don't configure Resend, the app works fully — email notifications are simply skipped.

---

## Pre-launch Checklist

- [ ] `MONGODB_URI` points to a production database (not localhost)
- [ ] `JWT_SECRET` is a long, random string — never reuse a dev value
- [ ] `NODE_ENV=production` is set (Next.js sets this automatically on `npm start`)
- [ ] The debug route `GET /api/test-email` is removed from `src/app/api/test-email/route.js`
- [ ] HTTPS is enabled (required for `Secure` cookie flag to work)
- [ ] MongoDB Atlas network access is restricted to your server's IP
- [ ] Rate limiter is replaced with a persistent solution if running multiple instances

---

## Production Security Notes

**Cookies:** The auth cookie is set with `Secure: true` in production automatically when `NODE_ENV=production`. This means HTTPS is required — the cookie will not be sent over plain HTTP.

**CORS:** The app does not set CORS headers because the API and frontend are served from the same origin. Do not add permissive CORS headers unless you are building a separate frontend.

**Database:** Never expose your MongoDB URI publicly. Rotate your JWT secret and MongoDB credentials if they are ever leaked.
