import { useEffect, useRef, useState } from "react";
import {
  DockviewReact,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
} from "dockview-react";
import "./App.css";

const MyPanel = (props: IDockviewPanelProps) => {
  return (
    <div style={{ padding: 16 }}>
      {props.api.title ?? props.api.id}
    </div>
  );
};

const components = { default: MyPanel };

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [dockApi, setDockApi] = useState<DockviewApi | null>(null);

  const onReady = (event: DockviewReadyEvent) => {
    setDockApi(event.api);

    event.api.addPanel({
      id: "panel_1",
      component: "default",
      title: "Panel 1",
    });

    event.api.addPanel({
      id: "panel_2",
      component: "default",
      title: "Panel 2",
      position: {
        referencePanel: "panel_1",
        direction: "right",
      },
    });
  };

  // Dockview fa layout(width,height) solo al mount; su Tauri/WebView il box può essere 0×0.
  useEffect(() => {
    const el = hostRef.current;
    if (!el || !dockApi) return;

    const relayout = () => {
      const { clientWidth, clientHeight } = el;
      if (clientWidth > 0 && clientHeight > 0) {
        dockApi.layout(clientWidth, clientHeight);
      }
    };

    relayout();
    const ro = new ResizeObserver(relayout);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dockApi]);

  return (
    <div ref={hostRef} className="app-dock-host">
      <DockviewReact
        className="dock-shell dockview-theme-dark"
        components={components}
        onReady={onReady}
      />
    </div>
  );
}
