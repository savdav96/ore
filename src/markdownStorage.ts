/** `id` is a stable key: UUID in browser mode, absolute file path in Tauri. */
export type MarkdownFile = {
  id: string;
  name: string;
  /** Populated in browser (localStorage) mode; loaded on demand in Tauri. */
  content?: string;
};

const STORAGE_KEY = "ore-markdown-files";

function defaultFiles(): MarkdownFile[] {
  return [
    {
      id: "welcome",
      name: "Welcome.md",
      content:
        "# Welcome\n\nSelect a file in the sidebar or create a new one. Each file opens in a **tab** powered by [Dockview](https://dockview.dev).\n\n- Drag tabs to dock\n- Split the editor area as you like",
    },
  ];
}

export function loadMarkdownFiles(): MarkdownFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultFiles();
    const parsed = JSON.parse(raw) as MarkdownFile[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaultFiles();
    return parsed;
  } catch {
    return defaultFiles();
  }
}

export function saveMarkdownFiles(files: MarkdownFile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

export function nextUntitledName(files: MarkdownFile[]): string {
  let n = 1;
  while (files.some((f) => f.name === `Untitled-${n}.md`)) n++;
  return `Untitled-${n}.md`;
}
