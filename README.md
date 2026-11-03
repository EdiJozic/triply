# Triply

Triply is a travel-planning workspace with a public introduction, account flows, trip and itinerary planning, an expense tracker, saved destinations, and an AI travel companion. Its default demo works without provider credentials and clearly identifies suggestions, places, map details, and estimates that have not been independently verified.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```powershell
cd AI\triply
npm install
Copy-Item .env.example .env.local
npm run dev
```

Open [http://localhost:3000/welcome](http://localhost:3000/welcome) for the public page, or [http://localhost:3000/login](http://localhost:3000/login) to sign in or enter the demo workspace. Demo trips and saved places are stored in the current browser's local storage; they are not shared across browsers or devices.

## Configuration

Set values in `.env.local` (never commit that file):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for account authentication |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key; never put a service-role key here |
| `ANTHROPIC_API_KEY` | Enables server-side itinerary generation and assistant responses |
| `ANTHROPIC_MODEL` | Optional Anthropic model override |
| `OPENWEATHER_API_KEY` | Server-side key for the weather endpoint |
| `MAPBOX_ACCESS_TOKEN`, `GOOGLE_MAPS_API_KEY` | Reserved optional map-provider configuration |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Reserved for email invitations |

Without an Anthropic key, the itinerary planner returns deterministic, visibly labeled demo ideas. The assistant likewise uses a demo response. The OpenWeather route returns a configuration error when its key is absent; the interface does not claim to show live weather. Destination cards, photos, map markers, and prices in demo content are illustrative, not verified listings or quotes.

### Supabase setup

1. Create a Supabase project and configure the public URL and anon/publishable key.
2. Apply [`supabase/migrations/202611030001_triply_schema.sql`](./supabase/migrations/202611030001_triply_schema.sql) in the Supabase SQL editor or with the Supabase CLI.
3. Configure the Supabase Auth email and redirect settings for local and deployed URLs.
4. Restart Next.js after changing environment variables.

The migration defines the relational schema, ownership/member policies, and private storage policies. The current workspace still persists trip, itinerary, expense, and saved-place edits in browser local storage; the database schema is a foundation, not a wired-up persistence layer. Do not treat demo mode as a production multi-user deployment.

## Available scripts

```powershell
npm run dev
npm run lint
npm run build
npm run test:e2e
npm run start
```

`npm run test:e2e` runs the Chromium suite against the production build on port 3100. Build the app first with `npm run build`; install the browser once with `npx playwright install chromium` if it is not already available.

## API routes

- `POST /api/trip-planner` — validates trip input, then returns a validated Anthropic or deterministic demo itinerary.
- `GET /api/trip-planner` — reports whether the server has an Anthropic key (never returns the key).
- `POST /api/trip-assistant` — validates trip context and prompt before using the server-side assistant or demo response.
- `GET /api/weather?city=...` — uses OpenWeather when configured; otherwise responds with an explicit unavailable error.

AI suggestions are starting points only. Confirm destinations, accessibility, travel conditions, availability, hours, and prices directly with local sources.

## Deployment

Deploy the Next.js project from `AI/triply` to Vercel. Add only the required environment variables in the deployment's secret settings, configure Supabase Auth redirect URLs for the deployed domain, and apply the migration to the intended Supabase project. Verify account authentication and database access with real test accounts before enabling public use. No Supabase project, live AI provider, map provider, email provider, or deployment is configured by this repository alone.
# triply
