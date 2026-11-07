const DOWNLOAD_URL = "https://drive.usercontent.google.com/download";

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