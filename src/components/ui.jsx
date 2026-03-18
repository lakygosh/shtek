export function NumberInput({ label, value, onChange, prefix = "€", suffix = "", small = false, step = 1 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: small ? "none" : "1 1 auto", minWidth: 0 }}>
      <label style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {prefix && <span style={{ color: "#666", fontSize: 13 }}>{prefix}</span>}
        <input type="number" value={value} step={step}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            background: "#1e1a16", border: "1px solid #333", color: "#e8e4de",
            fontSize: small ? 13 : 15, width: "100%", maxWidth: small ? 80 : 130,
            borderRadius: 6, padding: "8px 10px", outline: "none",
          }} />
        {suffix && <span style={{ color: "#666", fontSize: 13 }}>{suffix}</span>}
      </div>
    </div>
  );
}

export function Card({ children, style = {}, className = "" }) {
  return (
    <div className={className} style={{ background: "#1a1714", border: "1px solid #2a2520", borderRadius: 12, padding: 16, ...style }}>
      {children}
    </div>
  );
}

export function StatBox({ label, value, sub, color = "#e8e4de", big = false }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 8px" }}>
      <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: big ? 24 : 18, fontWeight: 700, color, fontFamily: "'DM Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
