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
git clone https://github.com/sakshamgupta/spicecoast-travel-cms.git
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

## 2. Reviewer Demo Credentials & Simulated Roles

The application includes a role simulation switcher in the top navigation bar of the Staff CMS (`/admin`), enabling reviewers to switch personas in 1 click without needing manual logout/login cycles.

| Role | Name | Email | Permissions & Focus |
| :--- | :--- | :--- | :--- |
| **Founder & MD (Admin)** | Jawahar Kurian | `admin@spicecoast.in` | Full executive access: ROI dashboard, publishing packages, rollback, and audit log. |
| **Content Editor** | Ananya Pillai | `editor@spicecoast.in` | CMS package editor, seasonal pricing tariffs, blog creation, and package linking. |
| **Senior Tour Consultant** | Mathew Varghese | `consultant@spicecoast.in` | Unified enquiry inbox, AI triage correction, draft reply approvals, and quote generator. |
| **Public Traveller** | Public Visitor | N/A | Public holiday browsing, filters, day-wise itineraries, instant enquiries, and quote view. |

---

## 3. Environment Variables (Names Only)

The application functions completely out of the box with default local heuristics. For optional production deployment or live external LLM connectivity, configure the following variables in a `.env.local` file:

```bash
# Core Environment
PORT
NODE_ENV
NEXT_PUBLIC_SITE_URL

# Optional External AI API Key (Falls back to deterministic local NLP if omitted)
AI_API_KEY
TYPEROUTER_API_KEY
GEMINI_API_KEY

# Optional Staff Session Secret
SESSION_SECRET
```

> **Security Note:** In accordance with repository submission rules, no secrets, personal API tokens, or credentials are committed to the codebase.

---

## 4. Key Review Flows & Sample Data Verification

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

### Flow C: Generate Branded PDF Quote
1. Navigate to **[Quote Builder](/admin/quotes)**.
2. Click **"View PDF Quote"** on quote **`#SCH-2026-Q8819`** (Dr. Evelyn Campbell).
3. Verify the itemized twin-sharing tariff calculation and mandatory **5% GST** line item.
4. Test the **"Print or Save as PDF"** button.

### Flow D: Public Traveler Experience & DPDP Consent
1. Visit the **[Public Homepage](/)** and **[Package Catalog](/packages)**.
2. Test the destination and category filters.
3. Open **`PKG-KL-07`** to review the day-wise itinerary accordion and seasonal tariff matrix.
4. Click **"Enquire Now"** to test the modal with **DPDP Act 2023** consent checkbox and guaranteed 1-hour response template.
5. Visit the **[Travel Blog](/blog)** and note how articles link readers straight into related packages.

---

## 5. Running Automated Logic Tests

```bash
npm test
```
**Test Coverage Includes:**
* `AI Enquiry Extraction`: Extracting party size, budget, travel window, and must-haves.
* `Package Recommendation`: Scoring algorithm matching destination, family pacing, and budget.
* `Strict Pricing Integrity`: Verification that draft replies query only database prices with 5% GST and twin sharing.
* `Instant Acknowledgement SLA`: Guaranteed template confirmation generation.
* `Package Versioning`: Snapshot persistence and rollback execution.
