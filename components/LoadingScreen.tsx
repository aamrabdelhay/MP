"use client";

import { useEffect, useState } from "react";

type LoadingPhase = "visible" | "leaving" | "hidden";

export function LoadingScreen() {
  const [phase, setPhase] = useState<LoadingPhase>("visible");

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setPhase("leaving"), 1850);
    const hideTimer = window.setTimeout(() => setPhase("hidden"), 2400);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`loading-screen${phase === "leaving" ? " loading-screen--leaving" : ""}`}
      role="status"
      aria-live="polite"
      aria-hidden={phase === "leaving"}
    >
      <div className="loading-content">
        <div className="atom-loader" aria-hidden="true">
          <span className="atom-loader-ring" />
          <span className="atom-electron atom-electron--one" />
          <span className="atom-electron atom-electron--two" />
          <span className="atom-electron atom-electron--three" />
        </div>
        <div className="loading-wordmark">
          <strong>جامعة العاصمة</strong>
          <span>Capital University</span>
        </div>
      </div>
    </div>
  );
}
