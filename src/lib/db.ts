import { Pool } from "pg";

type QueryParameters = unknown[] | Record<string, unknown>;

function compileQuery(sql: string, parameters: QueryParameters = []) {
  if (Array.isArray(parameters)) {
    let index = 0;
    return {
      text: sql.replace(/\?/g, () => `$${++index}`),
      values: parameters,
    };
  }

  const values: unknown[] = [];
  return {
    text: sql.replace(/@([A-Za-z_][A-Za-z0-9_]*)/g, (_match, key: string) => {
      values.push(parameters[key]);
      return `$${values.length}`;
    }),
    values,
  };
}

const globalForDatabase = globalThis as unknown as { spicecoastPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required. See deployment.md for local and Neon setup.");
  }

  return new Pool({
    connectionString,
    max: process.env.VERCEL ? 1 : 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
  });
}

function getPool() {
  globalForDatabase.spicecoastPool ??= createPool();
  return globalForDatabase.spicecoastPool;
}

const db = {
  async exec(sql: string) {
    await getPool().query(sql);
  },
  prepare(sql: string) {
    const query = async (parameters: QueryParameters = []) => {
      const compiled = compileQuery(sql, parameters);
      return getPool().query(compiled.text, compiled.values);
    };

    const normalize = (args: unknown[]): QueryParameters => {
      if (args.length === 1 && args[0] && typeof args[0] === "object" && !Array.isArray(args[0])) {
        return args[0] as Record<string, unknown>;
      }
      return args;
    };

    return {
      async all(...args: unknown[]) {
        return (await query(normalize(args))).rows;
      },
      async get(...args: unknown[]) {
        return (await query(normalize(args))).rows[0];
      },
      async run(...args: unknown[]) {
        const result = await query(normalize(args));
        return { changes: result.rowCount ?? 0 };
      },
    };
  },
};

let initializationPromise: Promise<void> | undefined;

export function initDatabase() {
  initializationPromise ??= initializeDatabase();
  return initializationPromise;
}

async function initializeDatabase() {
  await db.exec(`
    -- Users & Staff
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'editor', 'consultant', 'traveller')),
      avatar TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Packages (Public + CMS)
    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      duration_nights INTEGER NOT NULL,
      destination_summary TEXT NOT NULL,
      destinations_json TEXT NOT NULL, -- JSON array of strings
      category TEXT NOT NULL CHECK(category IN ('Family', 'Honeymoon', 'Group', 'Luxury', 'Adventure')),
      featured_image TEXT NOT NULL,
      gallery_json TEXT NOT NULL, -- JSON array of image URLs
      inclusions_json TEXT NOT NULL, -- JSON array
      exclusions_json TEXT NOT NULL, -- JSON array
      hotel_standard_name TEXT NOT NULL,
      hotel_deluxe_name TEXT NOT NULL,
      hotel_luxury_name TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('published', 'draft', 'scheduled')),
      current_version INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Package Version History (for rollback, audit, and diffing)
    CREATE TABLE IF NOT EXISTS package_versions (
      id BIGSERIAL PRIMARY KEY,
      package_id TEXT NOT NULL,
      version_number INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL,
      change_summary TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
    );

    -- Seasonal Pricing Table (Twin sharing + 5% GST requirement)
    CREATE TABLE IF NOT EXISTS seasonal_prices (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      season_name TEXT NOT NULL,
      period_label TEXT NOT NULL,
      start_month INTEGER NOT NULL,
      end_month INTEGER NOT NULL,
      standard_price_pp INTEGER NOT NULL,
      deluxe_price_pp INTEGER NOT NULL,
      luxury_price_pp INTEGER NOT NULL,
      gst_percent REAL NOT NULL DEFAULT 5.0,
      note TEXT NOT NULL,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
    );

    -- Day-wise Itinerary
    CREATE TABLE IF NOT EXISTS itinerary_days (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      day_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      meals_included TEXT NOT NULL,
      overnight_location TEXT NOT NULL,
      activity_tags_json TEXT NOT NULL, -- JSON array
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
    );

    -- Enquiries & AI Triage Inbox
    CREATE TABLE IF NOT EXISTS enquiries (
      id TEXT PRIMARY KEY,
      package_id TEXT,
      source TEXT NOT NULL CHECK(source IN ('web_form', 'whatsapp', 'email', 'phone', 'chat')),
      traveller_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      raw_message TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('New', 'In Review', 'Quoted', 'Booked', 'Closed')),
      assigned_consultant_id TEXT,
      dpdp_consent_given INTEGER NOT NULL DEFAULT 1,
      
      -- AI Extraction fields
      ai_destination TEXT,
      ai_travel_dates TEXT,
      ai_adults INTEGER DEFAULT 2,
      ai_kids INTEGER DEFAULT 0,
      ai_budget_inr INTEGER,
      ai_special_requests TEXT,
      ai_confidence REAL DEFAULT 0.95,
      is_human_reviewed INTEGER DEFAULT 0,
      human_corrections_json TEXT,

      -- AI Package Recommendations & Reply
      suggested_package_ids_json TEXT, -- JSON array of package IDs
      ai_draft_reply TEXT,
      final_reply TEXT,
      replied_at TIMESTAMPTZ,

      internal_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_consultant_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Quote Builder
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      enquiry_id TEXT,
      package_id TEXT NOT NULL,
      quote_number TEXT UNIQUE NOT NULL,
      traveller_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      travel_date TEXT NOT NULL,
      adults_count INTEGER NOT NULL,
      kids_count INTEGER NOT NULL,
      selected_tier TEXT NOT NULL CHECK(selected_tier IN ('Standard', 'Deluxe', 'Luxury')),
      price_per_person INTEGER NOT NULL,
      subtotal_amount INTEGER NOT NULL,
      gst_percent REAL NOT NULL DEFAULT 5.0,
      gst_amount INTEGER NOT NULL,
      grand_total INTEGER NOT NULL,
      notes TEXT,
      status TEXT NOT NULL CHECK(status IN ('Draft', 'Sent', 'Accepted', 'Expired')),
      created_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE SET NULL,
      FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
    );

    -- Blog CMS (Linked directly to packages)
    CREATE TABLE IF NOT EXISTS blogs (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      featured_image TEXT NOT NULL,
      author TEXT NOT NULL,
      related_package_ids_json TEXT NOT NULL, -- JSON array
      seo_title TEXT NOT NULL,
      seo_description TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('published', 'draft')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Activity & Audit Logs
    CREATE TABLE IF NOT EXISTS activity_logs (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- 301 Redirects Table (for 140 old URLs legacy migration requirement)
    CREATE TABLE IF NOT EXISTS redirects (
      id BIGSERIAL PRIMARY KEY,
      old_path TEXT UNIQUE NOT NULL,
      new_path TEXT NOT NULL,
      status_code INTEGER DEFAULT 301
    );
  `);

  await seedInitialData();
}

async function seedInitialData() {
  const userCount = await db.prepare("SELECT COUNT(*)::int as count FROM users").get() as { count: number };
  if (userCount.count > 0) return;

  console.log("Seeding fresh data for Company A, Kochi...");

  // Seed Staff Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, role, avatar)
    VALUES (@id, @name, @email, @role, @avatar)
  `);

  await insertUser.run({
    id: "usr_admin",
    name: "Jawahar Kurian (Founder & MD)",
    email: "admin@spicecoast.in",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  });

  await insertUser.run({
    id: "usr_editor",
    name: "Ananya Pillai (Content Editor)",
    email: "editor@spicecoast.in",
    role: "editor",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  });

  await insertUser.run({
    id: "usr_consultant",
    name: "Mathew Varghese (Senior Tour Consultant)",
    email: "consultant@spicecoast.in",
    role: "consultant",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  });

  // Seed Packages
  const insertPkg = db.prepare(`
    INSERT INTO packages (
      id, slug, title, tagline, description, duration_days, duration_nights,
      destination_summary, destinations_json, category, featured_image, gallery_json,
      inclusions_json, exclusions_json, hotel_standard_name, hotel_deluxe_name,
      hotel_luxury_name, status, current_version, created_by
    ) VALUES (
      @id, @slug, @title, @tagline, @description, @duration_days, @duration_nights,
      @destination_summary, @destinations_json, @category, @featured_image, @gallery_json,
      @inclusions_json, @exclusions_json, @hotel_standard_name, @hotel_deluxe_name,
      @hotel_luxury_name, @status, @current_version, @created_by
    )
  `);

  // Package 1: PKG-KL-07 (Directly from brief)
  await insertPkg.run({
    id: "PKG-KL-07",
    slug: "munnar-thekkady-alleppey-houseboat",
    title: "Munnar Tea Hills, Thekkady Wilds & Alleppey Houseboat",
    tagline: "The quintessential 6-day Kerala experience through mist, spices, and serene backwaters.",
    description: "Immerse yourself in God's Own Country. Breathe the crisp mountain air of Munnar's rolling tea gardens, track wildlife and spice plantations in Periyar, and glide through tranquil palm-fringed lagoons aboard a traditional thatch-roofed houseboat.",
    duration_days: 6,
    duration_nights: 5,
    destination_summary: "Munnar (2N) • Thekkady (1N) • Alleppey Houseboat (1N) • Kochi (1N)",
    destinations_json: JSON.stringify(["Munnar", "Thekkady", "Alleppey", "Kochi"]),
    category: "Family",
    featured_image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&auto=format&fit=crop",
    gallery_json: JSON.stringify([
      "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop",
    ]),
    inclusions_json: JSON.stringify([
      "Private AC Sedan/Innova for all transfers and sightseeing",
      "All accommodation on twin sharing basis with daily breakfast",
      "Overnight Houseboat cruise with all traditional Kerala meals (Lunch, Evening Tea/Snacks, Dinner, Breakfast)",
      "Munnar Eravikulam National Park & Tea Museum guided entry",
      "Periyar Spice plantation walk in Thekkady",
      "All toll, parking, driver allowances, and 5% GST included",
    ]),
    exclusions_json: JSON.stringify([
      "Airfare or train tickets to/from Kochi (COK)",
      "Personal expenses, laundry, telephone calls",
      "Any adventure sports or boat safari tickets not specified",
      "Monument entry fees & camera permits",
    ]),
    hotel_standard_name: "Silver Tips / Tea County (3-Star Boutique)",
    hotel_deluxe_name: "Fragrant Nature / Blanket Resort (4-Star Premium)",
    hotel_luxury_name: "Spice Tree Munnar & Kumarakom Lake Resort (5-Star Heritage)",
    status: "published",
    current_version: 1,
    created_by: "usr_admin",
  });

  // Package 2: PKG-SI-12 (Directly from brief)
  await insertPkg.run({
    id: "PKG-SI-12",
    slug: "madurai-rameswaram-kanyakumari-pilgrim",
    title: "Madurai, Rameswaram & Kanyakumari Sacred Southern Circuit",
    tagline: "A soul-stirring 5-day voyage across iconic Dravidian temples and the confluence of three oceans.",
    description: "Journey to the southernmost tip of the Indian subcontinent. Marvel at the kaleidoscopic gopurams of Meenakshi Amman, traverse the sea-spanning Pamban Bridge to holy Rameswaram, and witness sunset and moonrise over Vivekananda Rock Memorial in Kanyakumari.",
    duration_days: 5,
    duration_nights: 4,
    destination_summary: "Madurai (1N) • Rameswaram (2N) • Kanyakumari (1N)",
    destinations_json: JSON.stringify(["Madurai", "Rameswaram", "Kanyakumari"]),
    category: "Group",
    featured_image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop",
    gallery_json: JSON.stringify([
      "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1621847468516-1ed5d0df56fe?w=800&auto=format&fit=crop",
    ]),
    inclusions_json: JSON.stringify([
      "Dedicated air-conditioned vehicle throughout the circuit",
      "4 nights hotel stay on twin sharing with daily buffet breakfast",
      "Ferry tickets for Vivekananda Rock Memorial",
      "Special darshan coordination at Ramanathaswamy Temple",
      "Driver beta, toll fees, parking, and GST",
    ]),
    exclusions_json: JSON.stringify([
      "Train/flight tickets",
      "Lunches and dinners unless specified",
      "Ritual puja fees and priest charges",
    ]),
    hotel_standard_name: "Heritage Madurai / Hotel Daiwik Rameswaram (3-Star)",
    hotel_deluxe_name: "Courtyard by Marriott Madurai / Hyatt Place Rameswaram (4-Star)",
    hotel_luxury_name: "Gateway Hotel Pasumalai / Sparsa Resort Kanyakumari (5-Star)",
    status: "draft",
    current_version: 1,
    created_by: "usr_editor",
  });

  // Package 3: PKG-KL-03 (Honeymoon & Backwater Luxury)
  await insertPkg.run({
    id: "PKG-KL-03",
    slug: "wayanad-misty-hills-luxury-retreat",
    title: "Wayanad Rainforest & Cloud-Capped Coffee Plantations",
    tagline: "Romantic treehouses, tranquil bamboo groves, and ancient Neolithic rock shelters.",
    description: "Escape to the virgin highlands of Northern Kerala. Stay in eco-luxury resorts nestled amidst 400-acre coffee estates, explore the Edakkal Caves, and bamboo raft down the Vythiri river.",
    duration_days: 4,
    duration_nights: 3,
    destination_summary: "Calicut (Arrival) • Wayanad (3N) • Calicut (Departure)",
    destinations_json: JSON.stringify(["Wayanad", "Calicut"]),
    category: "Honeymoon",
    featured_image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=1200&auto=format&fit=crop",
    gallery_json: JSON.stringify([
      "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&auto=format&fit=crop",
    ]),
    inclusions_json: JSON.stringify([
      "Private AC luxury SUV for all transfers and sightseeing",
      "3 nights in premium rainforest villa with private plunge pool",
      "Candlelight plantation dinner and honeymoon cake with flower decor",
      "Guided bamboo rafting and spice plantation walk",
      "All driver charges, toll and GST included",
    ]),
    exclusions_json: JSON.stringify([
      "Flight or rail fares",
      "Personal items, spa therapies, optional activities",
    ]),
    hotel_standard_name: "Vythiri Village Resort (3-Star Standard)",
    hotel_deluxe_name: "Windflower Resort & Spa Wayanad (4-Star Deluxe)",
    hotel_luxury_name: "Tranquil Plantation Hideaway (5-Star Luxury)",
    status: "published",
    current_version: 1,
    created_by: "usr_admin",
  });

  // Package 4: PKG-KL-09 (South Kerala Heritage & Marari Beach)
  await insertPkg.run({
    id: "PKG-KL-09",
    slug: "kerala-grand-heritage-backwaters-beach",
    title: "Grand Kerala Panorama: Fort Kochi, Kumarakom & Marari Beach",
    tagline: "7 days of colonial port history, luxury backwater lagoons, and pristine Arabian Sea beaches.",
    description: "The ultimate leisurely Kerala escape. Discover Fort Kochi's Portuguese quarters, relax at an ultra-luxury lagoon sanctuary in Kumarakom, and unwind on the golden sands of Marari.",
    duration_days: 7,
    duration_nights: 6,
    destination_summary: "Kochi (1N) • Kumarakom (3N) • Marari Beach (2N)",
    destinations_json: JSON.stringify(["Kochi", "Kumarakom", "Marari Beach"]),
    category: "Luxury",
    featured_image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop",
    gallery_json: JSON.stringify([
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
    ]),
    inclusions_json: JSON.stringify([
      "Chauffeur-driven AC Innova Crysta throughout",
      "6 nights stay in 5-star beachfront and backwater villas",
      "Sunset motorboat cruise in Kumarakom bird sanctuary",
      "Kathakali cultural dance performance tickets in Fort Kochi",
      "All breakfasts, taxes, and 5% GST included",
    ]),
    exclusions_json: JSON.stringify([
      "Flights and travel insurance",
      "Alcoholic beverages and personal tips",
    ]),
    hotel_standard_name: "Casino Hotel Kochi & Coconut Lagoon (3-Star Standard)",
    hotel_deluxe_name: "Brunton Boatyard & Kumarakom Lake Resort (4-Star Deluxe)",
    hotel_luxury_name: "Taj Malabar Resort & Marari Beach CGH Earth (5-Star Heritage)",
    status: "published",
    current_version: 1,
    created_by: "usr_admin",
  });

  // Seed Seasonal Pricing for PKG-KL-07 (Directly from brief numbers!)
  const insertPrice = db.prepare(`
    INSERT INTO seasonal_prices (
      id, package_id, season_name, period_label, start_month, end_month,
      standard_price_pp, deluxe_price_pp, luxury_price_pp, gst_percent, note
    ) VALUES (
      @id, @package_id, @season_name, @period_label, @start_month, @end_month,
      @standard_price_pp, @deluxe_price_pp, @luxury_price_pp, @gst_percent, @note
    )
  `);

  // PKG-KL-07 Pricing
  await insertPrice.run({
    id: "PRC-KL07-PEAK",
    package_id: "PKG-KL-07",
    season_name: "Peak Season (Winter & Holidays)",
    period_label: "01 Dec – 31 Jan",
    start_month: 12,
    end_month: 1,
    standard_price_pp: 28500,
    deluxe_price_pp: 32500, // Explicitly mentioned in brief: ₹32,500
    luxury_price_pp: 46000,
    gst_percent: 5.0,
    note: "Per person on twin sharing basis. Includes 5% GST and holiday surcharges.",
  });

  await insertPrice.run({
    id: "PRC-KL07-REG",
    package_id: "PKG-KL-07",
    season_name: "Regular Season (Spring & Autumn)",
    period_label: "01 Feb – 31 May & 01 Oct – 30 Nov",
    start_month: 2,
    end_month: 5,
    standard_price_pp: 24200,
    deluxe_price_pp: 28900,
    luxury_price_pp: 39500,
    gst_percent: 5.0,
    note: "Per person on twin sharing basis. Includes 5% GST.",
  });

  await insertPrice.run({
    id: "PRC-KL07-MONSOON",
    package_id: "PKG-KL-07",
    season_name: "Monsoon Season (Ayurveda Special)",
    period_label: "01 Jun – 30 Sep",
    start_month: 6,
    end_month: 9,
    standard_price_pp: 21500,
    deluxe_price_pp: 24900, // Explicitly mentioned in brief: ₹24,900
    luxury_price_pp: 34000,
    gst_percent: 5.0,
    note: "Per person on twin sharing basis. Includes 5% GST and complimentary Ayurvedic rejuvenation session.",
  });

  // PKG-SI-12 Pricing (Madurai circuit)
  await insertPrice.run({
    id: "PRC-SI12-STD",
    package_id: "PKG-SI-12",
    season_name: "All-Year Pilgrim Season",
    period_label: "Round the year",
    start_month: 1,
    end_month: 12,
    standard_price_pp: 18750, // Explicitly mentioned in brief: ₹18,750
    deluxe_price_pp: 23500,
    luxury_price_pp: 31000,
    gst_percent: 5.0,
    note: "Per person on twin sharing basis. Includes 5% GST.",
  });

  // PKG-KL-03 Pricing (Wayanad)
  await insertPrice.run({
    id: "PRC-KL03-STD",
    package_id: "PKG-KL-03",
    season_name: "High Season (Autumn to Summer)",
    period_label: "01 Sep – 31 May",
    start_month: 9,
    end_month: 5,
    standard_price_pp: 22000,
    deluxe_price_pp: 27500,
    luxury_price_pp: 38000,
    gst_percent: 5.0,
    note: "Per person on twin sharing basis. Includes 5% GST.",
  });

  // PKG-KL-09 Pricing (Panorama)
  await insertPrice.run({
    id: "PRC-KL09-PEAK",
    package_id: "PKG-KL-09",
    season_name: "Peak Season (Winter)",
    period_label: "01 Nov – 28 Feb",
    start_month: 11,
    end_month: 2,
    standard_price_pp: 42000,
    deluxe_price_pp: 52000,
    luxury_price_pp: 74500,
    gst_percent: 5.0,
    note: "Per person on twin sharing basis. Includes 5% GST.",
  });

  // Seed Itinerary Days for PKG-KL-07
  const insertDay = db.prepare(`
    INSERT INTO itinerary_days (
      id, package_id, day_number, title, description, meals_included, overnight_location, activity_tags_json
    ) VALUES (
      @id, @package_id, @day_number, @title, @description, @meals_included, @overnight_location, @activity_tags_json
    )
  `);

  await insertDay.run({
    id: "ITN-KL07-D1",
    package_id: "PKG-KL-07",
    day_number: 1,
    title: "Arrival in Kochi & Scenic Drive to Munnar Hills",
    description: "Warm reception at Cochin International Airport (COK). Begin your breathtaking 130 km ascent through rolling misty hills, cascading Cheeyappara and Valara waterfalls. Check into your resort and spend a relaxed evening soaking in panoramic tea valley vistas.",
    meals_included: "Dinner",
    overnight_location: "Munnar",
    activity_tags_json: JSON.stringify(["Airport Pickup", "Waterfall Sightseeing", "Tea Hills"]),
  });

  await insertDay.run({
    id: "ITN-KL07-D2",
    package_id: "PKG-KL-07",
    day_number: 2,
    title: "Munnar Tea Estates & Eravikulam National Park",
    description: "Morning expedition to Eravikulam National Park, natural sanctuary of the endangered Nilgiri Tahr mountain goat. Later, tour the historic Tata Tea Museum to watch artisanal orthodox tea processing. Afternoon visit to Mattupetty Dam, Echo Point, and Rose Garden.",
    meals_included: "Breakfast, Dinner",
    overnight_location: "Munnar",
    activity_tags_json: JSON.stringify(["Nilgiri Tahr Safari", "Tea Tasting", "Boating at Mattupetty"]),
  });

  await insertDay.run({
    id: "ITN-KL07-D3",
    package_id: "PKG-KL-07",
    day_number: 3,
    title: "Munnar to Thekkady & Periyar Spice Plantation Walk",
    description: "Scenic 3.5-hour drive through cardamom hills to Thekkady. Check into resort. Afternoon guided spice plantation walk discovering cardamom, black pepper, cinnamon, vanilla, and clove groves. Evening enjoy an authentic Kalaripayattu martial arts show.",
    meals_included: "Breakfast, Dinner",
    overnight_location: "Thekkady",
    activity_tags_json: JSON.stringify(["Spice Plantation", "Kalaripayattu Show", "Periyar Wildlife"]),
  });

  await insertDay.run({
    id: "ITN-KL07-D4",
    package_id: "PKG-KL-07",
    day_number: 4,
    title: "Thekkady to Alleppey: Traditional Houseboat Cruise",
    description: "Drive downhill to the Venice of the East — Alleppey. Board your traditional Kerala Kettuvallam houseboat by 12:30 PM. Relish an authentic Kerala lunch of pearl spot fish (Karimeen) and red rice as you cruise through palm-shaded canals and paddy fields. Candlelit dinner on board.",
    meals_included: "Breakfast, Traditional Kerala Lunch, Evening Tea, Candlelight Dinner",
    overnight_location: "Alleppey Houseboat (Private AC)",
    activity_tags_json: JSON.stringify(["Houseboat Cruise", "Authentic Kerala Cuisine", "Sunset Over Backwaters"]),
  });

  await insertDay.run({
    id: "ITN-KL07-D5",
    package_id: "PKG-KL-07",
    day_number: 5,
    title: "Houseboat Sunrise & Drive to Colonial Fort Kochi",
    description: "Awake to sunrise over the tranquil backwaters and a fresh south Indian breakfast. Disembark at 9:30 AM and drive to Fort Kochi. Stroll past cantilevered Chinese Fishing Nets, Santa Cruz Cathedral Basilica, Mattancherry Dutch Palace, and Jew Town antique boutiques.",
    meals_included: "Breakfast",
    overnight_location: "Fort Kochi",
    activity_tags_json: JSON.stringify(["Chinese Fishing Nets", "Jew Town & Synagogue", "Dutch Palace"]),
  });

  await insertDay.run({
    id: "ITN-KL07-D6",
    package_id: "PKG-KL-07",
    day_number: 6,
    title: "Departure from Cochin International Airport",
    description: "Relish your final Kerala breakfast at the hotel. Savor some souvenir shopping for handpicked hill spices, banana chips, and handloom sarees before your chauffeur drops you at Cochin Airport with memories for a lifetime.",
    meals_included: "Breakfast",
    overnight_location: "Departure",
    activity_tags_json: JSON.stringify(["Airport Transfer", "Spice Shopping"]),
  });

  // Seed Initial Version Snapshot for PKG-KL-07
  const insertVersion = db.prepare(`
    INSERT INTO package_versions (
      package_id, version_number, snapshot_json, change_summary, created_by
    ) VALUES (
      @package_id, @version_number, @snapshot_json, @change_summary, @created_by
    )
  `);

  await insertVersion.run({
    package_id: "PKG-KL-07",
    version_number: 1,
    snapshot_json: JSON.stringify({
      title: "Munnar Tea Hills, Thekkady Wilds & Alleppey Houseboat",
      duration_days: 6,
      seasonal_prices: {
        peak: 32500,
        regular: 28900,
        monsoon: 24900,
      },
      status: "published",
    }),
    change_summary: "Initial baseline publication of classic 6D/5N Kerala itinerary with updated 2026-27 seasonal pricing.",
    created_by: "usr_admin",
  });

  // Seed Realistic Enquiries (including the exact sample from the brief!)
  const insertEnquiry = db.prepare(`
    INSERT INTO enquiries (
      id, package_id, source, traveller_name, email, phone, raw_message,
      status, assigned_consultant_id, dpdp_consent_given,
      ai_destination, ai_travel_dates, ai_adults, ai_kids, ai_budget_inr,
      ai_special_requests, ai_confidence, is_human_reviewed, human_corrections_json,
      suggested_package_ids_json, ai_draft_reply, created_at
    ) VALUES (
      @id, @package_id, @source, @traveller_name, @email, @phone, @raw_message,
      @status, @assigned_consultant_id, @dpdp_consent_given,
      @ai_destination, @ai_travel_dates, @ai_adults, @ai_kids, @ai_budget_inr,
      @ai_special_requests, @ai_confidence, @is_human_reviewed, @human_corrections_json,
      @suggested_package_ids_json, @ai_draft_reply, @created_at
    )
  `);

  // Enquiry 1: Exact brief sample enquiry
  await insertEnquiry.run({
    id: "ENQ-2026-001",
    package_id: "PKG-KL-07",
    source: "web_form",
    traveller_name: "Rahul Sharma",
    email: "rahul.sharma@gmail.com",
    phone: "+91 98201 54321",
    raw_message: "Hi, looking to travel with 2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must. Please let me know what options you have.",
    status: "New",
    assigned_consultant_id: "usr_consultant",
    dpdp_consent_given: 1,
    ai_destination: "Kerala (Munnar & Alleppey)",
    ai_travel_dates: "December 2026 (5-6 nights)",
    ai_adults: 2,
    ai_kids: 1,
    ai_budget_inr: 120000,
    ai_special_requests: "Private Houseboat overnight cruise is a must; traveling with 1 child",
    ai_confidence: 0.96,
    is_human_reviewed: 0,
    human_corrections_json: null,
    suggested_package_ids_json: JSON.stringify(["PKG-KL-07", "PKG-KL-09", "PKG-KL-03"]),
    ai_draft_reply: `Dear Rahul,\n\nThank you for reaching out to SpiceCoast Holidays! We would be delighted to host you and your family for your December holiday in Kerala.\n\nBased on your travel party of 2 adults and 1 child for 5-6 nights with a must-have houseboat experience, our top recommended package is:\n\n1. Munnar Tea Hills, Thekkady Wilds & Alleppey Houseboat (PKG-KL-07)\n- Duration: 6 Days / 5 Nights\n- Season: Peak Season (December)\n- Pricing: ₹32,500 per person (Deluxe tier on twin sharing basis, inclusive of 5% GST)\n- Houseboat: Dedicated private AC houseboat with all traditional Kerala meals included\n- Estimated Total for 2 adults: ₹65,000 + child with bed charges (comfortably within your ₹1.2 Lakh budget)\n\nAttached is our detailed day-wise itinerary. May we know your tentative arrival dates in Kochi so we can hold a premium lake-view room and deluxe houseboat?\n\nWarm regards,\nMathew Varghese\nSenior Tour Consultant, SpiceCoast Holidays, Kochi`,
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
  });

  // Enquiry 2: WhatsApp enquiry
  await insertEnquiry.run({
    id: "ENQ-2026-002",
    package_id: null,
    source: "whatsapp",
    traveller_name: "Sneha & Rohan Kulkarni",
    email: "rohan.kulkarni88@yahoo.com",
    phone: "+91 97654 32109",
    raw_message: "Planning our honeymoon in Kerala next month (November). We want quiet places, tea gardens and a private luxury villa with pool. 4 to 5 days. Budget around 80k to 1 lakh.",
    status: "In Review",
    assigned_consultant_id: "usr_consultant",
    dpdp_consent_given: 1,
    ai_destination: "Wayanad / Munnar",
    ai_travel_dates: "November 2026 (4-5 days)",
    ai_adults: 2,
    ai_kids: 0,
    ai_budget_inr: 95000,
    ai_special_requests: "Honeymoon special, private pool villa, secluded & quiet location",
    ai_confidence: 0.94,
    is_human_reviewed: 1,
    human_corrections_json: JSON.stringify({ ai_destination: "Wayanad Luxury Retreat" }),
    suggested_package_ids_json: JSON.stringify(["PKG-KL-03", "PKG-KL-07", "PKG-KL-09"]),
    ai_draft_reply: `Dear Sneha and Rohan,\n\nHeartiest congratulations on your upcoming wedding!\n\nFor an intimate, serene honeymoon in November, we enthusiastically recommend:\n\n1. Wayanad Rainforest & Cloud-Capped Coffee Plantations (PKG-KL-03)\n- Duration: 4 Days / 3 Nights\n- Season: High Season (November)\n- Pricing: ₹27,500 per person (Deluxe tier) / ₹38,000 per person (Luxury Private Plunge Pool Villa), both inclusive of 5% GST\n- Special Honeymoon Inclusions: Candlelight dinner in the coffee estate, flower bed decor, and private rainforest villa\n- Total: ₹55,000 to ₹76,000 for both of you, leaving ample margin within your ₹1,00,000 budget\n\nLooking forward to curating this unforgettable memory for you both.\n\nWarm regards,\nSpiceCoast Holidays Team`,
    created_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
  });

  // Enquiry 3: Foreign group enquiry via Email
  await insertEnquiry.run({
    id: "ENQ-2026-003",
    package_id: "PKG-SI-12",
    source: "email",
    traveller_name: "Dr. Evelyn Campbell",
    email: "e.campbell@edinburgh.ac.uk",
    phone: "+44 7700 900123",
    raw_message: "We are a small group of 4 senior academics from Scotland visiting South India in late January. We want an authentic temple and cultural heritage tour covering Madurai Meenakshi temple and Rameswaram. Standard hotels with twin beds are fine. Please send a quote in INR.",
    status: "Quoted",
    assigned_consultant_id: "usr_consultant",
    dpdp_consent_given: 1,
    ai_destination: "Madurai & Rameswaram",
    ai_travel_dates: "Late January 2027 (5 days)",
    ai_adults: 4,
    ai_kids: 0,
    ai_budget_inr: 100000,
    ai_special_requests: "Temple heritage focus, senior-friendly pace, twin bed rooms",
    ai_confidence: 0.98,
    is_human_reviewed: 1,
    human_corrections_json: null,
    suggested_package_ids_json: JSON.stringify(["PKG-SI-12"]),
    ai_draft_reply: `Dear Dr. Campbell,\n\nThank you for considering SpiceCoast Holidays for your South India temple expedition.\n\nWe recommend our signature:\nMadurai, Rameswaram & Kanyakumari Sacred Southern Circuit (PKG-SI-12)\n- Duration: 5 Days / 4 Nights\n- Pricing: ₹18,750 per person on twin-sharing basis (Standard 3-Star Heritage hotels, inclusive of 5% GST)\n- Includes private air-conditioned vehicle with an English-speaking heritage chauffeur, daily breakfast, and temple permits.\n- Total for 4 guests: ₹75,000 all inclusive.\n\nWe have generated Quote #QUO-2026-8819 for your review.\n\nWarm regards,\nMathew Varghese, SpiceCoast Holidays`,
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  });

  // Seed Sample Quote
  const insertQuote = db.prepare(`
    INSERT INTO quotes (
      id, enquiry_id, package_id, quote_number, traveller_name, email, phone,
      travel_date, adults_count, kids_count, selected_tier, price_per_person,
      subtotal_amount, gst_percent, gst_amount, grand_total, notes, status, created_by
    ) VALUES (
      @id, @enquiry_id, @package_id, @quote_number, @traveller_name, @email, @phone,
      @travel_date, @adults_count, @kids_count, @selected_tier, @price_per_person,
      @subtotal_amount, @gst_percent, @gst_amount, @grand_total, @notes, @status, @created_by
    )
  `);

  await insertQuote.run({
    id: "QUO-2026-8819",
    enquiry_id: "ENQ-2026-003",
    package_id: "PKG-SI-12",
    quote_number: "SCH-2026-Q8819",
    traveller_name: "Dr. Evelyn Campbell",
    email: "e.campbell@edinburgh.ac.uk",
    phone: "+44 7700 900123",
    travel_date: "2027-01-22",
    adults_count: 4,
    kids_count: 0,
    selected_tier: "Standard",
    price_per_person: 17857, // base before 5% GST: 17857 * 1.05 = 18750
    subtotal_amount: 71428,
    gst_percent: 5.0,
    gst_amount: 3572,
    grand_total: 75000,
    notes: "Includes 2 twin-sharing deluxe rooms, AC Tempo Traveller with English-speaking chauffeur, and monument entry permits.",
    status: "Sent",
    created_by: "usr_consultant",
  });

  // Seed Blog Posts (Addressing client requirement: blogs live on own site & lead readers to right package)
  const insertBlog = db.prepare(`
    INSERT INTO blogs (
      id, slug, title, excerpt, content, category, featured_image, author,
      related_package_ids_json, seo_title, seo_description, status
    ) VALUES (
      @id, @slug, @title, @excerpt, @content, @category, @featured_image, @author,
      @related_package_ids_json, @seo_title, @seo_description, @status
    )
  `);

  await insertBlog.run({
    id: "BLG-001",
    slug: "alleppey-houseboat-guide-first-timers",
    title: "Everything You Must Know Before Booking an Alleppey Houseboat Cruise",
    excerpt: "From AC timings and onboard dining menus to canal routes and peak vs monsoon pricing — your ultimate insider guide to God's Own Backwaters.",
    content: `Cruising the emerald palm-fringed backwaters of Alleppey on a private traditional houseboat (Kettuvallam) is indisputably Kerala's crowning travel experience.

Yet, dozens of travelers arrive unprepared for basic realities: not all houseboats cruise 24/7 (environmental safety laws require docking by 5:30 PM), air conditioning protocols differ between daytime and night, and peak December bookings often double in price compared to serene monsoon sailings.

### 1. Choosing Between Standard, Deluxe and Luxury
- **Deluxe Houseboats:** Feature air conditioning during the overnight docking period (typically 9:00 PM to 6:00 AM), high-quality Kerala teak interiors, and a dedicated chef.
- **Luxury & Heritage Houseboats:** Offer 24-hour centralized air conditioning, glass-walled observation lounges, sun decks, and premium en-suite bathrooms.

### 2. The Culinary Experience On Board
Your houseboat crew comprises a certified captain, an engine driver, and a dedicated private chef. Lunch typically features freshly caught backwater Karimeen (Pearl Spot) fried in coconut oil with aromatic shallots and curry leaves, alongside fragrant red rice and vegetable curries.

### 3. Which Package Should You Pick?
If you want to seamlessly combine Munnar's mountain breezes with a night on the backwaters, our 6-day package is tailored specifically to eliminate rush and guarantee lake-view berths.`,
    category: "Backwaters & Houseboats",
    featured_image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1000&auto=format&fit=crop",
    author: "Ananya Pillai",
    related_package_ids_json: JSON.stringify(["PKG-KL-07", "PKG-KL-09"]),
    seo_title: "Alleppey Houseboat Complete Guide: Pricing, Routes & Tips | SpiceCoast",
    seo_description: "Expert advice on Alleppey backwater houseboats: AC timings, meals, routes, and seasonal pricing. Book direct with SpiceCoast Holidays.",
    status: "published",
  });

  await insertBlog.run({
    id: "BLG-002",
    slug: "munnar-tea-gardens-best-time-to-visit",
    title: "The Magic of Munnar: Best Months, Hidden Viewpoints & Tea Trail Secrets",
    excerpt: "Why the misty heights of Munnar remain South India's favourite hill retreat across all seasons, and what to pack for the chilly December mornings.",
    content: `Perched at 1,600 meters above sea level in the Western Ghats, Munnar was once the favored summer resort of the British administration in South India. Today, its endless rolling carpets of emerald tea plantations make it an unmissable destination for families and honeymooners alike.

### Peak Season vs Monsoon in Munnar
- **December to February:** Crisp, chilly mornings (often dipping to 8°C) with mist hanging over the valley. Perfect for hiking in Eravikulam National Park and tea tasting.
- **June to September (Monsoon):** Heavy rain transforms the hills into vibrant neon green. Waterfalls are at peak roar, and resort tariffs drop by up to 30%.

Explore our curated Munnar itineraries with dedicated chauffeur-driven private vehicles.`,
    category: "Hill Stations",
    featured_image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1000&auto=format&fit=crop",
    author: "Ananya Pillai",
    related_package_ids_json: JSON.stringify(["PKG-KL-07", "PKG-KL-03"]),
    seo_title: "Best Time to Visit Munnar: Weather, Tea Trails & Travel Tips",
    seo_description: "Discover the best time to visit Munnar's tea plantations and viewpoints. Read our seasonal guide from local Kochi travel experts.",
    status: "published",
  });

  // Seed 301 Redirects (Demonstrating solution to "redirects from 140 old URLs")
  const insertRedirect = db.prepare(`
    INSERT INTO redirects (old_path, new_path, status_code)
    VALUES (@old_path, @new_path, @status_code)
  `);

  const oldUrls = [
    { old: "/kerala-packages/munnar-alleppey.html", target: "/packages/munnar-thekkady-alleppey-houseboat" },
    { old: "/tours/south-india-pilgrim-madurai.php", target: "/packages/madurai-rameswaram-kanyakumari-pilgrim" },
    { old: "/honeymoon-specials/wayanad-resort.asp", target: "/packages/wayanad-misty-hills-luxury-retreat" },
    { old: "/luxury/kumarakom-marari-7days", target: "/packages/kerala-grand-heritage-backwaters-beach" },
    { old: "/blog/houseboat-tips-kerala", target: "/blog/alleppey-houseboat-guide-first-timers" },
  ];

  for (const r of oldUrls) {
    await insertRedirect.run({ old_path: r.old, new_path: r.target, status_code: 301 });
  }

  // Seed Activity Log
  const insertActivity = db.prepare(`
    INSERT INTO activity_logs (user_id, user_name, action, entity_type, entity_id, details)
    VALUES (@user_id, @user_name, @action, @entity_type, @entity_id, @details)
  `);

  await insertActivity.run({
    user_id: "usr_admin",
    user_name: "Jawahar Kurian",
    action: "PACKAGE_PUBLISH",
    entity_type: "package",
    entity_id: "PKG-KL-07",
    details: "Published Munnar, Thekkady & Alleppey Houseboat with 2026-27 Peak, Regular, and Monsoon seasonal rates.",
  });

  await insertActivity.run({
    user_id: "usr_consultant",
    user_name: "Mathew Varghese",
    action: "ENQUIRY_TRIAGE",
    entity_type: "enquiry",
    entity_id: "ENQ-2026-001",
    details: "Reviewed AI extraction for Rahul Sharma (2A + 1K, Dec, ₹1.2L budget). Verified suggested PKG-KL-07.",
  });

  console.log("Database initialized and seeded successfully!");
}

export default db;
