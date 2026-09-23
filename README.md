# News Pulse

A topic-clustered news timeline. Pulls articles from public RSS feeds, groups
articles about the same story into clusters, and shows them as a timeline.

## Architecture

```
scraper/    Python. Pulls RSS feeds, extracts full article text, clusters
            articles by shared keywords, writes everything to Postgres.
backend/    Node.js + Express. Serves clusters/articles/timeline as REST
            endpoints. Runs the scraper as a subprocess on demand.
frontend/   Next.js + Recharts. Timeline view, cluster detail, source
            filter, refresh button.
```

All three parts share one Postgres database. The scraper is the only piece
that writes to it. The backend only reads, except for the `ingest_jobs`
table which it manages for job status tracking.

## Data flow

1. User clicks "Refresh data" in the frontend.
2. Frontend calls `POST /ingest/trigger` on the backend.
3. Backend creates an `ingest_jobs` row and spawns `scraper/pipeline.py` as
   a subprocess.
4. Pipeline fetches the 3 configured RSS feeds, skips articles already in
   the database (by link), extracts full body text for new articles, then
   re-clusters the entire article set and rewrites the `clusters` table.
5. Backend watches the subprocess and marks the job `done` or `failed`.
6. Frontend polls `GET /ingest/status/:jobId` every 2 seconds, then
   refetches `/timeline` once the job is done.

## Setup (local)

Requires Node 18+, Python 3.10+, and a Postgres database (Neon, Supabase,
or local Postgres all work).

```
# 1. Scraper
cd scraper
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL
python3 pipeline.py    # creates tables on first run, then ingests + clusters

# 2. Backend
cd ../backend
npm install
cp .env.example .env   # fill in DATABASE_URL, and SCRAPER_DIR if needed
npm start               # runs on http://localhost:4000

# 3. Frontend
cd ../frontend
npm install
cp .env.local.example .env.local   # point NEXT_PUBLIC_API_URL at the backend
npm run dev              # runs on http://localhost:3000
```

## What runs where (deployment)

| Part | Platform | Why |
|---|---|---|
| Database | Neon (Postgres) | Free tier, persistent across restarts |
| Backend | Render (Node web service) | Free tier, supports subprocess spawning |
| Frontend | Vercel | Native Next.js support, free tier |
| Scraper | Not deployed separately | Runs as a subprocess of the backend, triggered via `POST /ingest/trigger`. Render's backend instance has Python 3 available at the OS level; the scraper folder is deployed alongside the backend repo so the subprocess can find it. |

Environment variables (`DATABASE_URL`, `NEXT_PUBLIC_API_URL`, etc.) are set
in each platform's dashboard, not committed to the repo.

## Assumptions made (per assignment's "note ambiguity in README")

- Re-clustering runs on the full article set on every pipeline run, not
  incrementally on new articles only. This keeps cluster membership
  consistent (an old article can join a new cluster if a related new story
  comes in) at the cost of being more expensive as the dataset grows. Fine
  at the scale of a few hundred articles.
- A cluster of exactly one article (no other article shares enough
  keywords with it) is still stored as a valid single-article cluster,
  not dropped.
- Articles missing a `pubDate` are stored with `published_at = NULL` and
  sorted last wherever timestamps are used.
- The source filter is applied at the database query level (both
  `/clusters` and `/timeline` accept a `?sources=` query param), so
  filtering recomputes cluster time ranges and counts for the filtered
  article set rather than just hiding rows client-side.
