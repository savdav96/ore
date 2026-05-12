import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { IDockviewPanelProps } from "dockview-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMarkdownFiles } from "./MarkdownFilesContext";

export type MarkdownPanelParams = {
  fileId: string;
};

type ViewMode = "split" | "edit" | "preview";

export function MarkdownPanel(props: IDockviewPanelProps<MarkdownPanelParams>) {
  const { getFile, readContent, updateFileContent } = useMarkdownFiles();
  const meta = getFile(props.params.fileId);
  const fileId = props.params.fileId;

  const [draft, setDraft] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [phase, setPhase] = useState<"loading" | "ok" | "missing" | "error">(
    "loading",
  );
  const [mode, setMode] = useState<ViewMode>("split");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const draftRef = useRef(draft);
  const savedAtRef = useRef(savedAt);
  const fileIdRef = useRef(fileId);
  const updateFileContentRef = useRef(updateFileContent);

  draftRef.current = draft;
  savedAtRef.current = savedAt;
  fileIdRef.current = fileId;
  updateFileContentRef.current = updateFileContent;

  useEffect(() => {
    if (!meta) {
      setPhase("missing");
      return;
    }
    let cancelled = false;
    setPhase("loading");
    setSaveError(null);
    readContent(fileId)
      .then((text) => {
        if (!cancelled) {
          setDraft(text);
          setSavedAt(text);
          setPhase("ok");
        }
      })
      .catch(() => {
        if (!cancelled) setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [meta, fileId, readContent]);

  useEffect(() => {
    if (phase !== "ok") return;
    if (draft === savedAt) return;

    const handle = window.setTimeout(() => {
      const text = draftRef.current;
      const already = savedAtRef.current;
      if (text === already) return;

      setIsSaving(true);
      setSaveError(null);
      const id = fileIdRef.current;
      void updateFileContentRef
        .current(id, text)
        .then(() => {
          savedAtRef.current = text;
          setSavedAt(text);
          setIsSaving(false);
        })
        .catch((e: unknown) => {
          setIsSaving(false);
          setSaveError(e instanceof Error ? e.message : String(e));
        });
    }, 450);

    return () => window.clearTimeout(handle);
  }, [draft, savedAt, phase]);

  useEffect(() => {
    return () => {
      const id = fileIdRef.current;
      const text = draftRef.current;
      const saved = savedAtRef.current;
      if (text !== saved) {
        void updateFileContentRef.current(id, text);
      }
    };
  }, []);

  const onDraftChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setDraft(e.target.value);
      setSaveError(null);
    },
    [],
  );

  const statusLabel = (() => {
    if (saveError) return `Save failed: ${saveError}`;
    if (isSaving) return "Saving…";
    if (draft !== savedAt) return "Unsaved changes";
    return "Saved";
  })();

  if (phase === "missing") {
    return (
      <div className="markdown-panel markdown-panel--empty">
        File was removed or is unavailable.
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="markdown-panel markdown-panel--empty">
        Could not read this file from disk.
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="markdown-panel markdown-panel--empty">Loading…</div>
    );
  }

  return (
    <div className="markdown-panel markdown-panel--editor">
      <div className="markdown-panel__toolbar">
        <span
          className={`markdown-panel__status${
            saveError ? " markdown-panel__status--error" : ""
          }${draft !== savedAt && !isSaving && !saveError ? " markdown-panel__status--dirty" : ""}`}
        >
          {statusLabel}
        </span>
        <div className="markdown-panel__modes" role="group" aria-label="View mode">
          <button
            type="button"
            className={
              mode === "split"
                ? "markdown-panel__mode markdown-panel__mode--on"
                : "markdown-panel__mode"
            }
            aria-pressed={mode === "split"}
            onClick={() => setMode("split")}
          >
            Split
          </button>
          <button
            type="button"
            className={
              mode === "edit"
                ? "markdown-panel__mode markdown-panel__mode--on"
                : "markdown-panel__mode"
            }
            aria-pressed={mode === "edit"}
            onClick={() => setMode("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className={
              mode === "preview"
                ? "markdown-panel__mode markdown-panel__mode--on"
                : "markdown-panel__mode"
            }
            aria-pressed={mode === "preview"}
            onClick={() => setMode("preview")}
          >
            Preview
          </button>
        </div>
      </div>
      <div
        className="markdown-panel__body"
        data-mode={mode}
      >
        {(mode === "edit" || mode === "split") && (
          <textarea
            className="markdown-panel__textarea"
            value={draft}
            onChange={onDraftChange}
            spellCheck
            aria-label="Markdown source"
          />
        )}
        {(mode === "preview" || mode === "split") && (
          <div className="markdown-panel__preview markdown-prose">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
