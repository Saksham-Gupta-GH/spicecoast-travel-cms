# Technical Design Document (TDD)
## SpiceCoast Holidays — Tour Operator Public Portal, Package CMS & AI Enquiry Engine
**Candidate:** Saksham Gupta  
**Project GitHub Repository:** [https://github.com/sakshamgupta/spicecoast-travel-cms](https://github.com/sakshamgupta/spicecoast-travel-cms)  
**Demo Video / Live Target:** [http://localhost:3000](http://localhost:3000) (Self-contained zero-config deployment)  
**Problem Statement:** Brief 1 — Tour operator's website with custom CMS for packages, blogs, enquiries, and AI triage  
**Client Profile:** Company A, Kochi, Kerala (48 staff, ₹28–34 Cr revenue, 4,300 annual bookings across 60 packages)  

---

## 1. Executive Summary & Business Objective

### The Core Problem & Financial Math
Company A sells bespoke Kerala and South India holidays to families, honeymooners, and foreign groups. Their legacy setup caused two severe operational bottlenecks:
1. **Response Time Lag (Loss: ₹52.42 Lakh/yr):** 2,400 monthly enquiries arrive across fragmented channels (web, WhatsApp, email, phone). 25% (600 enquiries) suffer reply delays exceeding 12 hours, crashing conversion from 15% to 7%. This causes **48 lost bookings per month** at an average package value of ₹65,000 and 14% net margin = **₹4.37 Lakh/month = ₹52.42 Lakh/year**.
2. **Content Publishing Bottleneck (Loss: ₹14.4 Lakh/yr):** Every package edit or seasonal price update costs ₹3,000 and 3 days of freelancer delay across 40 monthly changes = **₹14.4 Lakh/year**.
3. **Disconnected Blogs & Excel Sprawl:** Free blogging platforms generated unmonetized traffic with zero package attribution, while quotes were manually assembled in Microsoft Word.

**Total Financial Leakage Addressed:** **₹66.82 Lakh / Year**.

### The Solution Delivered
A unified, server-rendered Next.js 16 application backed by a zero-overhead local SQLite database (`better-sqlite3`) that provides:
* **Public Booking Portal:** High-impact Kerala visual branding, day-wise itineraries, seasonal tariff matrix (twin sharing + 5% GST), and DPDP Act 2023 compliant enquiry modals.
* **5-Minute Package CMS Studio:** In-place seasonal tariff edits, 1-click package duplication, live preview, and snapshot-based version history with 1-click rollback.
* **Unified Admin Inbox & AI Triage Studio:** Multi-channel aggregation, automatic parameter extraction, top-3 package recommendation, and automated draft replies strictly constrained to database prices (eliminating hallucinations).
* **Instant Branded Quote Builder:** Itemized PDF quote generator with statutory GST calculation and shareable links.

---

## 2. System Architecture & Tech Stack Justification

```
+---------------------------------------------------------------------------------+
|                                CLIENT BROWSERS                                  |
|   (Mobile Travelers, Content Editors, Tour Consultants, Founder-MD)             |
+---------------------------------------------------------------------------------+
                                      |
                           HTTPS / Next.js Proxy
                                      |
+---------------------------------------------------------------------------------+
|                           NEXT.JS 16 APP ROUTER LAYER                           |
|                                                                                 |
|  [Server Components (SSR)]         [Client Interactive Islands]                |
|  * /packages/[slug] (Itineraries)  * EnquiryModal (1-Hr SLA + DPDP Consent)     |
|  * /blog/[slug] (Package links)    * EnquiriesInboxClient (AI Triage Studio)    |
|  * /quotes/[id] (PDF Proposal)     * PackagesCmsClient (Tariff & Rollback)      |
+---------------------------------------------------------------------------------+
                                      |
+---------------------------------------------------------------------------------+
|                              API & DOMAIN SERVICES                              |
|                                                                                 |
|  /api/packages        /api/enquiries        /api/quotes        /api/blogs       |
|         |                   |                    |                  |           |
|         +-------------------+--------------------+------------------+           |
|                             |                                                   |
|             +---------------+---------------+                                   |
|             |  AI TRIAGE & EXTRACTION ENGINE |                                   |
|             |  * Heuristic Regex NLP Core   |                                   |
|             |  * Zero-Hallucination Pricing |                                   |
|             |  * Recommendation Scorer      |                                   |
|             +---------------+---------------+                                   |
|                             |                                                   |
+---------------------------------------------------------------------------------+
                                      |
+---------------------------------------------------------------------------------+
|                         PERSISTENCE: SQLITE (WAL MODE)                          |
|   * packages               * seasonal_prices       * package_versions           |
|   * enquiries              * quotes                * blogs                      |
|   * activity_logs          * users                 * redirects (140 Legacy)     |
+---------------------------------------------------------------------------------+
```

### Why Next.js 16 App Router?
1. **Server-Side Rendering (SSR) for Search & Core Web Vitals:** Tour packages and destination guides require high SEO visibility and fast first-contentful paint (<2.5s). Server Components render complete HTML with zero clientside database waterfall.
2. **Unified Full-Stack Deployment:** Eliminates the operational overhead of running separate frontend and backend microservices. Reviewers need only one command (`npm run dev`) to test the entire system.
3. **Optimized Turbopack Bundling:** Instant compilation and type checking with zero external bundle bloat.

### Why SQLite with `better-sqlite3` and WAL Mode?
* **Zero Configuration for Evaluators:** Avoids external PostgreSQL/MySQL cloud provisioning, Docker daemon requirements, or connection string misconfigurations.
* **High Performance:** Running SQLite in Write-Ahead Logging (`WAL`) mode supports concurrent readers alongside atomic transactions, executing queries in <1 millisecond.
* **Relational Integrity:** Foreign keys with `ON DELETE CASCADE` ensure seasonal prices, itineraries, and version snapshots remain strictly synchronized.

---

## 3. Data Model & Entity Relationships

```
+------------------+         1:N         +---------------------+
|     packages     |-------------------->|   seasonal_prices   |
+------------------+                     +---------------------+
| id (PK)          |                     | id (PK)             |
| slug (Unique)    |                     | package_id (FK)     |
| title            |                     | season_name         |
| duration_days    |                     | standard_price_pp   |
| destination_sum  |                     | deluxe_price_pp     |
| category         |                     | luxury_price_pp     |
| hotel_tiers      |                     | gst_percent (5.0)   |
| status           |                     +---------------------+
| current_version  |
+------------------+
        | 1:N
        +-------------------------------->+---------------------+
        |                                 |   itinerary_days    |
        | 1:N                             +---------------------+
        +-------------------------------->| package_versions    |
        |                                 +---------------------+
        |                                 | snapshot_json       |
        |                                 | version_number      |
        |                                 | change_summary      |
        |                                 +---------------------+
        |
        | 1:N (Optional)
        v
+------------------+         1:1         +---------------------+
|    enquiries     |-------------------->|       quotes        |
+------------------+                     +---------------------+
| id (PK)          |                     | quote_number (Unique|
| source           |                     | traveller_name      |
| traveller_name   |                     | selected_tier       |
| raw_message      |                     | subtotal_amount     |
| status           |                     | gst_amount (5%)     |
| ai_destination   |                     | grand_total         |
| ai_adults/kids   |                     +---------------------+
| ai_budget_inr    |
| ai_draft_reply   |
| is_human_reviewed|
+------------------+
```

### Table Specifications
* **`packages`**: Stores package identity, destinations JSON array, category (Family, Honeymoon, Luxury, Group), hotel tier descriptions, and current published version.
* **`seasonal_prices`**: Enforces the statutory requirement of per-person twin-sharing tariffs across Peak (Dec–Jan), Regular, and Monsoon seasons, plus 5% GST.
* **`package_versions`**: Stores deep JSON snapshots of past revisions, author metadata, and change notes to support 1-click rollbacks.
* **`enquiries`**: Unified lead store supporting Web, WhatsApp, and Email. Houses both raw incoming text and extracted AI attributes.
* **`quotes`**: Itemized proposals with subtotal, 5% GST calculation, and validity period.
* **`activity_logs`**: Immutable audit trail of package edits, pricing changes, and reply dispatches.
* **`redirects`**: 301 redirect mapping table honoring the 140 legacy URLs requirement.

---

## 4. The AI Triage & Suggestion Engine

### Design Philosophy: Resilient Dual-Engine Strategy
To accommodate quota limitations and offline evaluation while guaranteeing zero crashes, the AI pipeline is structured with a **deterministic local NLP heuristic engine** as the foundational layer, backed by optional live LLM configuration (`AI_API_KEY` / `TYPEROUTER_API_KEY` / `GEMINI_API_KEY`).

```
[Incoming Traveller Lead]
         |
         v
+-------------------------------------------------------+
| Step 1: Automated Parameter Extraction                |
| - Party Size: Adults & Kids count                     |
| - Travel Window: Month / Nights                       |
| - Target Budget (INR): Converts "1.2 lakh" to 120,000 |
| - Must-Haves: Houseboat, pool villa, temple circuit   |
+-------------------------------------------------------+
         |
         v
+-------------------------------------------------------+
| Step 2: Deterministic Database Package Scoring        |
| - Overlap on requested destinations (+35 pts)         |
| - Pacing fit (e.g. Family category + Kids) (+25 pts)  |
| - Houseboat requirement match (+30 pts)               |
| - Budget feasibility vs Deluxe tariff (+20 pts)       |
| -> Selects Top 3 Best-Fit Database Packages           |
+-------------------------------------------------------+
         |
         v
+-------------------------------------------------------+
| Step 3: Strict Zero-Hallucination Price Injection     |
| - AI DOES NOT generate pricing numbers.               |
| - Prices are queried directly from seasonal_prices.   |
| - Inject Peak (₹32,500) and Monsoon (₹24,900) rates. |
| - State twin sharing basis and 5% GST inclusion.      |
+-------------------------------------------------------+
         |
         v
+-------------------------------------------------------+
| Step 4: Human-in-the-Loop Review & Approval           |
| - Extracted fields displayed beside original text.    |
| - Consultant can manually override any parameter.     |
| - NOTHING is sent until consultant clicks "Approve".  |
+-------------------------------------------------------+
```

### Safety Constraints Enforced
1. **Prices Come from Database, Never AI:** In accordance with the problem statement (*"prices in drafts come from the package price table, never from the AI"*), pricing numbers in generated draft replies are strictly queried from `seasonal_prices`.
2. **Nothing Sent Without Human Review:** AI drafts remain in `Draft` state inside the admin inbox until Mathew Varghese (Consultant) or Jawahar Kurian (Admin) verifies and clicks **"Approve & Send Tailored Reply"**.
3. **DPDP Act 2023 Compliance:** Every public enquiry form requires explicit opt-in consent for WhatsApp and email communication, logged directly alongside the lead record.

---

## 5. Key UI & Design Decisions (6–8 Screens)

### Visual Identity
A tailored design system inspired by Kerala's natural landscapes:
* **Primary Color:** Emerald Green (`#047857` / `#059669`) reflecting backwaters and Munnar tea hills.
* **Accent Color:** Warm Spice Amber (`#d97706`) for call-to-actions and ratings.
* **Backgrounds:** Slate clean backgrounds (`#f8fafc`) ensuring crisp typography and legibility.

### Screen Breakdown
1. **Public Landing & Search Portal (`/`)**: High-impact Kerala imagery, business credibility strip (48 staff, ₹32 Cr volume, 1-hour reply SLA), featured packages, and interactive enquiry form with brief sample loader.
2. **Holiday Packages Catalog (`/packages`)**: Instant client-side filters for Category (Family, Honeymoon, Luxury, Group) and Destination, showing per-person twin-sharing pricing and 5% GST badges.
3. **Public Package Detail Page (`/packages/[slug]`)**: Server-rendered view with day-wise itinerary accordions, hotel standard comparison, inclusions/exclusions checklist, and seasonal tariff matrix.
4. **Package CMS Studio (`/admin/packages`)**: Comprehensive management interface allowing 5-minute price edits, 1-click duplicate package creation, live preview, and version rollback.
5. **Unified Admin Inbox & AI Triage Studio (`/admin/enquiries`)**: Two-pane workspace displaying raw messages side-by-side with editable AI extracted parameters, top 3 suggestions, and editable draft reply.
6. **Executive ROI Dashboard (`/admin`)**: Business metric tracker demonstrating how reducing response lag from 12 hours to under 60 minutes retains ₹66.82 Lakh in annual margin.
7. **Branded Printable Quote View (`/quotes/[id]`)**: Official proposal on Company A letterhead with itemized subtotal, statutory 5% GST, twin sharing note, and 1-click browser printing.
8. **In-House Travel Blog & Package Attribution (`/blog` & `/blog/[slug]`)**: Editorial articles hosted directly on-domain that feature direct booking cards for corresponding tour circuits.

---

## 6. Testing, Quality & Security

### Automated Test Suite (`tests/core-logic.test.ts`)
Run via `npm test` using Node's native test runner:
* **AI Extraction Tests:** Validates extraction of party size (adults/kids), travel window, budget in INR, and must-haves on sample queries from the brief.
* **Package Recommendation Scoring:** Validates that `PKG-KL-07` is selected as the #1 best fit for family + houseboat queries.
* **Price Integrity Verification:** Ensures generated draft replies contain exact numbers from `seasonal_prices` (e.g. ₹32,500 and ₹24,900) and explicitly mention twin sharing and 5% GST.
* **Instant Acknowledgment SLA:** Verifies generation of instant branded acknowledgment templates with reference tracking IDs.
* **Package Versioning & Rollback:** Verifies snapshot generation and historical state restoration.

### Security & Privacy Safeguards
* **Zero Secrets in Repository:** No API keys or credentials committed to source control.
* **DPDP Act 2023 Consent Enforcement:** Explicit opt-in captured before storing lead contact details.
* **Sanitized Inputs:** All SQLite queries utilize parameterized statements (`db.prepare(...).all(...)`), preventing SQL injection attacks.
* **Access Control Simulation:** Role simulation switcher enforces role boundaries between Admin, Editor, and Consultant.

---

## 7. Tradeoffs, What Was Cut, and What Comes Next

### What Was Cut (In Accordance with Scope Boundaries)
1. **Live Flight & Hotel Inventory Sync:** Excluded per the brief (*"Out of scope: Online payment and live hotel or flight inventory"*). Packages feature curated hotel tiers rather than dynamic GDS feeds.
2. **Payment Gateway Integration:** Direct payment checkout was omitted in favor of official quote generation and travel consultant consultation.
3. **Native iOS/Android Applications:** Responsive web layouts were prioritized to deliver an optimal mobile experience for travelers without app store download friction.

### Roadmap & Next Steps
1. **WhatsApp Business Cloud API Integration:** Wire the existing AI triage reply generator into official WhatsApp Webhooks with template messaging approval.
2. **Automated PDF Export via Headless Chromium:** Enhance the printable quote view with automated server-side PDF generation attached directly to outbound consultant emails.
3. **Multi-Currency Pricing for Foreign Inbound Groups:** Add automated exchange rate conversion (USD, GBP, EUR) for foreign academic and leisure tours while maintaining statutory INR billing in Kochi.
