from datetime import datetime, timezone
from time import mktime

import feedparser


def parse_published(entry):
    for key in ("published_parsed", "updated_parsed"):
        val = entry.get(key)
        if val:
            return datetime.fromtimestamp(mktime(val), tz=timezone.utc)
    return None


def extract_summary(entry):
    if entry.get("content"):
        return entry["content"][0].get("value", "")
    return entry.get("summary") or entry.get("description") or ""


def fetch_feed(source, url):
    parsed = feedparser.parse(url)
    articles = []
    for entry in parsed.entries:
        link = entry.get("link")
        title = entry.get("title")
        if not link or not title:
            continue
        articles.append(
            {
                "source": source,
                "title": title.strip(),
                "link": link.strip(),
                "summary": extract_summary(entry).strip(),
                "published_at": parse_published(entry),
            }
        )
    return articles


def fetch_all(feed_list):
    all_articles = []
    for feed in feed_list:
        try:
            all_articles.extend(fetch_feed(feed["source"], feed["url"]))
        except Exception as e:
            print(f"Skipping feed {feed['source']} ({feed['url']}): {e}")
    return all_articles
