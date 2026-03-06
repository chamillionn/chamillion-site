# Security

This repository handles production user data and privileged database access. Treat security requirements as **non-optional**.

---

## Agent Rules (MUST FOLLOW)

- **No secrets in code**
  - Never commit: Service role keys, JWT secrets, database passwords, API keys.
  - Client-side env vars must be limited to `NEXT_PUBLIC_*` and must be non-sensitive.

- **Assume public keys are public**
  - Anyone can extract client-side keys from a web app.
  - All data protection must be enforced via **RLS**, safe RPCs, and server-side checks.

- **Service role usage**
  - Service role keys may only be used in:
    - Next.js Route Handlers (`app/api/**`)
    - Edge Functions or serverless functions
    - Trusted backend workers
  - Never expose service role keys to the browser.

- **RLS is mandatory**
  - Any public or semi-public table must have RLS enabled.
  - Avoid permissive write policies like `WITH CHECK (true)` for `INSERT/UPDATE/DELETE`.

- **Prefer server endpoints for public write actions**
  - Any endpoint that records data must:
    - Validate input
    - Apply rate limits
    - Use service-role DB writes on the server
  - Client components must not call write RPCs directly. Use a server route.

- **Function hardening**
  - All SECURITY DEFINER functions must have a fixed `search_path`:
    ```sql
    SET search_path = public, extensions
    ```
  - Restrict function execution grants: only grant `EXECUTE` to roles that need it.

- **Do not increase attack surface**
  - Do not attach privileged objects to `window`.
  - Avoid broad CORS (`*`).
  - Validate all redirect URLs (relative paths only, block `//`).

## Required Checks Before Merge

- Search for leaked keys: service role keys, JWTs (`eyJ...`), tokens
- Run Supabase security advisor + performance advisor after any DB/RLS/function change
- Confirm no public tables allow anonymous inserts without validation

## Incident Response (If a key is exposed)

- Rotate impacted keys immediately
- Audit RLS policies and function grants
- Review logs for unusual access patterns
- Add a regression test/checklist entry to prevent recurrence

---

## Audit Checklist (30 Rules)

Source: @Hartdrawss — 30 security rules for AI vibe coding.
Each rule includes the audit result for this project.

Status: `[OK]` pass | `[PENDING]` needs work | `[N/A]` not applicable

### Auth & Sessions

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 1 | Set session expiration (JWT max 7 days + refresh rotation) | OK | JWT expiry 3600s (Supabase default). Refresh rotation active via middleware `getUser()`. Compromised token detection ON. Reuse interval 10s. |
| 2 | Never use AI-built auth. Use Clerk, Supabase Auth, or Auth0 | OK | Supabase Auth with magic link (OTP email). No custom auth. |
| 16 | Password reset routes: strict limit (3 per email/hour) | N/A | Password login removed entirely. Magic link only — rate limited by Supabase. |

### Secrets & Environment

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 3 | Never paste API keys into AI chats. Use process.env | OK | Zero hardcoded secrets. All keys via `process.env`. Tests use fake values. |
| 4 | .gitignore is your first file in every project | OK | `.env*.local`, `node_modules/`, `.next/`, `.vercel` excluded. |
| 5 | Rotate secrets every 90 days minimum | OK | JWT key rotated to ECC P-256. Action: calendar reminder every 90 days for JWT key + Stripe webhook secret. |

### Dependencies

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 6 | Verify every package the AI suggests actually exists | OK | `npm audit`: 0 vulnerabilities. Always verify on npmjs.com before installing. |
| 7 | Always ask for newer, more secure package versions | OK | Up to date within major versions (Next 15, ESLint 9). |
| 8 | Run npm audit fix right after building | OK | 0 vulnerabilities. |

### Input & Queries

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 9 | Sanitize every input. Use parameterized queries always | OK | All DB queries via Supabase client (auto-parameterized). Zero raw SQL. `dangerouslySetInnerHTML` only with static data. |

### Database

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 10 | Enable Row-Level Security from day one | OK | RLS enabled on `profiles`, `positions`, `platforms`, `strategies`. Verify with: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`. |

### Logging

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 11 | Remove all console.log statements before shipping | OK | Zero `console.log/debug/info`. Only `console.error` in server-side route handlers (acceptable). |

### CORS & Redirects

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 12 | CORS should only allow your production domain. Never wildcard | OK | No custom CORS headers. Next.js same-origin default. Verify Supabase Auth > URL Configuration has no wildcards. |
| 13 | Validate all redirect URLs against an allow-list | OK | Auth callback: `safeRedirectPath()` blocks `//`. Stripe checkout: `returnTo` validated. Middleware: uses internal `pathname`. |

### Rate Limiting

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 14 | Apply auth + rate limits to every endpoint | PENDING | Auth: all endpoints verified. Rate limiting: not implemented on API routes. Low risk at current scale. Options: Vercel edge (paid), or `next-rate-limit`. |
| 15 | Rate limit everything from day one. 100 req/hour per IP | PENDING | Same as 14. Supabase Auth has its own rate limits. API routes have none. |

### AI / Costs

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 17 | Cap AI API costs in your dashboard AND in your code | N/A | No AI API usage in the project. |

### Infrastructure

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 18 | Add DDoS protection via Cloudflare or Vercel edge config | OK | Vercel Edge Network includes DDoS protection by default on all plans. |
| 19 | Lock down storage buckets. Users should only access their own files | N/A | No Supabase Storage usage. Images served as static assets from `/public/` via Vercel. |
| 20 | Limit upload sizes and validate file type by signature | N/A | No file upload functionality. |

### Payments

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 21 | Verify webhook signatures before processing any payment data | OK | `constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)` in `app/api/stripe/webhook/route.ts`. Returns 400 on missing/invalid signature. |
| 22 | Use Resend or SendGrid with proper SPF/DKIM records | PENDING | Using Supabase default email (sends from Supabase domain). Improvement: configure Resend as custom SMTP + add SPF/DKIM to `chamillion.site` DNS for better deliverability and branding. |

### Authorization

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 23 | Check permissions server-side. UI-level checks are not security | OK | All admin actions use `requireAdmin()` server-side. Paywall is a Server Component (HTML never sent without access). Stripe routes use `getUser()`. Sync routes use `authCheck()`. |

### Security Testing

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 24 | Ask the AI to act as a security engineer and review your code | OK | Completed — this audit (2026-03-06). |
| 25 | Ask the AI to try and hack your app | PENDING | To be done after audit. |

### Compliance & Operations

| # | Rule | Status | Notes |
|---|------|--------|-------|
| 26 | Log critical actions: deletions, role changes, payments, exports | PENDING | Stripe Dashboard logs payments. Supabase Audit Logs covers auth. Missing: explicit log when webhook changes user role. Low priority at current scale. |
| 27 | Build a real account deletion flow. GDPR fines are not fun | OK | Self-service deletion in `/cuenta` via `deleteOwnAccount()`. Requires email confirmation, cancels Stripe subscription, deletes auth user (cascades to profile). Admins blocked from self-deletion. |
| 28 | Automate backups and test restoration | PENDING | Supabase daily backups (7-day retention on free plan). Action: test restoration at least once to verify it works. |
| 29 | Keep test and production environments completely separate | OK | Separate Supabase projects: dev (`mdkej...`) and prod (`hpyyu...`). Separate `.env.local` / `.env.production.local`. |
| 30 | Never let test webhooks touch real systems | OK | Verify in Stripe Dashboard that test-mode webhook does not point to `chamillion.site`. |
