"use client";

export default function ClusterDetail({ cluster, onClose }) {
  if (!cluster) return null;

  return (
    <div className="cluster-detail">
      <div className="cluster-detail-header">
        <h2>{cluster.label}</h2>
        <button onClick={onClose}>Close</button>
      </div>
      <ul>
        {cluster.articles.map((a) => (
          <li key={a.id}>
            <a href={a.link} target="_blank" rel="noreferrer">
              {a.title}
            </a>
            <div className="meta">
              {a.source} - {a.published_at ? new Date(a.published_at).toLocaleString() : "date unknown"}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
