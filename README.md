# ProposalPilot

**Client proposals powered by your own Claude — with zero AI inside the app.**

ProposalPilot lets freelancers and agencies connect their own Claude account via **MCP (Model Context Protocol)**. Paste messy discovery call notes into Claude, and Claude drafts a structured proposal directly into your ProposalPilot workspace. You review and edit it in your dashboard, publish it, and share a live link where your client can **Accept & Sign** or **Request Changes**.

- **Zero AI cost:** No OpenAI, Anthropic, Gemini, or other AI SDKs/keys anywhere in this codebase.
- **Human in the loop:** Claude can only create/update drafts; only the human agency can publish.
- **Live & persistent:** Public client links, view tracking, electronic acceptance + timestamp/IP, and print-to-PDF support.

---

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Database & Auth:** Supabase (Postgres + Row Level Security + Email/Password Auth)
- **MCP Server:** `@modelcontextprotocol/sdk` (`WebStandardStreamableHTTPServerTransport`) at `/api/mcp/[token]`
- **Validation:** `zod`
- **Hosting:** Vercel

---

## 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your Supabase dashboard and run the entire contents of [`supabase/migrations/0001_initial_schema.sql`](./supabase/migrations/0001_initial_schema.sql).
   - This creates the `agencies` and `proposals` tables, `updated_at` triggers, automatic agency profile creation on signup, and **Row Level Security (RLS)** policies.
3. In **Authentication → Providers → Email**, ensure Email/Password is enabled. (For instant local testing without email verification, you can disable *"Confirm email"* under **Authentication → Providers → Email**.)
4. Copy your Project URL, `anon` public key, and `service_role` secret key from **Project Settings → API**.

---

## 2. Local Setup

```bash
cd proposal-pilot
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Seed the demo account (`demo@proposalpilot.app` / `Demo@12345`) and sample published proposal:

```bash
npm run seed
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 3. Deploy to Vercel

1. Push the `proposal-pilot` repository to GitHub (or deploy directly with `npx vercel`).
2. In Vercel Project Settings → **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your live `https://your-app.vercel.app` URL)
3. Deploy!

---

## 4. How to Connect to Claude (MCP)

1. Sign in to ProposalPilot and go to **MCP Settings** (`/settings`).
2. Copy your private MCP URL: `https://<your-domain>/api/mcp/<your-token>`.
   *(Note: Claude's web connector requires a public HTTPS URL such as your Vercel deployment or an ngrok tunnel for local testing.)*
3. In **Claude**, go to **Settings → Connectors → Add custom connector**.
4. Name it **ProposalPilot** and paste your MCP URL.
5. Start a new chat in Claude and try this prompt:

```text
Turn these call notes into a proposal for Acme Corp: logo + brand kit for $3,500, 3 weeks. Notes: They need a primary logo, color palette, typography system, and brand guidelines PDF. 50% upfront, 50% on final delivery.
```

Claude will call `create_proposal` and return your `dashboard_url`. Open it, edit any details, click **Publish**, and share the public `/p/[slug]` link with your client!
