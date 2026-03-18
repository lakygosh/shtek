import { useState, useMemo } from "react";
import { toEur, toRsd } from "../data/constants";
import { Card } from "./ui";
import DonutChart from "./DonutChart";

const today = () => new Date().toISOString().slice(0, 10);

function DualAmount({ eur, big = false }) {
  const rsd = toRsd(eur);
  return (
    <div style={{ textAlign: "inherit" }}>
      <div style={{ fontSize: big ? 24 : 18, fontWeight: 700, color: "#e8e4de", fontFamily: "'DM Mono', monospace" }}>
        €{big ? eur.toFixed(0) : eur.toFixed(2)}
      </div>
      <div style={{ fontSize: big ? 11 : 10, color: "#666", fontFamily: "'DM Mono', monospace", marginTop: 1 }}>
        {rsd.toFixed(0)} RSD
      </div>
    </div>
  );
}

function QuickAdd({ onAdd, catNames }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("RSD");
  const [category, setCategory] = useState(catNames[1] || catNames[0] || "Other");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());

  const submit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    const eurAmount = currency === "RSD" ? toEur(val) : val;
    onAdd({ id: Date.now(), date, amount: eurAmount, category, description: description.trim() || category });
    setAmount("");
    setDescription("");
  };

  const preview = parseFloat(amount) > 0
    ? currency === "RSD"
      ? `= €${toEur(parseFloat(amount)).toFixed(2)}`
      : `= ${toRsd(parseFloat(amount)).toFixed(0)} RSD`
    : null;

  return (
    <form onSubmit={submit} className="quick-add">
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={labelStyle}>Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={labelStyle}>Amount</label>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <button type="button" onClick={() => setCurrency(c => c === "RSD" ? "EUR" : "RSD")}
            style={{
              background: "#2a2520", border: "1px solid #333", borderRight: "none",
              color: currency === "RSD" ? "#D4C5A9" : "#8FB996",
              fontSize: 11, fontWeight: 600, padding: "8px 8px",
              borderRadius: "6px 0 0 6px", cursor: "pointer", flexShrink: 0,
              width: 38, textAlign: "center",
            }}>
            {currency === "RSD" ? "RSD" : "EUR"}
          </button>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0" step={currency === "RSD" ? "1" : "0.01"} min="0"
            style={{ ...inputStyle, width: "100%", borderRadius: "0 6px 6px 0" }} />
        </div>
        {preview && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>{preview}</div>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={labelStyle}>Category</label>
        <select value={category} onChange={e => setCategory(e.target.value)}
          style={{ ...inputStyle, cursor: "pointer", width: "100%" }}>
          {catNames.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="qa-desc" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <label style={labelStyle}>What was it?</label>
        <input value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Coffee, bus ticket, groceries…"
          style={{ ...inputStyle, width: "100%" }} />
      </div>
      <button className="qa-btn" type="submit" style={{
        padding: "10px 20px", background: "#8FB996", color: "#121010", border: "none",
        borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer",
      }}>+ Add</button>
    </form>
  );
}

function EditForm({ entry, catNames, catColors, onSave, onCancel }) {
  const [amount, setAmount] = useState(toRsd(entry.amount).toFixed(0));
  const [currency, setCurrency] = useState("RSD");
  const [category, setCategory] = useState(entry.category);
  const [description, setDescription] = useState(entry.description);
  const [date, setDate] = useState(entry.date);

  const save = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    const eurAmount = currency === "RSD" ? toEur(val) : val;
    onSave(entry.id, { amount: eurAmount, category, description: description.trim() || category, date });
  };

  return (
    <div style={{
      background: "#222018", borderRadius: 8, padding: 10, marginBottom: 4,
      border: "1px solid #333",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <div style={fieldLabel}>Date</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, width: "100%", fontSize: 13, padding: "6px 8px" }} />
        </div>
        <div>
          <div style={fieldLabel}>Amount</div>
          <div style={{ display: "flex", gap: 0 }}>
            <button type="button" onClick={() => {
              const val = parseFloat(amount);
              if (val > 0) {
                if (currency === "RSD") { setAmount(toEur(val).toFixed(2)); setCurrency("EUR"); }
                else { setAmount(toRsd(val).toFixed(0)); setCurrency("RSD"); }
              } else { setCurrency(c => c === "RSD" ? "EUR" : "RSD"); }
            }}
              style={{
                background: "#2a2520", border: "1px solid #333", borderRight: "none",
                color: currency === "RSD" ? "#D4C5A9" : "#8FB996",
                fontSize: 10, fontWeight: 600, padding: "6px 6px",
                borderRadius: "6px 0 0 6px", cursor: "pointer", width: 32,
              }}>
              {currency === "RSD" ? "RSD" : "EUR"}
            </button>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              step={currency === "RSD" ? "1" : "0.01"}
              style={{ ...inputStyle, width: "100%", fontSize: 13, padding: "6px 8px", borderRadius: "0 6px 6px 0" }} />
          </div>
        </div>
        <div>
          <div style={fieldLabel}>Category</div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            style={{ ...inputStyle, width: "100%", fontSize: 13, padding: "6px 8px", cursor: "pointer" }}>
            {catNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={fieldLabel}>Description</div>
          <input value={description} onChange={e => setDescription(e.target.value)}
            style={{ ...inputStyle, width: "100%", fontSize: 13, padding: "6px 8px" }} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{
          background: "none", border: "1px solid #333", color: "#888",
          borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer",
        }}>Cancel</button>
        <button onClick={save} style={{
          background: "#8FB996", border: "none", color: "#121010",
          borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>Save</button>
      </div>
    </div>
  );
}

function DayGroup({ date, entries, catNames, catColors, onEdit, onUpdate, onDelete, editingId }) {
  const d = new Date(date + "T12:00:00");
  const dayLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const isToday = date === today();
  const total = entries.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: isToday ? "#8FB996" : "#c5bfb5" }}>
          {isToday ? "Today" : dayLabel}
        </span>
        {!isToday && <span style={{ fontSize: 11, color: "#555" }}>{date}</span>}
        <div style={{ flex: 1, borderBottom: "1px solid #2a2520" }} />
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#e8e4de", fontFamily: "'DM Mono', monospace" }}>€{total.toFixed(2)}</span>
          <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace" }}>{toRsd(total).toFixed(0)} RSD</div>
        </div>
      </div>
      {entries.map(e => (
        editingId === e.id ? (
          <EditForm key={e.id} entry={e} catNames={catNames} catColors={catColors}
            onSave={(id, fields) => { onUpdate(id, fields); onEdit(null); }}
            onCancel={() => onEdit(null)} />
        ) : (
          <div key={e.id}
            onClick={() => onEdit(e.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 6px",
              borderRadius: 6, marginBottom: 1, cursor: "pointer",
              transition: "background 0.1s",
            }}
            onMouseEnter={ev => ev.currentTarget.style.background = "#1e1a16"}
            onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
            <span style={{ width: 8, height: 8, borderRadius: 2, flexShrink: 0, background: catColors[e.category] || "#666" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "#c5bfb5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.description}</div>
              <div style={{ fontSize: 10, color: "#555" }}>{e.category}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e4de", fontFamily: "'DM Mono', monospace" }}>€{e.amount.toFixed(2)}</div>
              <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace" }}>{toRsd(e.amount).toFixed(0)} din</div>
            </div>
            <button onClick={ev => { ev.stopPropagation(); onDelete(e.id); }}
              style={{ background: "none", border: "none", color: "#553333", cursor: "pointer", fontSize: 16, padding: "4px 6px", borderRadius: 4, lineHeight: 1, flexShrink: 0 }}>×</button>
          </div>
        )
      ))}
    </div>
  );
}

export default function DailyLog({ entries, addEntry, updateEntry, deleteEntry, catNames, catColors }) {
  const [filterMonth, setFilterMonth] = useState(today().slice(0, 7));
  const [filterCategory, setFilterCategory] = useState("All");
  const [editingId, setEditingId] = useState(null);

  const stats = useMemo(() => {
    const now = today();
    const currentMonth = now.slice(0, 7);
    const todayEntries = entries.filter(e => e.date === now);
    const monthEntries = entries.filter(e => e.date.startsWith(currentMonth));
    const todayTotal = todayEntries.reduce((s, e) => s + e.amount, 0);
    const monthTotal = monthEntries.reduce((s, e) => s + e.amount, 0);
    const daysWithEntries = new Set(monthEntries.map(e => e.date)).size;
    const dailyAvg = daysWithEntries > 0 ? monthTotal / daysWithEntries : 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekStr = weekAgo.toISOString().slice(0, 10);
    const weekEntries = entries.filter(e => e.date >= weekStr && e.date <= now);
    const weekTotal = weekEntries.reduce((s, e) => s + e.amount, 0);
    return { todayTotal, weekTotal, monthTotal, dailyAvg };
  }, [entries]);

  const filtered = useMemo(() => {
    return entries
      .filter(e => e.date.startsWith(filterMonth))
      .filter(e => filterCategory === "All" || e.category === filterCategory)
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  }, [entries, filterMonth, filterCategory]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of filtered) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date).push(e);
    }
    return [...map.entries()];
  }, [filtered]);

  const catBreakdown = useMemo(() => {
    return catNames.map(c => ({
      label: c, color: catColors[c] || "#666",
      value: filtered.filter(e => e.category === c).reduce((s, e) => s + e.amount, 0),
    })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
  }, [filtered, catNames, catColors]);

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  const months = useMemo(() => {
    const set = new Set(entries.map(e => e.date.slice(0, 7)));
    set.add(today().slice(0, 7));
    return [...set].sort().reverse();
  }, [entries]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <h3 style={{ margin: "0 0 10px", fontSize: 13, color: "#888", fontWeight: 500 }}>LOG EXPENSE</h3>
        <QuickAdd onAdd={addEntry} catNames={catNames} />
      </Card>

      <Card>
        <div className="stats-grid">
          <div style={{ textAlign: "center", padding: "10px 8px" }}>
            <div style={statLabel}>Today</div>
            <DualAmount eur={stats.todayTotal} />
          </div>
          <div style={{ textAlign: "center", padding: "10px 8px" }}>
            <div style={statLabel}>Last 7 Days</div>
            <DualAmount eur={stats.weekTotal} />
          </div>
          <div style={{ textAlign: "center", padding: "10px 8px" }}>
            <div style={statLabel}>This Month</div>
            <DualAmount eur={stats.monthTotal} big />
          </div>
          <div style={{ textAlign: "center", padding: "10px 8px" }}>
            <div style={statLabel}>Daily Avg</div>
            <DualAmount eur={stats.dailyAvg} />
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ background: "#1e1a16", border: "1px solid #333", color: "#c5bfb5", fontSize: 13, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          style={{ background: "#1e1a16", border: "1px solid #333", color: filterCategory === "All" ? "#c5bfb5" : catColors[filterCategory] || "#c5bfb5", fontSize: 13, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>
          <option value="All">All categories</option>
          {catNames.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "#555" }}>{filtered.length} entries</span>
        <div style={{ flex: 1 }} />
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 14, color: "#e8e4de", fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>€{filteredTotal.toFixed(0)}</span>
          <div style={{ fontSize: 10, color: "#555", fontFamily: "'DM Mono', monospace" }}>{toRsd(filteredTotal).toFixed(0)} RSD</div>
        </div>
      </div>

      <div className="daily-split">
        <Card className="daily-chart" style={{ alignSelf: "flex-start" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <DonutChart data={catBreakdown} size={160} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 10 }}>
            {catBreakdown.map(d => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span style={{ color: "#a09888", flex: 1 }}>{d.label}</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "#c5bfb5", fontFamily: "'DM Mono', monospace" }}>€{d.value.toFixed(0)}</span>
                  <div style={{ fontSize: 9, color: "#555", fontFamily: "'DM Mono', monospace" }}>{toRsd(d.value).toFixed(0)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="daily-list">
          {grouped.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "#555" }}>
              <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.4 }}>📝</div>
              <div style={{ fontSize: 14 }}>No entries for {filterMonth}</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Add your first expense above</div>
            </div>
          ) : (
            grouped.map(([date, dayEntries]) => (
              <DayGroup key={date} date={date} entries={dayEntries}
                catNames={catNames} catColors={catColors}
                onEdit={setEditingId} onUpdate={updateEntry} onDelete={deleteEntry}
                editingId={editingId} />
            ))
          )}
        </Card>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" };
const fieldLabel = { fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 3 };
const statLabel = { fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 3 };
const inputStyle = {
  background: "#1e1a16", border: "1px solid #333", color: "#e8e4de",
  fontSize: 14, borderRadius: 6, padding: "8px 10px", outline: "none",
};
