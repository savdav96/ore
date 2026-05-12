import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadMarkdownFiles,
  nextUntitledName,
  saveMarkdownFiles,
  type MarkdownFile,
} from "./markdownStorage";

type MarkdownFilesContextValue = {
  files: MarkdownFile[];
  getFile: (id: string) => MarkdownFile | undefined;
  createFile: () => MarkdownFile;
  updateFileContent: (id: string, content: string) => void;
};

const MarkdownFilesContext = createContext<MarkdownFilesContextValue | null>(
  null,
);

export function MarkdownFilesProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<MarkdownFile[]>(() => loadMarkdownFiles());

  const persist = useCallback((next: MarkdownFile[]) => {
    setFiles(next);
    saveMarkdownFiles(next);
  }, []);

  const getFile = useCallback(
    (id: string) => files.find((f) => f.id === id),
    [files],
  );

  const createFile = useCallback(() => {
    const name = nextUntitledName(files);
    const file: MarkdownFile = {
      id: crypto.randomUUID(),
      name,
      content: "",
    };
    persist([...files, file]);
    return file;
  }, [files, persist]);

  const updateFileContent = useCallback(
    (id: string, content: string) => {
      persist(
        files.map((f) => (f.id === id ? { ...f, content } : f)),
      );
    },
    [files, persist],
  );

  const value = useMemo(
    () => ({ files, getFile, createFile, updateFileContent }),
    [files, getFile, createFile, updateFileContent],
  );

  return (
    <MarkdownFilesContext.Provider value={value}>
      {children}
    </MarkdownFilesContext.Provider>
  );
}

export function useMarkdownFiles() {
  const ctx = useContext(MarkdownFilesContext);
  if (!ctx) {
    throw new Error("useMarkdownFiles must be used within MarkdownFilesProvider");
  }
  return ctx;
}
