import trafilatura


def extract_body(url):
    try:
        downloaded = trafilatura.fetch_url(url)
        if not downloaded:
            return None
        return trafilatura.extract(downloaded)
    except Exception as e:
        print(f"Body extraction failed for {url}: {e}")
        return None
