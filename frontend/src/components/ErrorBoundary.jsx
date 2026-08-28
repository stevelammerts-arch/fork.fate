import React from "react";

/** Last-line-of-defense error boundary: any render crash shows a friendly
 * reload screen instead of a blank white page (reported on older phones). */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    try { console.error("Fork·Fate crashed:", error); } catch (e) { /* noop */ }
  }

  reload = () => {
    // Clear PWA caches so a stale chunk can't crash us again, then reload.
    try {
      if (window.caches && window.caches.keys) {
        window.caches.keys().then((keys) => keys.forEach((k) => window.caches.delete(k)));
      }
    } catch (e) { /* noop */ }
    setTimeout(() => window.location.reload(), 150);
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0E0E0E", color: "#fff", padding: 24, textAlign: "center", fontFamily: "Georgia, serif" }} data-testid="app-error-screen">
        <div>
          <p style={{ fontSize: 40, margin: 0 }}>☠</p>
          <h1 style={{ fontSize: 26, margin: "12px 0 6px" }}>Fate hit a snag</h1>
          <p style={{ fontSize: 14, color: "#A0A0A0", maxWidth: 320, margin: "0 auto" }}>
            Something went wrong loading this page. A quick reload usually fixes it.
          </p>
          <button
            type="button"
            onClick={this.reload}
            data-testid="app-error-reload"
            style={{ marginTop: 18, padding: "12px 28px", borderRadius: 9999, border: "none", background: "#E01E26", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" }}
          >
            Reload Fork·Fate
          </button>
        </div>
      </div>
    );
  }
}
