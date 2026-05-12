import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  DockviewReact,
  type DockviewApi,
  type DockviewReadyEvent,
} from "dockview-react";
import { MarkdownPanel, type MarkdownPanelParams } from "./MarkdownPanel";
import { useMarkdownFiles } from "./MarkdownFilesContext";
import type { MarkdownFile } from "./markdownStorage";

function Watermark() {
  return (
    <div className="dock-watermark">
      <p>Select a markdown file from the sidebar, or create a new one.</p>
    </div>
  );
}

function openOrFocusFile(api: DockviewApi, file: MarkdownFile) {
  const existing = api.getPanel(file.id);
  if (existing) {
    existing.api.setActive();
    return;
  }

  const refPanel = api.activePanel ?? api.panels[0];
  const base = {
    id: file.id,
    component: "markdown",
    title: file.name,
    params: { fileId: file.id } satisfies MarkdownPanelParams,
  };

  if (refPanel) {
    api.addPanel({
      ...base,
      position: { direction: "within", referencePanel: refPanel.id },
    });
  } else {
    api.addPanel(base);
  }
}

export function DockMarkdownArea({
  onApiReady,
}: {
  onApiReady: (api: DockviewApi) => void;
}) {
  const { files } = useMarkdownFiles();
  const apiRef = useRef<DockviewApi | null>(null);

  const components = useMemo(
    () => ({
      markdown: MarkdownPanel,
    }),
    [],
  );

  const onReady = useCallback(
    (event: DockviewReadyEvent) => {
      apiRef.current = event.api;
      onApiReady(event.api);
    },
    [onApiReady],
  );

  const fileIds = useMemo(() => new Set(files.map((f) => f.id)), [files]);

  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    for (const panel of [...api.panels]) {
      if (!fileIds.has(panel.id)) {
        api.removePanel(panel);
      }
    }
  }, [fileIds]);

  return (
    <DockviewReact
      className="dockview-host"
      components={components}
      watermarkComponent={Watermark}
      onReady={onReady}
    />
  );
}

export function openFileInDock(api: DockviewApi | null, file: MarkdownFile) {
  if (!api) return;
  openOrFocusFile(api, file);
}
