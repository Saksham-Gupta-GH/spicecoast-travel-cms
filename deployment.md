# Deployment & Reviewer Guide — SpiceCoast Holidays CMS
**Client:** Company A, Kochi (Kerala & South India Holiday Specialist)  
**Problem Statement:** Tour operator's website with custom CMS for packages, blogs, enquiries, and AI triage.  
**Candidate:** Saksham Gupta  

---

## 1. Quick Local Setup (< 2 Minutes)

The project is built on Next.js 16 with TypeScript and an embedded zero-configuration SQLite database (`better-sqlite3`). **No external database server, Docker container, or cloud API key is required to test the entire application.**

### Prerequisites
* **Node.js**: Version 18.x, 20.x, or 22+ (tested on Node v26)
* **npm**: Version 9+ or 10+

### Step-by-Step Instructions
```bash
# 1. Clone the repository
git clone https://github.com/Saksham-Gupta-GH/spicecoast-travel-cms.git
cd spicecoast-travel-cms

# 2. Install dependencies
npm install

# 3. (Optional) Run the core logic unit tests
npm test

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

> **Automatic Database Seeding:** The SQLite database (`spicecoast.db`) is automatically initialized and seeded with all sample packages, seasonal price tables, blogs, and enquiries directly matching the problem brief on first startup.

---

## 2. Reviewer Demo Credentials and Roles

Open `/staff-login` or click **Staff CMS & AI Inbox**. These are fictional reviewer accounts. Each creates a signed, HTTP-only session and is authorized on both server pages and API routes.

| Role | Name | Email | Permissions & Focus |
| :--- | :--- | :--- | :--- |
| **Founder & MD (Admin)** | Jawahar Kurian | `admin@spicecoast.in` | Full access: dashboard, packages, enquiries, quotes, blogs and audit log. |
| **Content Editor** | Ananya Pillai | `editor@spicecoast.in` | Package pricing/versioning and blog CMS only. |
| **Senior Tour Consultant** | Mathew Varghese | `consultant@spicecoast.in` | Enquiry triage/replies and quote builder only. |
| **Public Traveller** | Public Visitor | N/A | Public holiday browsing, filters, day-wise itineraries, instant enquiries, and quote view. |

**Reviewer password for all three staff accounts:** `SpiceCoastDemo!2026`

---

## 3. Environment Variables (Names Only)

The application functions completely out of the box with default local heuristics. For optional production deployment or live external LLM connectivity, configure the following variables in a `.env.local` file:

```bash
# Core environment
PORT
NODE_ENV
NEXT_PUBLIC_SITE_URL
DATABASE_PATH
SESSION_SECRET

# Optional reviewer-password overrides
DEMO_ADMIN_PASSWORD
DEMO_EDITOR_PASSWORD
DEMO_CONSULTANT_PASSWORD
```

> **Security Note:** In accordance with repository submission rules, no secrets, personal API tokens, or credentials are committed to the codebase.

`SESSION_SECRET` is mandatory when `NODE_ENV=production`. `DATABASE_PATH` defaults to `./spicecoast.db` locally. The included Render blueprint sets it to `/var/data/spicecoast.db` on a persistent disk.

---

## 4. Production Deployment on Render

The repository includes `render.yaml` for a single Node.js service with a 1 GB persistent disk. A persistent Node instance is required because the core CMS writes to SQLite.

1. Push the public repository to GitHub.
2. In Render, choose **New → Blueprint** and select this repository.
3. Accept the `render.yaml` service definition. Render generates `SESSION_SECRET` automatically.
4. Set `NEXT_PUBLIC_SITE_URL` to the final `https://...onrender.com` URL.
5. Deploy and verify `/`, `/packages/munnar-thekkady-alleppey-houseboat`, `/staff-login`, and an authenticated package edit.

The blueprint uses Render’s paid Starter service because persistent disks are required. If a free ephemeral service is used instead, edits can disappear after a restart or redeploy and the deployment is not an honest demonstration of a CMS.

For a multi-instance production system, replace SQLite with managed PostgreSQL before horizontal scaling.

---

## 5. Key Review Flows and Sample Data Verification

### Flow A: Verify Brief Sample Enquiry & AI Triage Studio
1. Navigate to **[Enquiries & AI Triage](/admin/enquiries)**.
2. Select **`ENQ-2026-001` (Rahul Sharma)**, which contains the exact brief query:
   > *"2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must."*
3. **Inspect the Side-by-Side Review:**
   * **Extracted Fields**: Destination (`Alleppey/Kerala`), Dates (`December`), Party (`2 Adults, 1 Kid`), Budget (`₹1,20,000`), Must-Haves (`Houseboat overnight cruise`).
   * **Editable Human Correction**: Edit any field in real time and click **"Save Field Corrections"**.
   * **Top Recommendation**: System matches **`PKG-KL-07`** (Munnar & Alleppey Houseboat) with match reason.
   * **Strict Tariff Injection**: Inspect the generated draft reply. Notice that Deluxe Peak rate **₹32,500 pp** and Monsoon rate **₹24,900 pp** are populated directly from the price table, never hallucinated by AI.
4. Click **"Approve & Send Tailored Reply"** to log the dispatch in the activity trail.

### Flow B: Test 5-Minute Package Tariff Change & 1-Click Duplicate
1. Navigate to **[Package CMS & Pricing](/admin/packages)**.
2. Click **"Edit"** on **`PKG-KL-07`**.
3. Adjust any seasonal price (e.g., change Peak Deluxe from ₹32,500 to ₹33,900), add a changelog note, and click **"Publish & Increment Version"**.
4. Notice version increments to `v2`.
5. Click **"Version History"** to inspect the audit snapshot and test the **"Revert"** button.
6. Click the **"Duplicate"** icon next to any package to generate an instant draft copy in under 5 seconds.

### Flow C: Generate a Branded Printable Quote
1. Navigate to **[Quote Builder](/admin/quotes)**.
2. Click **"View PDF Quote"** on the seeded Dr. Evelyn Campbell quote.
3. Verify the itemized twin-sharing tariff calculation and assumed **5% GST** line item.
4. Test **"Print or Save as PDF"**. This uses the browser print dialog; no PDF file is generated or emailed by the server.

### Flow D: Public Traveler Experience & DPDP Consent
1. Visit the **[Public Homepage](/)** and **[Package Catalog](/packages)**.
2. Test the destination and category filters.
3. Open **`PKG-KL-07`** to review the day-wise itinerary accordion and seasonal tariff matrix.
4. Click **"Enquire Now"** to test the modal with **DPDP Act 2023** consent checkbox and guaranteed 1-hour response template.
5. Visit the **[Travel Blog](/blog)** and note how articles link readers straight into related packages.

---

## 6. Verification Commands

```bash
npm test
npm run lint
npm run build
```
**Test Coverage Includes:**
* `AI Enquiry Extraction`: Extracting party size, budget, travel window, and must-haves.
* `Package Recommendation`: Scoring algorithm matching destination, family pacing, and budget.
* `Strict Pricing Integrity`: Verification that draft replies query only database prices with 5% GST and twin sharing.
* `Instant Acknowledgement SLA`: Guaranteed template confirmation generation.
* `Package Versioning`: Snapshot persistence and rollback execution.

At handoff, the core test suite passes 8/8 tests and the production build completes. ESLint completes with warnings from legacy broad SQLite row types and unused icon imports; it has no lint errors.
