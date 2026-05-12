import { invoke, isTauri } from "@tauri-apps/api/core";
import type { MarkdownFile } from "./markdownStorage";

export { isTauri };

export async function listMarkdownFromDisk(): Promise<MarkdownFile[]> {
  return invoke<MarkdownFile[]>("list_markdown_files");
}

export async function readMarkdownFromDisk(path: string): Promise<string> {
  return invoke<string>("read_markdown_file", { path });
}

export async function writeMarkdownOnDisk(
  path: string,
  content: string,
): Promise<void> {
  return invoke("write_markdown_file", { path, content });
}

export async function createMarkdownOnDisk(): Promise<MarkdownFile> {
  return invoke<MarkdownFile>("create_markdown_file");
}
