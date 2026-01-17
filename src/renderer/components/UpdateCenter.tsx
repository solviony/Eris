import React, { useEffect, useState } from "react";

type UpdateStatus =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; info?: any }
  | { status: "not-available"; info?: any }
  | { status: "progress"; progress?: any }
  | { status: "downloaded"; info?: any }
  | { status: "error"; message: string };

export default function UpdateCenter() {
  const [status, setStatus] = useState<UpdateStatus>({ status: "idle" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!window.erisUpdater) return;

    const unsubscribe = window.erisUpdater.onStatus((payload: any) => {
      setStatus(payload);
    });

    return () => unsubscribe?.();
  }, []);

  async function check() {
    if (!window.erisUpdater) return;
    setBusy(true);
    await window.erisUpdater.checkForUpdates();
    setBusy(false);
  }

  async function download() {
    if (!window.erisUpdater) return;
    setBusy(true);
    await window.erisUpdater.downloadUpdate();
    setBusy(false);
  }

  async function restart() {
    if (!window.erisUpdater) return;
    await window.erisUpdater.quitAndInstall();
  }

  return (
    <div style={{
      padding: 14,
      borderRadius: 12,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.12)",
      marginBottom: 16
    }}>
      <h3>Updates</h3>

      <p>Status: {status.status}</p>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={check} disabled={busy}>Check</button>

        {status.status === "available" && (
          <button onClick={download}>Download</button>
        )}

        {status.status === "downloaded" && (
          <button onClick={restart}>Restart & Install</button>
        )}
      </div>
    </div>
  );
}
