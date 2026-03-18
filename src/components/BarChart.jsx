export default function BarChart({ data }) {
  if (!data.length) return null;
  const mx = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 90, fontSize: 11, color: "#c5bfb5", textAlign: "right", flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.label}
          </div>
          <div style={{ flex: 1, height: 18, background: "#2a2520", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: `${(d.value / mx) * 100}%`, height: "100%", background: d.color || "#8FB996", borderRadius: 4, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ width: 60, fontSize: 11, color: "#a09888", flexShrink: 0 }}>€{d.value.toFixed(0)}</div>
        </div>
      ))}
    </div>
  );
}
