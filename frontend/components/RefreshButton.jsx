"use client";

import { useState } from "react";
import { getIngestStatus, triggerIngest } from "../lib/api";

export default function RefreshButton({ onDone }) {
  const [status, setStatus] = useState("idle");

  async function handleClick() {
    setStatus("starting");
    try {
      const { jobId } = await triggerIngest();
      setStatus("running");
      poll(jobId);
    } catch (err) {
      setStatus("error");
    }
  }

  function poll(jobId) {
    const interval = setInterval(async () => {
      try {
        const job = await getIngestStatus(jobId);
        if (job.status === "done") {
          clearInterval(interval);
          setStatus("idle");
          onDone();
        } else if (job.status === "failed") {
          clearInterval(interval);
          setStatus("error");
        }
      } catch (err) {
        clearInterval(interval);
        setStatus("error");
      }
    }, 2000);
  }

  return (
    <button onClick={handleClick} disabled={status === "running" || status === "starting"}>
      {status === "running" || status === "starting" ? "Refreshing..." : "Refresh data"}
    </button>
  );
}
