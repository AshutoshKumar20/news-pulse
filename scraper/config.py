import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
CLUSTER_MIN_SHARED_WORDS = int(os.environ.get("CLUSTER_MIN_SHARED_WORDS", 3))
MIN_WORD_LENGTH = int(os.environ.get("MIN_WORD_LENGTH", 4))

FEEDS = [
    {"source": "BBC News", "url": "http://feeds.bbci.co.uk/news/rss.xml"},
    {"source": "NPR", "url": "https://feeds.npr.org/1001/rss.xml"},
    {"source": "Al Jazeera", "url": "https://www.aljazeera.com/xml/rss/all.xml"},
]

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Copy .env.example to .env and fill it in.")
