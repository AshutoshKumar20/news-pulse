# News Pulse - Backend

Express API in front of the Postgres database the scraper writes to.

## Endpoints

- `GET /clusters` - all clusters: id, label, article_count, start_time, end_time
- `GET /clusters/:id` - one cluster with all its articles, sorted by published_at
- `GET /timeline` - clusters shaped for a chart: start_time, end_time,
  article_count, intensity (article_count normalized 0-1 against the
  biggest cluster, used for the frontend's visual sizing)
- `GET /sources` - distinct list of article sources, for the filter UI
- `POST /ingest/trigger` - spawns `scraper/pipeline.py`, returns `{ jobId }` immediately
- `GET /ingest/status/:jobId` - poll this for job status (`running`, `done`, `failed`)

`/clusters` and `/timeline` both accept an optional `?sources=BBC News,NPR`
query param to filter by source.

## Error handling

- Invalid `:id`/`:jobId` (not a number) -> 400
- Cluster or job not found -> 404
- Unhandled errors -> 500, logged server-side, generic message returned to
  the client
- Unmatched routes -> 404 JSON response

## Env vars

```
DATABASE_URL     Postgres connection string
PORT             defaults to 4000
PYTHON_PATH      how to invoke python3 on the host, defaults to "python3"
SCRAPER_DIR      path to the scraper folder, defaults to "../scraper"
SCRAPER_ENTRY    entry script name, defaults to "pipeline.py"
```

## Running it

```
npm install
cp .env.example .env
npm start
```
