import { useMarkdownFiles } from "./MarkdownFilesContext";
import type { MarkdownFile } from "./markdownStorage";

type FileSidebarProps = {
  selectedId: string | null;
  onOpenFile: (file: MarkdownFile) => void;
  onCreate: () => void;
};

export function FileSidebar({
  selectedId,
  onOpenFile,
  onCreate,
}: FileSidebarProps) {
  const { files } = useMarkdownFiles();

  return (
    <aside className="file-sidebar">
      <div className="file-sidebar__header">
        <span className="file-sidebar__title">Files</span>
        <button type="button" className="file-sidebar__new" onClick={onCreate}>
          New
        </button>
      </div>
      <ul className="file-sidebar__list">
        {files.map((file) => (
          <li key={file.id}>
            <button
              type="button"
              className={
                file.id === selectedId
                  ? "file-sidebar__item file-sidebar__item--active"
                  : "file-sidebar__item"
              }
              onClick={() => onOpenFile(file)}
            >
              {file.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
