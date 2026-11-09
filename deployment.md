# Deployment and Reviewer Guide — SpiceCoast Holidays CMS
**Client:** Company A, Kochi  
**Candidate:** Saksham Gupta  
**Repository:** https://github.com/Saksham-Gupta-GH/spicecoast-travel-cms
**Live application:** https://spicecoast-travel-cms.vercel.app

## 1 Local Setup

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL 15 or newer, locally or through a personal Neon database

### Steps

```bash
git clone https://github.com/Saksham-Gupta-GH/spicecoast-travel-cms.git
cd spicecoast-travel-cms
npm install
cp .env.example .env.local
```

Supply your own PostgreSQL connection string and a long random session secret in `.env.local`. The environment variable names are listed in section 3; values are intentionally not committed. `npm test` is a database-backed integration suite, so `DATABASE_URL` must be valid before running it.

```bash
npm test
npm run dev
```

Open http://localhost:3000. On the first request, the application creates its PostgreSQL tables and seeds the sample packages, seasonal prices, enquiries, blogs, quote, users, redirects and activity records required for the demonstration.

## 2 Reviewer Demo Logins

Open `/staff-login` or click **Staff CMS and AI Inbox**.

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| Admin | `admin@spicecoast.in` | `SpiceCoastDemo!2026` | Dashboard, packages, enquiries, quotes, blogs and audit log |
| Editor | `editor@spicecoast.in` | `SpiceCoastDemo!2026` | Package CMS, pricing, preview, versions and blogs |
| Consultant | `consultant@spicecoast.in` | `SpiceCoastDemo!2026` | Enquiry review, corrections, replies and quotes |

These are fictional demonstration accounts. Login creates a signed, HTTP-only, same-site session cookie. Server-rendered staff pages and API routes repeat role checks.

## 3 Environment Variables

Names only, never production values:

```text
DATABASE_URL
SESSION_SECRET
NEXT_PUBLIC_SITE_URL
GEMINI_API_KEY
OPENROUTER_API_KEY
GEMINI_MODEL
OPENROUTER_MODEL
DEMO_ADMIN_PASSWORD
DEMO_EDITOR_PASSWORD
DEMO_CONSULTANT_PASSWORD
```

`DATABASE_URL` and `SESSION_SECRET` are required. `NEXT_PUBLIC_SITE_URL` should be the production Vercel URL so sitemap entries use the deployed origin. `GEMINI_API_KEY` and `OPENROUTER_API_KEY` activate the external extraction chain; without either key the deterministic local extractor remains available. The model variables and three demo-password overrides are optional.

## 4 Free Production Deployment

The submitted production path uses Vercel Hobby for the Next.js application and Neon Free for PostgreSQL. This keeps the assessment demo free while retaining durable CMS writes; no application data is stored in Vercel's ephemeral filesystem.

1. Create or choose a Neon Free PostgreSQL branch and copy its pooled connection string.
2. Import the public GitHub repository into Vercel.
3. Keep the detected framework preset as **Next.js** and the project root as the repository root.
4. Add the environment variables from section 3 to Production, Preview and Development as appropriate.
5. Deploy. The first request creates and seeds the schema.
6. Set `NEXT_PUBLIC_SITE_URL` to the final Vercel URL and redeploy once so the sitemap uses the final origin.
7. Verify `/`, `/packages/munnar-thekkady-alleppey-houseboat`, `/staff-login`, an authenticated package edit, and a new enquiry.

The free tiers are appropriate for a non-commercial assessment demo and may have usage limits or cold starts. The proposed client production budget should use paid capacity, backups, monitoring and an India-appropriate data-hosting review.

## 5 Key Review Flows

### Enquiry extraction and human review

1. Sign in as Admin or Consultant and open `/admin/enquiries`.
2. Select `ENQ-2026-001`, containing the supplied brief enquiry about two adults, one child, December, ₹1.2 lakh and a required houseboat.
3. Compare the original message with extracted fields, provider badge and the three ranked packages. New enquiries try Gemini, then OpenRouter, then the local extractor; direct email addresses and phone numbers are redacted before an external request.
4. Correct a field and save it. Inspect the reply draft: its seasonal figures come from `seasonal_prices`, not the extraction engine.
5. Approve the draft. This records the simulated send and audit entry; no external message is transmitted.

### Package CMS, seasonal prices and preview

1. Sign in as Admin or Editor and open `/admin/packages`.
2. Edit `PKG-KL-07`, change a seasonal price, add a change note and publish.
3. Confirm that the version increments and the public preview shows the new database-backed tariff.
4. Open version history and test rollback. Duplicate a package and confirm the copy is a draft.

### Public traveller flow

1. Open the public package catalogue and select the Munnar, Thekkady and Alleppey package.
2. Review the server-rendered itinerary, inclusions, hotels and seasonal price table.
3. Submit the enquiry form with the required DPDP consent checkbox.
4. Confirm the fixed instant acknowledgement and then view the new lead in the admin inbox.

### Optional quote depth

Open the seeded quote from `/admin/quotes`. The quote has a branded, print-optimized link and browser **Save as PDF** flow. Server-side PDF generation and outbound email are explicitly not implemented.

## 6 Verification

```bash
npm test
npm run lint
npm run build
```

The core tests cover extraction, PII redaction, package ranking, database-sourced prices, instant acknowledgement and version persistence. The application also validates public inputs, throttles unauthenticated enquiry attempts before AI calls, parameterizes SQL, keeps secrets out of the repository and checks staff roles on server pages and APIs.
