import { useState, useRef, useCallback } from "react";
import { PRIORITIES, FREQ_MULTIPLIERS, PRIO_COLORS, monthCost } from "../data/constants";
import DonutChart from "./DonutChart";
import BarChart from "./BarChart";

const selBase = {
  background: "#1e1a16", border: "1px solid #333", color: "#c5bfb5",
  fontSize: 12, borderRadius: 4, padding: "4px 6px", cursor: "pointer", width: "100%",
};
const numInput = {
  background: "#1e1a16", border: "1px solid #333", color: "#e8e4de",
  fontSize: 14, width: "100%", borderRadius: 4, padding: "6px 8px", outline: "none",
};

/* ── Mobile card for a single expense ── */
function ExpenseCard({ item, onChange, onDelete, catNames, catColors }) {
  const mc = monthCost(item.amount, item.frequency);
  return (
    <div style={{
      background: "#1e1a16", borderRadius: 10, padding: 12,
      border: "1px solid #2a2520", display: "flex", flexDirection: "column", gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: catColors[item.category], flexShrink: 0 }} />
        <input value={item.name} onChange={e => onChange({ ...item, name: e.target.value })} placeholder="Expense name…"
          style={{ background: "transparent", border: "none", color: "#e8e4de", fontSize: 15, fontWeight: 500, outline: "none", flex: 1, minWidth: 0, padding: 0 }} />
        <button onClick={onDelete}
          style={{ background: "none", border: "none", color: "#553333", cursor: "pointer", fontSize: 18, padding: "4px 6px", borderRadius: 4, lineHeight: 1, flexShrink: 0 }}>×</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div>
          <div style={fieldLabel}>Amount</div>
          <input type="number" value={item.amount || ""} placeholder="0"
            onChange={e => onChange({ ...item, amount: parseFloat(e.target.value) || 0 })}
            style={numInput} />
        </div>
        <div>
          <div style={fieldLabel}>Frequency</div>
          <select value={item.frequency} onChange={e => onChange({ ...item, frequency: e.target.value })} style={selBase}>
            {Object.keys(FREQ_MULTIPLIERS).map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <div style={fieldLabel}>Category</div>
          <select value={item.category} onChange={e => onChange({ ...item, category: e.target.value })} style={selBase}>
            {catNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <div style={fieldLabel}>Priority</div>
          <select value={item.priority} onChange={e => onChange({ ...item, priority: e.target.value })}
            style={{ ...selBase, color: PRIO_COLORS[item.priority] }}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, borderTop: "1px solid #2a2520" }}>
        <input value={item.notes} onChange={e => onChange({ ...item, notes: e.target.value })} placeholder="Add a note…"
          style={{ background: "transparent", border: "none", color: "#666", fontSize: 12, fontStyle: "italic", outline: "none", flex: 1, padding: 0 }} />
        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#8FB996", fontFamily: "'DM Mono', monospace" }}>€{mc.toFixed(0)}<span style={{ fontSize: 10, color: "#666", fontWeight: 400 }}>/mo</span></span>
        </div>
      </div>
    </div>
  );
}

/* ── Desktop table row ── */
function DragRow({ item, index, onChange, onDelete, dragState, onDragStart, onDragEnter, onDragEnd, catNames, catColors }) {
  const mc = monthCost(item.amount, item.frequency);
  const isDragging = dragState.dragging === index;
  const isOver = dragState.over === index && dragState.dragging !== index;
  const inputBase = { background: "transparent", border: "none", color: "#e8e4de", fontSize: 13, width: "100%", outline: "none" };

  return (
    <tr draggable
      onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(index); }}
      onDragEnter={() => onDragEnter(index)}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      style={{
        borderTop: isOver ? "2px solid #8FB996" : "none",
        borderBottom: isOver ? "none" : "1px solid #2a2520",
        opacity: isDragging ? 0.3 : 1,
        background: isDragging ? "#1a1714" : "transparent",
        transition: "opacity 0.15s",
      }}>
      <td style={{ padding: "7px 2px", width: 28, color: "#444", fontSize: 16, textAlign: "center", cursor: "grab", userSelect: "none", lineHeight: 1 }}>⠿</td>
      <td style={{ padding: "7px 8px" }}>
        <input value={item.name} onChange={e => onChange({ ...item, name: e.target.value })} placeholder="Expense name…"
          style={{ ...inputBase, fontWeight: 500 }} />
      </td>
      <td style={{ padding: "7px 4px" }}>
        <select value={item.category} onChange={e => onChange({ ...item, category: e.target.value })} style={selBase}>{catNames.map(c => <option key={c} value={c}>{c}</option>)}</select>
      </td>
      <td style={{ padding: "7px 4px" }}>
        <select value={item.priority} onChange={e => onChange({ ...item, priority: e.target.value })} style={{ ...selBase, color: PRIO_COLORS[item.priority] }}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select>
      </td>
      <td style={{ padding: "7px 4px" }}>
        <input type="number" value={item.amount || ""} placeholder="0"
          onChange={e => onChange({ ...item, amount: parseFloat(e.target.value) || 0 })}
          style={{ background: "#1e1a16", border: "1px solid #333", color: "#e8e4de", fontSize: 13, width: 72, borderRadius: 4, padding: "4px 8px", outline: "none" }} />
      </td>
      <td style={{ padding: "7px 4px" }}>
        <select value={item.frequency} onChange={e => onChange({ ...item, frequency: e.target.value })} style={selBase}>{Object.keys(FREQ_MULTIPLIERS).map(f => <option key={f} value={f}>{f}</option>)}</select>
      </td>
      <td style={{ padding: "7px 8px", color: "#8FB996", fontSize: 13, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>€{mc.toFixed(0)}</td>
      <td style={{ padding: "7px 8px", color: "#a09888", fontSize: 12, fontFamily: "'DM Mono', monospace" }}>€{(mc * 12).toFixed(0)}</td>
      <td style={{ padding: "7px 4px" }}>
        <input value={item.notes} onChange={e => onChange({ ...item, notes: e.target.value })} placeholder="—"
          style={{ ...inputBase, color: "#777", fontSize: 11, fontStyle: "italic" }} />
      </td>
      <td style={{ padding: "7px 4px" }}>
        <button onClick={onDelete} style={{ background: "none", border: "none", color: "#553333", cursor: "pointer", fontSize: 15, padding: "2px 4px", borderRadius: 4, lineHeight: 1 }}>×</button>
      </td>
    </tr>
  );
}

export default function ExpenseTable({ items, setItems, catNames, catColors }) {
  const [dragState, setDragState] = useState({ dragging: null, over: null });
  const dragNode = useRef(null);

  const onDragStart = useCallback((idx) => { dragNode.current = idx; setDragState({ dragging: idx, over: null }); }, []);
  const onDragEnter = useCallback((idx) => { if (dragNode.current === null) return; setDragState(prev => ({ ...prev, over: idx })); }, []);
  const onDragEnd = useCallback(() => {
    const from = dragNode.current, to = dragState.over;
    if (from !== null && to !== null && from !== to) {
      const copy = [...items];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      setItems(copy);
    }
    setDragState({ dragging: null, over: null });
    dragNode.current = null;
  }, [dragState.over, setItems, items]);

  const addRow = () => setItems([...items, { id: crypto.randomUUID(), name: "", category: "Other", priority: "Important", amount: 0, frequency: "Monthly", notes: "" }]);
  const update = (updated) => setItems(items.map(i => i.id === updated.id ? updated : i));
  const remove = (id) => setItems(items.filter(i => i.id !== id));

  const totalMonthly = items.reduce((s, i) => s + monthCost(i.amount, i.frequency), 0);
  const catData = catNames.map(c => ({
    label: c, color: catColors[c],
    value: items.filter(i => i.category === c).reduce((s, i) => s + monthCost(i.amount, i.frequency), 0),
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  return (
    <div>
      {/* Charts */}
      <div className="charts-area" style={{ marginBottom: 20 }}>
        <div style={{ minWidth: 140 }}>
          <DonutChart data={catData} size={160} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", marginTop: 8, justifyContent: "center" }}>
            {catData.map(d => (
              <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#a09888" }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: d.color, display: "inline-block" }} />{d.label}
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "2 1 200px", minWidth: 0, width: "100%" }}>
          <BarChart data={catData} />
        </div>
      </div>

      {/* Total bar (always visible) */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 12px", background: "#222018", borderRadius: 8, marginBottom: 12,
      }}>
        <span style={{ color: "#c5bfb5", fontWeight: 600, fontSize: 13 }}>TOTAL</span>
        <div style={{ display: "flex", gap: 16 }}>
          <span style={{ color: "#8FB996", fontWeight: 700, fontSize: 16, fontFamily: "'DM Mono', monospace" }}>€{totalMonthly.toFixed(0)}<span style={{ fontSize: 11, color: "#666", fontWeight: 400 }}>/mo</span></span>
          <span style={{ color: "#a09888", fontSize: 13, fontFamily: "'DM Mono', monospace" }}>€{(totalMonthly * 12).toFixed(0)}<span style={{ fontSize: 10, color: "#555" }}>/yr</span></span>
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="expense-cards">
        {items.map(item => (
          <ExpenseCard key={item.id} item={item} onChange={update} onDelete={() => remove(item.id)} catNames={catNames} catColors={catColors} />
        ))}
      </div>

      {/* Desktop: table */}
      <div className="expense-table-wrap">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
              {["", "Expense", "Category", "Priority", "Amount (€)", "Frequency", "Monthly", "Annual", "Notes", ""].map((h, i) => (
                <th key={i} style={{ padding: "8px 8px 8px 4px", color: "#666", fontWeight: 500, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <DragRow key={item.id} item={item} index={idx} onChange={update} onDelete={() => remove(item.id)}
                dragState={dragState} onDragStart={onDragStart} onDragEnter={onDragEnter} onDragEnd={onDragEnd}
                catNames={catNames} catColors={catColors} />
            ))}
          </tbody>
        </table>
      </div>

      <button onClick={addRow} style={{
        marginTop: 12, padding: "10px 0", width: "100%",
        background: "transparent", border: "1px dashed #444", color: "#888",
        borderRadius: 8, cursor: "pointer", fontSize: 13, transition: "all 0.2s",
      }}>+ Add Expense</button>
    </div>
  );
}

const fieldLabel = { fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 3 };
