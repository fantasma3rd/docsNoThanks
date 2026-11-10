export const FILE_PATH = /\/file\/d\/([\w-]+)/;

const DOWNLOAD_URL = "https://drive.usercontent.google.com/download";

export const state: { lastOpened: DownloadInfo | null } = { lastOpened: null };

export interface DownloadInfo {
  fileId: string;
  authUser: string;
}

export type DownloadMode = "newTab" | "background";

export const SETTINGS_KEY = "downloadMode";
export const MODES = { NEW_TAB: "newTab", BACKGROUND: "background" } as const;
export const DEFAULT_MODE = MODES.NEW_TAB;

export function isValidMode(value: unknown): value is DownloadMode {
  return value === "newTab" || value === "background";
}

let mode: DownloadMode = DEFAULT_MODE;

export function getMode(): DownloadMode {
  return mode;
}

export function initMode(): void {
  if (!chrome?.storage) {
    return;
  }
  try {
    chrome.storage.local.get(SETTINGS_KEY).then((value) => {
      if (isValidMode(value?.[SETTINGS_KEY])) {
        mode = value[SETTINGS_KEY];
      }
    }).catch(() => {});
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[SETTINGS_KEY]) {
        const next = changes[SETTINGS_KEY].newValue;
        mode = isValidMode(next) ? next : DEFAULT_MODE;
      }
    })
  } catch (_) {}
}

export function createDownloadUrl(fileId: string, authUser: string): string {
  const downloadUrl = new URL(DOWNLOAD_URL);
  downloadUrl.searchParams.set("id", fileId);
  downloadUrl.searchParams.set("export", "download");
  downloadUrl.searchParams.set("authuser", authUser);
  return downloadUrl.toString();
}

export function isValidId(str: unknown): str is string {
  return typeof str === "string" && /^[\w-]+$/.test(str);
}

export function isValidAuthuser(str: unknown): str is string {
  return typeof str === "string" && /^\d{1,2}$/.test(str);
}
export function startBackgroundDownload(target: DownloadInfo): void {
  function fallback(): void {
    try {
      window.open(createDownloadUrl(target.fileId, target.authUser), "_blank", "noopener");
    } catch (_) {};
  }

  try {
    Promise.resolve(chrome.runtime.sendMessage({ type: MSG_DOWNLOAD, fileId: target.fileId, authUser: target.authUser })).then((response) => {
      if (!response?.ok) {
        fallback();
      }
    }).catch(fallback)
  } catch (_) {
    fallback();
  }
}
