import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createMarkdownOnDisk,
  isTauri,
  listMarkdownFromDisk,
  readMarkdownFromDisk,
  writeMarkdownOnDisk,
} from "./notesInvokes";
import {
  loadMarkdownFiles,
  nextUntitledName,
  saveMarkdownFiles,
  type MarkdownFile,
} from "./markdownStorage";

type MarkdownFilesContextValue = {
  ready: boolean;
  loadError: string | null;
  files: MarkdownFile[];
  reloadFiles: () => Promise<void>;
  getFile: (id: string) => MarkdownFile | undefined;
  readContent: (id: string) => Promise<string>;
  createFile: () => Promise<MarkdownFile>;
  updateFileContent: (id: string, content: string) => Promise<void>;
};

const MarkdownFilesContext = createContext<MarkdownFilesContextValue | null>(
  null,
);

export function MarkdownFilesProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<MarkdownFile[]>([]);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const persist = useCallback((next: MarkdownFile[]) => {
    setFiles(next);
    saveMarkdownFiles(next);
  }, []);

  const reloadFiles = useCallback(async () => {
    if (isTauri()) {
      const list = await listMarkdownFromDisk();
      setFiles(list);
    } else {
      setFiles(loadMarkdownFiles());
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      try {
        if (isTauri()) {
          const list = await listMarkdownFromDisk();
          if (!cancelled) setFiles(list);
        } else {
          if (!cancelled) setFiles(loadMarkdownFiles());
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getFile = useCallback(
    (id: string) => files.find((f) => f.id === id),
    [files],
  );

  const readContent = useCallback(
    async (id: string): Promise<string> => {
      if (isTauri()) {
        return readMarkdownFromDisk(id);
      }
      const f = files.find((x) => x.id === id);
      if (!f) throw new Error("File not found");
      return f.content ?? "";
    },
    [files],
  );

  const createFile = useCallback(async (): Promise<MarkdownFile> => {
    if (isTauri()) {
      const created = await createMarkdownOnDisk();
      const next = await listMarkdownFromDisk();
      setFiles(next);
      return created;
    }
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
    async (id: string, content: string) => {
      if (isTauri()) {
        await writeMarkdownOnDisk(id, content);
        return;
      }
      persist(files.map((f) => (f.id === id ? { ...f, content } : f)));
    },
    [files, persist],
  );

  const value = useMemo(
    () => ({
      ready,
      loadError,
      files,
      reloadFiles,
      getFile,
      readContent,
      createFile,
      updateFileContent,
    }),
    [
      ready,
      loadError,
      files,
      reloadFiles,
      getFile,
      readContent,
      createFile,
      updateFileContent,
    ],
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
