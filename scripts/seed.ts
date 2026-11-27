import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "demo@proposalpilot.app";
const DEMO_PASSWORD = "Demo@12345";
const DEMO_AGENCY_NAME = "Northstar Creative Studio";

async function main() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY in environment."
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Find or create demo auth user
  const { data: usersData, error: listError } =
    await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  let userId = usersData.users.find((u) => u.email === DEMO_EMAIL)?.id;

  if (!userId) {
    const { data: createdUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { agency_name: DEMO_AGENCY_NAME },
      });

    if (createError || !createdUser.user) {
      console.error("Failed to create demo user:", createError?.message);
      process.exit(1);
    }
    userId = createdUser.user.id;
    console.log("Created demo auth user:", DEMO_EMAIL);
  } else {
    console.log("Demo auth user already exists:", DEMO_EMAIL);
  }

  // 2. Ensure agency row exists
  const { data: existingAgency } = await supabase
    .from("agencies")
    .select("id")
    .eq("id", userId)
    .single();

  if (!existingAgency) {
    const { error: agencyError } = await supabase.from("agencies").insert({
      id: userId,
      name: DEMO_AGENCY_NAME,
      email: DEMO_EMAIL,
      mcp_token: crypto.randomBytes(24).toString("hex"),
    });
    if (agencyError) {
      console.error("Failed to create agency row:", agencyError.message);
      process.exit(1);
    }
  }

  // 3. Upsert sample published proposal
  const sampleSlug = "acme-brand-kit-demo";
  const { data: existingProposal } = await supabase
    .from("proposals")
    .select("id")
    .eq("slug", sampleSlug)
    .single();

  if (!existingProposal) {
    const validUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const { error: proposalError } = await supabase.from("proposals").insert({
      agency_id: userId,
      slug: sampleSlug,
      client_name: "Acme Corp",
      title: "Brand Identity & Logo Refresh",
      executive_summary:
        "A focused 3-week brand refresh for Acme Corp to modernize your visual identity across web, product, and marketing collateral.",
      scope:
        "### What is included\n\n- **Brand Discovery & Audit**: Review existing assets, competitors, and positioning.\n- **Primary & Secondary Logo Marks**: Vector SVG, PNG, and monochrome variants.\n- **Visual System**: Color palette (HEX/RGB), typography pairing, and spacing rules.\n- **Brand Guidelines PDF**: A concise 12-page usage guide for your team.",
      deliverables: [
        {
          title: "Primary & Secondary Logo Suite",
          description: "Full-color, dark, and light SVG/PNG exports ready for web and print.",
        },
        {
          title: "Color & Typography System",
          description: "Accessible web palette and licensed font pairing recommendations.",
        },
        {
          title: "Brand Guidelines PDF",
          description: "Clear rules for logo spacing, misuse, and social templates.",
        },
      ],
      timeline: [
        {
          phase: "Week 1: Discovery & Concepts",
          duration: "5 days",
          description: "Kickoff workshop and 3 distinct visual direction concepts.",
        },
        {
          phase: "Week 2: Refinement",
          duration: "5 days",
          description: "Two rounds of revisions on the chosen logo and palette.",
        },
        {
          phase: "Week 3: Final Handoff",
          duration: "5 days",
          description: "Final asset exports and Brand Guidelines PDF delivery.",
        },
      ],
      line_items: [
        {
          description: "Logo Suite & Visual Identity Design",
          quantity: 1,
          unit_price: 2500,
        },
        {
          description: "Brand Guidelines Document & Asset Kit",
          quantity: 1,
          unit_price: 1000,
        },
      ],
      currency: "USD",
      terms:
        "50% deposit upon proposal acceptance ($1,750). Remaining 50% due upon final asset delivery ($1,750). Includes up to 2 rounds of revisions.",
      valid_until: validUntil,
      status: "published",
    });

    if (proposalError) {
      console.error("Failed to insert sample proposal:", proposalError.message);
      process.exit(1);
    }
    console.log("Created sample published proposal:", sampleSlug);
  } else {
    console.log("Sample proposal already exists:", sampleSlug);
  }

  console.log("\nSeed complete!");
  console.log(`Login email:    ${DEMO_EMAIL}`);
  console.log(`Login password: ${DEMO_PASSWORD}`);
  console.log(`Sample public URL: /p/${sampleSlug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
