# News Pulse - Scraper

## Approach used: keyword/word-overlap grouping (Option A)

No TF-IDF or ML library. Each article's title + summary is reduced to a set
of "significant words" (lowercase, alphabetic only, 4+ characters, common
stop words removed). Two articles are linked if they share at least
`CLUSTER_MIN_SHARED_WORDS` (default 3) significant words. Clusters are the
connected components of that graph - built with a simple adjacency list and
iterative DFS, no external graph library.

Each cluster is labeled with its 3 most frequent shared words, title-cased.

### Why this approach

Headlines and summaries about the same real-world event reliably reuse the
same nouns and proper names (e.g. "election", "senate", "vote", a
politician's surname). Word overlap catches that without needing a training
step or extra dependencies, and it's easy to explain and defend, which
matters more here than marginal clustering accuracy.

### Why the threshold is 3

Tested against a mixed batch of BBC/NPR/Al Jazeera headlines: most
unrelated headline pairs share 0-1 significant words (common ones like
"government" or "president" show up across unrelated stories, but rarely
2+ together). Real duplicate-story pairs typically shared 4-8 words. A
threshold of 3 catches genuine matches while staying above the noise floor
from generic political/news vocabulary. It's a config value
(`CLUSTER_MIN_SHARED_WORDS` in `.env`), not hardcoded, so it can be tuned
without touching code.

### Known limitation

Pure word-overlap has no concept of synonyms or paraphrasing. Two articles
about the same event using different vocabulary ("wildfire" vs "blaze")
will not cluster together even though a human would group them instantly.
A production version would need at least a synonym-aware normalization
step or a move to TF-IDF/embeddings (Option B) to fix this.

## Sources used

- BBC News (http://feeds.bbci.co.uk/news/rss.xml)
- NPR (https://feeds.npr.org/1001/rss.xml)
- Al Jazeera (https://www.aljazeera.com/xml/rss/all.xml)

## Handling messy feeds

- Field differences (`<description>` vs `<content:encoded>`): handled in
  `feeds.py` by checking `entry.content` first, falling back to
  `entry.summary`/`entry.description`.
- Missing/inconsistent dates: `feedparser` normalizes most date formats
  into `published_parsed`/`updated_parsed` structs; if both are missing,
  `published_at` is stored as `NULL` rather than crashing the run.
- Full article body: extracted per-article with `trafilatura`, wrapped in
  try/except. A page that fails to parse just gets `body = NULL` and the
  pipeline keeps going.
- Duplicates across runs: `articles.link` has a unique constraint, and the
  pipeline pre-filters against already-known links before even attempting
  extraction, so repeated runs only do work for genuinely new articles.

## Running it

```
pip install -r requirements.txt
cp .env.example .env   # fill in DATABASE_URL
python3 pipeline.py
```
