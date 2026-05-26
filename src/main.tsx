import React from "react";
import ReactDOM from "react-dom/client";
/** CSS viene dal pacchetto `dockview` (dockview-react non pubblica questo path). */
import "dockview/dist/styles/dockview.css";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
