import trafilatura
from trafilatura.settings import use_config

_config = use_config()
_config.set("DEFAULT", "DOWNLOAD_TIMEOUT", "10")


def extract_body(url):
    try:
        downloaded = trafilatura.fetch_url(url, config=_config)
        if not downloaded:
            return None
        return trafilatura.extract(downloaded, config=_config)
    except Exception as e:
        print(f"Body extraction failed for {url}: {e}")
        return None