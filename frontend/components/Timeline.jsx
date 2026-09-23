"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

function intensityColor(intensity) {
  const lightness = 75 - intensity * 45;
  return `hsl(216, 70%, ${lightness}%)`;
}

function ClusterTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const entry = payload.find((p) => p.dataKey === "duration");
  if (!entry) return null;
  const { label, article_count, start_time, end_time } = entry.payload;
  return (
    <div
      style={{
        background: "white",
        padding: "8px 12px",
        borderRadius: 6,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        fontSize: 13,
      }}
    >
      <strong>{label}</strong>
      <div>{article_count} articles</div>
      <div>
        {new Date(start_time).toLocaleDateString()} - {new Date(end_time).toLocaleDateString()}
      </div>
    </div>
  );
}

export default function Timeline({ data, onSelect }) {
  if (!data.length) {
    return <p className="empty">No clusters yet. Trigger a refresh to pull articles.</p>;
  }

  const times = data.flatMap((d) => [
    new Date(d.start_time).getTime(),
    new Date(d.end_time).getTime(),
  ]);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = Math.max(max - min, 1);

  const chartData = data.map((d) => {
    const start = new Date(d.start_time).getTime();
    const end = new Date(d.end_time).getTime();
    return {
      ...d,
      offset: start - min,
      duration: Math.max(end - start, span * 0.01),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 50)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
        <XAxis
          type="number"
          domain={[0, span]}
          tickFormatter={(val) => new Date(min + val).toLocaleDateString()}
        />
        <YAxis type="category" dataKey="label" width={160} />
        <Tooltip content={<ClusterTooltip />} />
        <Bar dataKey="offset" stackId="a" fill="transparent" />
        <Bar dataKey="duration" stackId="a" cursor="pointer" onClick={(entry) => onSelect(entry.id)}>
          {chartData.map((entry) => (
            <Cell key={entry.id} fill={intensityColor(entry.intensity)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
