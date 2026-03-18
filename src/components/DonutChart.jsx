export default function DonutChart({ data, size = 180, centerLabel, centerSub }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: 13 }}>
        No data yet
      </div>
    );
  }

  let cumAngle = 0;
  const arcs = data.filter(d => d.value > 0).map((d) => {
    const angle = (d.value / total) * 360;
    const start = cumAngle;
    cumAngle += angle;
    return { ...d, start, angle };
  });

  const r = size / 2 - 4, cx = size / 2, cy = size / 2, ir = r * 0.62;
  const labelText = centerLabel !== undefined ? centerLabel : `€${total.toFixed(0)}`;
  const subText = centerSub !== undefined ? centerSub : "/month";
  // Scale font to fit inside inner circle
  const innerDia = ir * 2;
  const mainFontSize = Math.min(Math.floor(innerDia * 0.22), 16);
  const subFontSize = Math.min(Math.floor(innerDia * 0.15), 10);

  function arc(startDeg, endDeg, radius) {
    const s = ((startDeg - 90) * Math.PI) / 180;
    const e = ((endDeg - 90) * Math.PI) / 180;
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return {
      x1: cx + radius * Math.cos(s), y1: cy + radius * Math.sin(s),
      x2: cx + radius * Math.cos(e), y2: cy + radius * Math.sin(e), large,
    };
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => {
        const end = a.start + Math.max(a.angle - 0.8, 0.1);
        const o = arc(a.start, end, r);
        const inner = arc(a.start, end, ir);
        return (
          <path key={i}
            d={`M${o.x1},${o.y1} A${r},${r} 0 ${o.large} 1 ${o.x2},${o.y2} L${inner.x2},${inner.y2} A${ir},${ir} 0 ${o.large} 0 ${inner.x1},${inner.y1} Z`}
            fill={a.color} opacity="0.85" />
        );
      })}
      <text x={cx} y={cy - mainFontSize * 0.2} textAnchor="middle" fill="#e8e4de" fontSize={mainFontSize} fontWeight="600">
        {labelText}
      </text>
      <text x={cx} y={cy + mainFontSize * 0.9} textAnchor="middle" fill="#a09888" fontSize={subFontSize}>{subText}</text>
    </svg>
  );
}
