"use client";

export default function SourceFilter({ sources, selected, onChange }) {
  function toggle(source) {
    if (selected.includes(source)) {
      onChange(selected.filter((s) => s !== source));
    } else {
      onChange([...selected, source]);
    }
  }

  if (!sources.length) return null;

  return (
    <div className="source-filter">
      {sources.map((s) => (
        <label key={s}>
          <input type="checkbox" checked={selected.includes(s)} onChange={() => toggle(s)} />
          {s}
        </label>
      ))}
    </div>
  );
}
