import { useState } from "react";

export default function AuthPage({ onGoogleSignIn }) {
  const [error, setError] = useState("");

  const handleOAuth = async (fn) => {
    setError("");
    try { await fn(); } catch (err) { setError(err.message); }
  };

  return (
    <div style={{
      background: "#121010", color: "#e8e4de",
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
      <div style={{
        background: "#1a1714", border: "1px solid #2a2520", borderRadius: 16,
        padding: "32px 24px", width: "100%", maxWidth: 380,
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.6 }}>💰</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, letterSpacing: "-0.5px" }}>Money Planner</h1>
          <p style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Sign in to continue</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            onClick={() => handleOAuth(onGoogleSignIn)}
            style={{
              padding: "12px 0", background: "#fff", color: "#333", border: "1px solid #333",
              borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Sign in with Google
          </button>

        </div>

        {error && (
          <div style={{ padding: "8px 12px", background: "#2a1a1a", border: "1px solid #4a2020", borderRadius: 8, fontSize: 13, color: "#D49A9A", marginTop: 14 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
