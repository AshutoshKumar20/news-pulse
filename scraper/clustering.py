import re
from collections import Counter

from config import CLUSTER_MIN_SHARED_WORDS, MIN_WORD_LENGTH
from stopwords import STOP_WORDS

WORD_RE = re.compile(r"[a-zA-Z]+")


def significant_words(text):
    words = WORD_RE.findall(text.lower())
    return {w for w in words if len(w) >= MIN_WORD_LENGTH and w not in STOP_WORDS}


def build_word_sets(articles):
    word_sets = {}
    for a in articles:
        text = f"{a['title']} {a.get('summary') or ''}"
        word_sets[a["id"]] = significant_words(text)
    return word_sets


def cluster_articles(articles):
    """
    Groups articles that share at least CLUSTER_MIN_SHARED_WORDS
    significant words in their title/summary. Two articles get an
    edge if their overlap crosses the threshold, then each connected
    component in that graph becomes one cluster.
    """
    word_sets = build_word_sets(articles)
    ids = list(word_sets.keys())

    adjacency = {i: set() for i in ids}
    for x in range(len(ids)):
        for y in range(x + 1, len(ids)):
            a, b = ids[x], ids[y]
            shared = word_sets[a] & word_sets[b]
            if len(shared) >= CLUSTER_MIN_SHARED_WORDS:
                adjacency[a].add(b)
                adjacency[b].add(a)

    visited = set()
    components = []
    for start in ids:
        if start in visited:
            continue
        stack = [start]
        component = []
        while stack:
            node = stack.pop()
            if node in visited:
                continue
            visited.add(node)
            component.append(node)
            stack.extend(adjacency[node] - visited)
        components.append(component)

    result = []
    for component in components:
        label = label_cluster(component, word_sets)
        result.append(
            {
                "article_ids": component,
                "label": label,
                "keywords": label.split(),
            }
        )
    return result


def label_cluster(article_ids, word_sets):
    counter = Counter()
    for aid in article_ids:
        counter.update(word_sets[aid])
    top = [w for w, _ in counter.most_common(3)]
    return " ".join(top).title() if top else "General"
