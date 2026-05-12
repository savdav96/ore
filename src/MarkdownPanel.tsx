import type { IDockviewPanelProps } from "dockview-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMarkdownFiles } from "./MarkdownFilesContext";

export type MarkdownPanelParams = {
  fileId: string;
};

export function MarkdownPanel(props: IDockviewPanelProps<MarkdownPanelParams>) {
  const { getFile } = useMarkdownFiles();
  const file = getFile(props.params.fileId);

  if (!file) {
    return (
      <div className="markdown-panel markdown-panel--empty">
        File was removed or is unavailable.
      </div>
    );
  }

  return (
    <div className="markdown-panel">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{file.content}</ReactMarkdown>
    </div>
  );
}
