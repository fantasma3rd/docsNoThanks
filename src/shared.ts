const DOWNLOAD_URL = "https://drive.usercontent.google.com/download";

export const state = { lastOpened: null };

export interface DownloadInfo {
  fileId: string;
  authUser: string;
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