use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Clone, Serialize)]
struct MarkdownFileMeta {
    id: String,
    name: String,
}

fn notes_root() -> Result<PathBuf, String> {
    let base = dirs::data_local_dir().ok_or_else(|| "could not resolve data_local_dir".to_string())?;
    let dir = base.join("com.davide.ore").join("notes");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir)
}

const WELCOME_MD: &str = r#"# Welcome

Select a file in the sidebar or create a new one. Each file opens in a **tab** powered by [Dockview](https://dockview.dev).

- Drag tabs to dock
- Split the editor area as you like

Files live on disk under your app data folder (`com.davide.ore/notes`).
"#;

fn ensure_welcome_if_empty(root: &Path) -> Result<(), String> {
    let mut has_md = false;
    if let Ok(iter) = std::fs::read_dir(root) {
        for e in iter.flatten() {
            if e.path().extension().and_then(|s| s.to_str()) == Some("md") {
                has_md = true;
                break;
            }
        }
    }
    if !has_md {
        let p = root.join("Welcome.md");
        std::fs::write(&p, WELCOME_MD).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn canonical_root() -> Result<PathBuf, String> {
    let root = notes_root()?;
    ensure_welcome_if_empty(&root)?;
    root.canonicalize().map_err(|e| e.to_string())
}

fn validate_notes_md(root: &Path, path: &str) -> Result<PathBuf, String> {
    let candidate = PathBuf::from(path);
    if !candidate.is_absolute() {
        return Err("path must be absolute".into());
    }
    let full = candidate
        .canonicalize()
        .map_err(|e| format!("invalid path: {e}"))?;
    let root = root
        .canonicalize()
        .map_err(|e| format!("invalid notes root: {e}"))?;
    if !full.starts_with(&root) {
        return Err("path escapes notes directory".into());
    }
    if full.extension().and_then(|e| e.to_str()) != Some("md") {
        return Err("not a markdown file".into());
    }
    Ok(full)
}

#[tauri::command]
fn list_markdown_files() -> Result<Vec<MarkdownFileMeta>, String> {
    let root = canonical_root()?;
    let mut out = Vec::new();
    for entry in std::fs::read_dir(&root).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("md") {
            let name = path
                .file_name()
                .ok_or_else(|| "invalid file name".to_string())?
                .to_string_lossy()
                .to_string();
            let id = path
                .canonicalize()
                .map_err(|e| e.to_string())?
                .to_string_lossy()
                .to_string();
            out.push(MarkdownFileMeta { id, name });
        }
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(out)
}

#[tauri::command]
fn read_markdown_file(path: String) -> Result<String, String> {
    let root = canonical_root()?;
    let file = validate_notes_md(&root, &path)?;
    std::fs::read_to_string(&file).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_markdown_file(path: String, content: String) -> Result<(), String> {
    let root = canonical_root()?;
    let file = validate_notes_md(&root, &path)?;
    std::fs::write(&file, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn create_markdown_file() -> Result<MarkdownFileMeta, String> {
    let root = notes_root()?;
    ensure_welcome_if_empty(&root)?;
    let root = root.canonicalize().map_err(|e| e.to_string())?;
    let mut n = 1u32;
    loop {
        let name = format!("Untitled-{n}.md");
        let path = root.join(&name);
        if !path.exists() {
            std::fs::write(&path, "").map_err(|e| e.to_string())?;
            let id = path.canonicalize().map_err(|e| e.to_string())?;
            return Ok(MarkdownFileMeta {
                id: id.to_string_lossy().to_string(),
                name,
            });
        }
        n += 1;
        if n > 10_000 {
            return Err("could not allocate untitled file name".into());
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_markdown_files,
            read_markdown_file,
            write_markdown_file,
            create_markdown_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
