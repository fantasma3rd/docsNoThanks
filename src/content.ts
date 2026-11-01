const DOWNLOAD_URL = "https://drive.usercontent.google.com/download";
function getAuthUser (anchor: HTMLAnchorElement): string {
  const userHref = new URL(anchor.href).searchParams.get("authuser");
  if (userHref !== null) {
      return userHref;
  }

  const userUrl = location.pathname.match(/^\/u\/(\d+)\//);
  return userUrl?.[1] ?? "0";
}

function createDownloadUrl(fileId: string, authUser: string): string {
  const downloadUrl = new URL(DOWNLOAD_URL);
  downloadUrl.searchParams.set("id", fileId);
  downloadUrl.searchParams.set("export", "download");
  downloadUrl.searchParams.set("authuser", authUser);
  return downloadUrl.toString();
}
