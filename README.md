# SpiceCoast Travel CMS

A full-stack take-home build for Company A, Kochi: server-rendered package pages, versioned seasonal pricing, traveller enquiries, and human-reviewed AI triage.

## Core flows

- Public package catalogue and server-rendered package detail pages
- Package CMS with seasonal tariffs, preview, duplication, version history and rollback
- Package enquiry forms with explicit digital follow-up consent
- Unified staff inbox with deterministic field extraction, ranked package suggestions and editable reply drafts
- Signed staff sessions with admin, editor and consultant authorization
- Seeded sample content, sitemap, representative legacy redirects and printable quote views

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill DATABASE_URL and SESSION_SECRET in .env.local
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). PostgreSQL tables and realistic sample data are created automatically on first use.

Reviewer staff accounts:

- `admin@spicecoast.in`
- `editor@spicecoast.in`
- `consultant@spicecoast.in`

Password for all demo accounts: `SpiceCoastDemo!2026`

## Quality checks

```bash
npm test
npm run lint
npm run build
```

See [deployment.md](./deployment.md) for environment variables, role-specific demo flows and the free Vercel + Neon deployment path. See [Technical_Design_Document.docx](./Technical_Design_Document.docx) for architecture, assumptions, tradeoffs and known limitations.

## Deployment note

The application uses managed PostgreSQL, so CMS edits remain durable across stateless Vercel function invocations. The assessment deployment targets Vercel Hobby and Neon Free; a client launch should use paid capacity, backups and monitoring.
