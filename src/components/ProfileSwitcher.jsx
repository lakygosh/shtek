import { useState } from "react";

export default function ProfileSwitcher({ profiles, activeProfile, onSwitch, onCreate, onRename, onDelete }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    onCreate(name);
    setNewName("");
    setCreating(false);
    setOpen(false);
  };

  const startRename = (p) => {
    setEditingId(p.id);
    setEditName(p.name);
  };

  const commitRename = () => {
    if (editName.trim()) onRename(editingId, editName.trim());
    setEditingId(null);
  };

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "#2a2520", border: "1px solid #333", borderRadius: 8,
        padding: "5px 12px", cursor: "pointer", transition: "border-color 0.2s",
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = "#555"}
        onMouseLeave={e => e.currentTarget.style.borderColor = "#333"}>
        <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#3a3530", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#c5bfb5", fontWeight: 600 }}>
          {activeProfile.name.charAt(0).toUpperCase()}
        </span>
        <span style={{ fontSize: 13, color: "#c5bfb5", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {activeProfile.name}
        </span>
        <span style={{ fontSize: 10, color: "#666", marginLeft: 2 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <>
          <div onClick={() => { setOpen(false); setCreating(false); }}
            style={{ position: "fixed", inset: 0, zIndex: 99 }} />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 100,
            background: "#1e1a16", border: "1px solid #333", borderRadius: 10,
            padding: 6, minWidth: 220, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}>
            <div style={{ padding: "6px 10px", fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Profiles
            </div>

            {profiles.map(p => (
              <div key={p.id} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                borderRadius: 6, cursor: "pointer",
                background: p.id === activeProfile.id ? "#2a2520" : "transparent",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => { if (p.id !== activeProfile.id) e.currentTarget.style.background = "#222"; }}
                onMouseLeave={e => { if (p.id !== activeProfile.id) e.currentTarget.style.background = "transparent"; }}
                onClick={() => { if (editingId !== p.id) { onSwitch(p.id); setOpen(false); } }}>
                <span style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: p.id === activeProfile.id ? "#8FB996" : "#3a3530",
                  color: p.id === activeProfile.id ? "#121010" : "#888",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                }}>
                  {p.name.charAt(0).toUpperCase()}
                </span>

                {editingId === p.id ? (
                  <input value={editName} onChange={e => setEditName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setEditingId(null); }}
                    onClick={e => e.stopPropagation()} autoFocus
                    style={{ background: "#1a1714", border: "1px solid #444", color: "#e8e4de", fontSize: 13, borderRadius: 4, padding: "2px 6px", outline: "none", flex: 1 }} />
                ) : (
                  <span style={{ fontSize: 13, color: "#c5bfb5", flex: 1 }}>{p.name}</span>
                )}

                {p.id === activeProfile.id && editingId !== p.id && (
                  <span style={{ fontSize: 10, color: "#8FB996" }}>active</span>
                )}

                {editingId !== p.id && (
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={e => { e.stopPropagation(); startRename(p); }}
                      style={iconBtnStyle} title="Rename">✎</button>
                    {profiles.length > 1 && (
                      <button onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                        style={{ ...iconBtnStyle, color: "#553333" }}
                        onMouseEnter={e => e.currentTarget.style.color = "#cc5555"}
                        onMouseLeave={e => e.currentTarget.style.color = "#553333"}
                        title="Delete">×</button>
                    )}
                  </div>
                )}
              </div>
            ))}

            <div style={{ borderTop: "1px solid #2a2520", marginTop: 4, paddingTop: 4 }}>
              {creating ? (
                <div style={{ display: "flex", gap: 6, padding: "6px 10px" }}>
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="Profile name…" autoFocus
                    onKeyDown={e => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") setCreating(false); }}
                    style={{ background: "#1a1714", border: "1px solid #444", color: "#e8e4de", fontSize: 13, borderRadius: 4, padding: "4px 8px", outline: "none", flex: 1 }} />
                  <button onClick={handleCreate}
                    style={{ background: "#8FB996", color: "#121010", border: "none", borderRadius: 4, padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Add
                  </button>
                </div>
              ) : (
                <button onClick={() => setCreating(true)}
                  style={{
                    width: "100%", padding: "8px 10px", background: "none", border: "none",
                    color: "#888", fontSize: 12, cursor: "pointer", textAlign: "left", borderRadius: 6,
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#8FB996"}
                  onMouseLeave={e => e.currentTarget.style.color = "#888"}>
                  + New Profile
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const iconBtnStyle = {
  background: "none", border: "none", color: "#555", cursor: "pointer",
  fontSize: 13, padding: "2px 4px", borderRadius: 4, lineHeight: 1,
};
