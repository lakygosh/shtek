import { useState } from "react";
import { Card } from "./ui";

const STATUSES = ["open", "in_progress", "resolved", "closed"];
const STATUS_COLORS = { open: "#D4C5A9", in_progress: "#B8C5E3", resolved: "#8FB996", closed: "#666" };
const TYPE_ICONS = { bug: "🐛", suggestion: "💡", question: "❓" };

export default function AdminReports({ items, onUpdate, onDelete }) {
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [noteEditing, setNoteEditing] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const filtered = filter === "all" ? items : items.filter(f => f.status === filter);

  const counts = {
    all: items.length,
    open: items.filter(f => f.status === "open").length,
    in_progress: items.filter(f => f.status === "in_progress").length,
    resolved: items.filter(f => f.status === "resolved").length,
    closed: items.filter(f => f.status === "closed").length,
  };

  const startEditNote = (item) => {
    setNoteEditing(item.id);
    setNoteText(item.admin_note || "");
  };

  const saveNote = (id) => {
    onUpdate(id, { admin_note: noteText });
    setNoteEditing(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#e8e4de", marginBottom: 4 }}>User Reports</div>
        <div style={{ fontSize: 12, color: "#888" }}>Feedback, bug reports, and questions from users</div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["all", ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            background: filter === s ? "#2a2520" : "transparent",
            border: `1px solid ${filter === s ? (STATUS_COLORS[s] || "#8FB996") : "#2a2520"}`,
            borderRadius: 6, padding: "5px 10px", cursor: "pointer",
            color: filter === s ? (STATUS_COLORS[s] || "#e8e4de") : "#888",
            fontSize: 12, fontFamily: "inherit",
          }}>
            {s === "all" ? "All" : s.replace("_", " ")} ({counts[s]})
          </button>
        ))}
      </div>

      {/* Stats */}
      <Card style={{ background: "#1a1916", border: "1px solid #2a2820" }}>
        <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#D4C5A9", fontFamily: "'DM Mono', monospace" }}>{counts.open}</div>
            <div style={{ fontSize: 10, color: "#888" }}>Open</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#B8C5E3", fontFamily: "'DM Mono', monospace" }}>{counts.in_progress}</div>
            <div style={{ fontSize: 10, color: "#888" }}>In Progress</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#8FB996", fontFamily: "'DM Mono', monospace" }}>{counts.resolved}</div>
            <div style={{ fontSize: 10, color: "#888" }}>Resolved</div>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#666", fontFamily: "'DM Mono', monospace" }}>{counts.closed}</div>
            <div style={{ fontSize: 10, color: "#888" }}>Closed</div>
          </div>
        </div>
      </Card>

      {/* Items */}
      {filtered.length === 0 && (
        <Card style={{ textAlign: "center", padding: "30px 20px" }}>
          <div style={{ fontSize: 13, color: "#666" }}>No reports {filter !== "all" ? `with status "${filter.replace("_", " ")}"` : "yet"}</div>
        </Card>
      )}

      {filtered.map(f => {
        const isExpanded = expandedId === f.id;
        const statusColor = STATUS_COLORS[f.status] || "#888";
        return (
          <Card key={f.id} style={{ padding: 14 }}>
            {/* Header row */}
            <button onClick={() => setExpandedId(isExpanded ? null : f.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit", padding: 0 }}>
              <span style={{ fontSize: 16 }}>{TYPE_ICONS[f.type] || "💬"}</span>
              <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#e8e4de", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: isExpanded ? "normal" : "nowrap" }}>
                  {f.message}
                </div>
                <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                  {f.user_email} · {new Date(f.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              <span style={{
                fontSize: 10, padding: "3px 8px", borderRadius: 4,
                background: `${statusColor}20`, color: statusColor, fontWeight: 600, flexShrink: 0,
              }}>
                {f.status.replace("_", " ")}
              </span>
            </button>

            {/* Expanded details */}
            {isExpanded && (
              <div style={{ marginTop: 12, borderTop: "1px solid #2a2520", paddingTop: 12 }}>
                {/* Full message */}
                <div style={{ fontSize: 13, color: "#c5bfb5", lineHeight: 1.6, marginBottom: 12, whiteSpace: "pre-wrap" }}>
                  {f.message}
                </div>

                {/* Status change */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Status</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => onUpdate(f.id, { status: s })} style={{
                        background: f.status === s ? `${STATUS_COLORS[s]}20` : "#1e1a16",
                        border: `1px solid ${f.status === s ? STATUS_COLORS[s] : "#333"}`,
                        borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                        color: f.status === s ? STATUS_COLORS[s] : "#888",
                        fontSize: 11, fontFamily: "inherit",
                      }}>
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Admin note */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Admin Note</div>
                  {noteEditing === f.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={2}
                        style={{
                          flex: 1, background: "#1e1a16", border: "1px solid #333", color: "#e8e4de",
                          fontSize: 12, borderRadius: 6, padding: "8px 10px", outline: "none", resize: "vertical", fontFamily: "inherit",
                        }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <button onClick={() => saveNote(f.id)} style={{
                          background: "#8FB996", border: "none", borderRadius: 6,
                          padding: "6px 10px", color: "#121010", fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}>Save</button>
                        <button onClick={() => setNoteEditing(null)} style={{
                          background: "#2a2520", border: "1px solid #333", borderRadius: 6,
                          padding: "6px 10px", color: "#888", fontSize: 11, cursor: "pointer",
                        }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => startEditNote(f)} style={{
                      background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                      color: f.admin_note ? "#c5bfb5" : "#555", fontSize: 12, padding: 0, textAlign: "left",
                    }}>
                      {f.admin_note || "Click to add a note..."}
                    </button>
                  )}
                </div>

                {/* Delete */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {confirmDeleteId === f.id ? (
                    <button onClick={() => { onDelete(f.id); setConfirmDeleteId(null); setExpandedId(null); }} style={{
                      background: "#4a2020", border: "1px solid #6a3030", borderRadius: 6,
                      padding: "6px 12px", color: "#e8e4de", fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}>Confirm Delete</button>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(f.id)} style={{
                      background: "none", border: "1px solid #4a2020", borderRadius: 6,
                      padding: "6px 12px", color: "#D49A9A", fontSize: 11, cursor: "pointer",
                    }}>Delete</button>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
