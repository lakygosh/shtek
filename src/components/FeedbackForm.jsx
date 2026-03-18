import { useState } from "react";
import { Card } from "./ui";

const TYPES = [
  { value: "bug", label: "Bug Report", icon: "🐛", color: "#D49A9A" },
  { value: "suggestion", label: "Suggestion", icon: "💡", color: "#D4C5A9" },
  { value: "question", label: "Question", icon: "❓", color: "#B8C5E3" },
];

export default function FeedbackForm({ onSubmit, onClose, userFeedback }) {
  const [type, setType] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    await onSubmit({ type, message: message.trim() });
    setSubmitted(true);
    setMessage("");
  };

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div className="tutorial-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#e8e4de", marginBottom: 6 }}>Thanks for your feedback!</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>We'll review it and get back to you if needed.</div>
            <button onClick={onClose} style={{
              background: "#8FB996", border: "none", borderRadius: 8,
              padding: "10px 24px", color: "#121010", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e8e4de", marginBottom: 4 }}>Send Feedback</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Report a bug, suggest a feature, or ask a question.</div>

            {/* Type selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {TYPES.map(t => (
                <button key={t.value} onClick={() => setType(t.value)} style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  background: type === t.value ? "#2a2520" : "#1a1714",
                  border: `1px solid ${type === t.value ? t.color : "#2a2520"}`,
                  borderRadius: 8, padding: "10px 8px", cursor: "pointer", color: "inherit", fontFamily: "inherit",
                }}>
                  <span style={{ fontSize: 18 }}>{t.icon}</span>
                  <span style={{ fontSize: 11, color: type === t.value ? t.color : "#888" }}>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Describe the issue, idea, or question..."
              rows={4}
              style={{
                width: "100%", background: "#1e1a16", border: "1px solid #333", color: "#e8e4de",
                fontSize: 13, borderRadius: 8, padding: "10px 12px", outline: "none", resize: "vertical",
                fontFamily: "inherit", lineHeight: 1.5,
              }} />

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
              <button onClick={onClose} style={{
                background: "#2a2520", border: "1px solid #333", borderRadius: 8,
                padding: "10px 16px", color: "#888", fontSize: 13, cursor: "pointer", flex: 1,
              }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!message.trim()} style={{
                background: message.trim() ? "#8FB996" : "#333", border: "none", borderRadius: 8,
                padding: "10px 16px", color: message.trim() ? "#121010" : "#666",
                fontSize: 13, fontWeight: 600, cursor: message.trim() ? "pointer" : "default", flex: 1,
              }}>Submit</button>
            </div>

            {/* User's past submissions */}
            {userFeedback.length > 0 && (
              <div style={{ marginTop: 18, borderTop: "1px solid #2a2520", paddingTop: 14 }}>
                <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Your past submissions</div>
                {userFeedback.slice(0, 5).map(f => {
                  const typeInfo = TYPES.find(t => t.value === f.type) || TYPES[1];
                  const statusColor = f.status === "resolved" ? "#8FB996" : f.status === "in_progress" ? "#D4C5A9" : "#888";
                  return (
                    <div key={f.id} style={{ padding: "6px 0", borderBottom: "1px solid #1e1a16", display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>{typeInfo.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: "#c5bfb5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.message}</div>
                        <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>
                          {new Date(f.created_at).toLocaleDateString()} · <span style={{ color: statusColor }}>{f.status}</span>
                          {f.admin_note && <span style={{ color: "#B8C5E3" }}> · {f.admin_note}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
