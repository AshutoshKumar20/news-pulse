from clustering import cluster_articles
from config import FEEDS
from db import (
    existing_links,
    fetch_all_articles,
    get_connection,
    init_schema,
    insert_article,
    replace_clusters,
)
from extractor import extract_body
from feeds import fetch_all


def run():
    conn = get_connection()
    init_schema(conn)

    known_links = existing_links(conn)
    raw_articles = fetch_all(FEEDS)
    new_articles = [a for a in raw_articles if a["link"] not in known_links]

    added = 0
    for article in new_articles:
        article["body"] = extract_body(article["link"])
        inserted_id = insert_article(conn, article)
        if inserted_id:
            added += 1

    all_articles = fetch_all_articles(conn)
    clusters = cluster_articles(all_articles)
    replace_clusters(conn, clusters)

    conn.close()

    print(f"Articles added: {added}")
    print(f"Total articles: {len(all_articles)}")
    print(f"Clusters formed: {len(clusters)}")
    return {"articles_added": added, "clusters_created": len(clusters)}


if __name__ == "__main__":
    run()
