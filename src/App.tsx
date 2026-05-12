import {
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { DockMarkdownArea, openFileInDock } from "./DockMarkdownArea";
import { FileSidebar } from "./FileSidebar";
import { MarkdownFilesProvider, useMarkdownFiles } from "./MarkdownFilesContext";
import type { DockviewApi } from "dockview-react";
import type { MarkdownFile } from "./markdownStorage";
import "./App.css";

function subscribePreferredDark(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function getPreferredDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function AppShell() {
  const { createFile, ready, loadError } = useMarkdownFiles();
  const dockRef = useRef<DockviewApi | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const prefersDark = useSyncExternalStore(
    subscribePreferredDark,
    getPreferredDark,
    () => false,
  );

  const onApiReady = useCallback((api: DockviewApi) => {
    dockRef.current = api;
  }, []);

  const handleOpenFile = useCallback((file: MarkdownFile) => {
    setSelectedId(file.id);
    openFileInDock(dockRef.current, file);
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      const file = await createFile();
      setSelectedId(file.id);
      openFileInDock(dockRef.current, file);
    } catch (e) {
      console.error(e);
    }
  }, [createFile]);

  const dockTheme = prefersDark ? "dockview-theme-dark" : "dockview-theme-light";

  if (!ready) {
    return (
      <div className="app-boot">
        <p>Loading notes…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="app-boot app-boot--error">
        <p>Could not load notes.</p>
        <p className="app-boot__detail">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <FileSidebar
        selectedId={selectedId}
        onOpenFile={handleOpenFile}
        onCreate={() => void handleCreate()}
      />
      <div className={`app-shell__main ${dockTheme}`}>
        <DockMarkdownArea onApiReady={onApiReady} />
      </div>
    </div>
  );
}

function App() {
  return (
    <MarkdownFilesProvider>
      <AppShell />
    </MarkdownFilesProvider>
  );
}

export default App;
