// Open/save .txt source files. Uses the File System Access API when available,
// otherwise falls back to a download link / hidden file input.

interface WindowWithFS extends Window {
  showSaveFilePicker?: (opts?: unknown) => Promise<FileSystemFileHandle>;
  showOpenFilePicker?: (opts?: unknown) => Promise<FileSystemFileHandle[]>;
}

const w = window as WindowWithFS;

export async function saveTextFile(content: string, suggestedName = 'diagram.txt') {
  if (w.showSaveFilePicker) {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName,
        types: [{ description: 'Text file', accept: { 'text/plain': ['.txt'] } }],
      });
      const writable = await (handle as any).createWritable();
      await writable.write(content);
      await writable.close();
      return;
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return;
      // fall through to download fallback
    }
  }
  downloadBlob(new Blob([content], { type: 'text/plain' }), suggestedName);
}

export async function openTextFile(): Promise<string | null> {
  if (w.showOpenFilePicker) {
    try {
      const [handle] = await w.showOpenFilePicker({
        types: [{ description: 'Text file', accept: { 'text/plain': ['.txt'] } }],
        multiple: false,
      });
      const file = await handle.getFile();
      return await file.text();
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return null;
      // fall through
    }
  }
  return openViaInput();
}

function openViaInput(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      resolve(await file.text());
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
