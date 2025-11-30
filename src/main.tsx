import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    // you can show a toast later if you want; for now do nothing
  },
  onOfflineReady() {
    // called once everything is cached for offline use
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <App />
    </div>
  </React.StrictMode>
);
