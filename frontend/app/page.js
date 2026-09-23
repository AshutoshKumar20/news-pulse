"use client";

import { useCallback, useEffect, useState } from "react";
import ClusterDetail from "../components/ClusterDetail";
import RefreshButton from "../components/RefreshButton";
import SourceFilter from "../components/SourceFilter";
import Timeline from "../components/Timeline";
import { getClusterDetail, getSources, getTimeline } from "../lib/api";

export default function Home() {
  const [timeline, setTimeline] = useState([]);
  const [sources, setSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [activeCluster, setActiveCluster] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [timelineData, sourceList] = await Promise.all([
        getTimeline(selectedSources),
        getSources(),
      ]);
      setTimeline(timelineData);
      setSources(sourceList);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [selectedSources]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleSelect(id) {
    const detail = await getClusterDetail(id);
    setActiveCluster(detail);
  }

  return (
    <main>
      <header>
        <h1>News Pulse</h1>
        <RefreshButton onDone={load} />
      </header>

      {error && <p className="error">{error}</p>}

      <SourceFilter sources={sources} selected={selectedSources} onChange={setSelectedSources} />

      <Timeline data={timeline} onSelect={handleSelect} />

      {activeCluster && (
        <ClusterDetail cluster={activeCluster} onClose={() => setActiveCluster(null)} />
      )}
    </main>
  );
}
