import React from "react";

// ── Drop-zone content for the device screen face ─────────────────
export function ScreenDropZoneContent({ pencil }: { pencil: boolean }) {
  const s = "rgba(255,255,255,0.95)";
  const label: React.CSSProperties = {
    fontSize: "0.9em",
    color: "rgba(255,255,255,0.92)",
    fontFamily: "Inter, system-ui, sans-serif",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1,
  };
  return pencil ? (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.4em",
          height: "1.4em",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <svg
          width="0.9em"
          height="0.9em"
          viewBox="0 0 24 24"
          fill="none"
          stroke={s}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>
      <span style={label}>Editar pantalla</span>
    </>
  ) : (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.4em",
          height: "1.4em",
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }}
      >
        <svg
          width="0.9em"
          height="0.9em"
          viewBox="0 0 24 24"
          fill="none"
          stroke={s}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <span style={label}>Add media</span>
    </>
  );
}
