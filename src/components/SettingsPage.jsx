import { useState } from "react";
import { PALETTE, DEFAULT_CATEGORIES } from "../data/constants";
import { Card } from "./ui";

function CategoryRow({ cat, onRename, onChangeColor, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [showPalette, setShowPalette] = useState(false);

  const commitRename = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== cat.name) onRename(trimmed);
    else setName(cat.name);
    setEditing(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
      background: "#1e1a16", borderRadius: 8, marginBottom: 6,
    }}>
      <div style={{ position: "relative" }}>
        <button onClick={() => setShowPalette(!showPalette)}
          style={{
            width: 24, height: 24, borderRadius: 6, background: cat.color,
            border: "2px solid #333", cursor: "pointer", flexShrink: 0,
          }} />
        {showPalette && (
          <>
            <div onClick={() => setShowPalette(false)} style={{ position: "fixed", inset: 0, zIndex: 99 }} />
            <div style={{
              position: "absolute", top: 30, left: 0, zIndex: 100,
              background: "#1a1714", border: "1px solid #333", borderRadius: 8,
              padding: 8, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              {PALETTE.map(c => (
                <button key={c} onClick={() => { onChangeColor(c); setShowPalette(false); }}
                  style={{
                    width: 24, height: 24, borderRadius: 4, background: c,
                    border: c === cat.color ? "2px solid #e8e4de" : "2px solid transparent",
                    cursor: "pointer",
                  }} />
              ))}
            </div>
          </>
        )}
      </div>
      {editing ? (
        <input value={name} onChange={e => setName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={e => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setName(cat.name); setEditing(false); } }}
          autoFocus
          style={{
            background: "#121010", border: "1px solid #444", color: "#e8e4de",
            fontSize: 14, borderRadius: 4, padding: "4px 8px", outline: "none", flex: 1, minWidth: 0,
          }} />
      ) : (
        <span onClick={() => { if (!cat.builtin) setEditing(true); }}
          style={{
            fontSize: 14, color: "#c5bfb5", flex: 1,
            cursor: cat.builtin ? "default" : "pointer",
          }}>
          {cat.name}
          {cat.builtin && <span style={{ fontSize: 10, color: "#555", marginLeft: 6 }}>built-in</span>}
        </span>
      )}
      <button onClick={onDelete}
        style={{
          background: "none", border: "none", color: "#553333", cursor: "pointer",
          fontSize: 16, padding: "4px 6px", borderRadius: 4, lineHeight: 1, flexShrink: 0,
        }}>×</button>
    </div>
  );
}

export default function SettingsPage({ categories, customCategories, hiddenCategories, onUpdateCategories, onUpdateHiddenCategories, user, onSignOut }) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PALETTE[4]);

  const addCategory = () => {
    const name = newName.trim();
    if (!name) return;
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) return;
    onUpdateCategories([...customCategories, { name, color: newColor }]);
    setNewName("");
    // pick next unused color
    const used = new Set([...categories.map(c => c.color), newColor]);
    const next = PALETTE.find(c => !used.has(c)) || PALETTE[0];
    setNewColor(next);
  };

  const renameCustom = (oldName, newName) => {
    onUpdateCategories(customCategories.map(c => c.name === oldName ? { ...c, name: newName } : c));
  };

  const recolorCustom = (name, color) => {
    onUpdateCategories(customCategories.map(c => c.name === name ? { ...c, color } : c));
  };

  const deleteCustom = (name) => {
    onUpdateCategories(customCategories.filter(c => c.name !== name));
  };

  const deleteBuiltin = (name) => {
    onUpdateHiddenCategories([...hiddenCategories, name]);
  };

  const restoreBuiltin = (name) => {
    onUpdateHiddenCategories(hiddenCategories.filter(n => n !== name));
  };

  const hiddenDefaults = DEFAULT_CATEGORIES.filter(c => hiddenCategories.includes(c.name));
  const builtins = categories.filter(c => c.builtin);
  const customs = categories.filter(c => !c.builtin);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: "#e8e4de" }}>Settings</div>

      {/* Categories */}
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 13, color: "#888", fontWeight: 500 }}>EXPENSE CATEGORIES</h3>

        {/* Add new */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <button onClick={() => {
              const idx = PALETTE.indexOf(newColor);
              setNewColor(PALETTE[(idx + 1) % PALETTE.length]);
            }}
              style={{
                width: 36, height: 36, borderRadius: 6, background: newColor,
                border: "2px solid #333", cursor: "pointer",
              }} />
          </div>
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addCategory(); }}
            placeholder="New category name…"
            style={{
              background: "#1e1a16", border: "1px solid #333", color: "#e8e4de",
              fontSize: 14, borderRadius: 6, padding: "8px 12px", outline: "none",
              flex: 1, minWidth: 120,
            }} />
          <button onClick={addCategory}
            style={{
              padding: "8px 16px", background: "#8FB996", color: "#121010", border: "none",
              borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>+ Add</button>
        </div>

        {/* Custom categories */}
        {customs.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Your categories</div>
            {customs.map(c => (
              <CategoryRow key={c.name} cat={c}
                onRename={n => renameCustom(c.name, n)}
                onChangeColor={col => recolorCustom(c.name, col)}
                onDelete={() => deleteCustom(c.name)} />
            ))}
          </div>
        )}

        {/* Built-in categories */}
        {builtins.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Default categories</div>
            {builtins.map(c => (
              <CategoryRow key={c.name} cat={c}
                onRename={() => {}} onChangeColor={() => {}} onDelete={() => deleteBuiltin(c.name)} />
            ))}
          </div>
        )}

        {/* Hidden/deleted defaults — allow restoring */}
        {hiddenDefaults.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Removed defaults</div>
            {hiddenDefaults.map(c => (
              <div key={c.name} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                background: "#1e1a16", borderRadius: 8, marginBottom: 6, opacity: 0.5,
              }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: c.color, border: "2px solid #333", flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: "#c5bfb5", flex: 1, textDecoration: "line-through" }}>{c.name}</span>
                <button onClick={() => restoreBuiltin(c.name)}
                  style={{
                    background: "none", border: "1px solid #333", color: "#8FB996", cursor: "pointer",
                    fontSize: 11, padding: "4px 10px", borderRadius: 4,
                  }}>Restore</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Account */}
      <Card>
        <h3 style={{ margin: "0 0 14px", fontSize: 13, color: "#888", fontWeight: 500 }}>ACCOUNT</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: "#c5bfb5" }}>{user.email}</span>
          <div style={{ flex: 1 }} />
          <button onClick={onSignOut} style={{
            background: "#2a2520", border: "1px solid #333", borderRadius: 6,
            padding: "8px 16px", color: "#888", fontSize: 13, cursor: "pointer",
          }}>Log out</button>
        </div>
      </Card>
    </div>
  );
}
