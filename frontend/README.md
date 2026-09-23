# News Pulse - Frontend

Next.js app. Single page: timeline chart, source filter, refresh button,
cluster detail panel.

## Pieces

- `components/Timeline.jsx` - Recharts horizontal bar chart, built with the
  stacked-bar trick (an invisible offset bar + a visible duration bar) to
  turn a normal bar chart into a range/Gantt-style timeline. Bar color
  intensity scales with article count for the cluster.
- `components/ClusterDetail.jsx` - shows all articles in a clicked cluster:
  headline (links out), source, published time.
- `components/SourceFilter.jsx` - checkboxes, drives the `?sources=`
  query param sent to the backend.
- `components/RefreshButton.jsx` - calls `POST /ingest/trigger`, polls
  `GET /ingest/status/:jobId` every 2s, refetches the timeline on completion.
- `app/page.js` also polls `/timeline` every 60s on its own, so the view
  updates even if someone else triggers a refresh (auto-refresh stretch goal).

## Env vars

```
NEXT_PUBLIC_API_URL   backend base URL, e.g. http://localhost:4000
```

## Running it

```
npm install
cp .env.local.example .env.local
npm run dev
```
