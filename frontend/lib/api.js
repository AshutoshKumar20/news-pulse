const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function getTimeline(sources) {
  const params = sources && sources.length ? `?sources=${sources.join(",")}` : "";
  const res = await fetch(`${API_URL}/timeline${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load timeline");
  return res.json();
}

export async function getClusterDetail(id) {
  const res = await fetch(`${API_URL}/clusters/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load cluster");
  return res.json();
}

export async function getSources() {
  const res = await fetch(`${API_URL}/sources`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load sources");
  return res.json();
}

export async function triggerIngest() {
  const res = await fetch(`${API_URL}/ingest/trigger`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to trigger ingest");
  return res.json();
}

export async function getIngestStatus(jobId) {
  const res = await fetch(`${API_URL}/ingest/status/${jobId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch job status");
  return res.json();
}
