import psycopg2
import psycopg2.extras
from config import DATABASE_URL


def get_connection():
    return psycopg2.connect(DATABASE_URL)


def init_schema(conn):
    with open("schema.sql") as f:
        sql = f.read()
    with conn, conn.cursor() as cur:
        cur.execute(sql)


def existing_links(conn):
    with conn.cursor() as cur:
        cur.execute("SELECT link FROM articles")
        return {row[0] for row in cur.fetchall()}


def insert_article(conn, article):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO articles (source, title, link, summary, body, published_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (link) DO NOTHING
            RETURNING id
            """,
            (
                article["source"],
                article["title"],
                article["link"],
                article["summary"],
                article["body"],
                article["published_at"],
            ),
        )
        row = cur.fetchone()
        conn.commit()
        return row[0] if row else None


def fetch_all_articles(conn):
    with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
        cur.execute("SELECT id, source, title, summary, published_at FROM articles")
        return cur.fetchall()


def replace_clusters(conn, clusters):
    with conn, conn.cursor() as cur:
        cur.execute("UPDATE articles SET cluster_id = NULL")
        cur.execute("DELETE FROM clusters")
        for c in clusters:
            cur.execute(
                "INSERT INTO clusters (label, keywords) VALUES (%s, %s) RETURNING id",
                (c["label"], c["keywords"]),
            )
            cluster_id = cur.fetchone()[0]
            if c["article_ids"]:
                cur.execute(
                    "UPDATE articles SET cluster_id = %s WHERE id = ANY(%s)",
                    (cluster_id, c["article_ids"]),
                )
