const FILE_SELECTOR = 'a[href*="drive.google.com/file/d/"]';
const FILE_URL = /^https:\/\/drive\.google\.com\/file\/d\/([\w-]+)/;
const FILE_PATH = /\/file\/d\/([\w-]+)/;
const DOWNLOAD_URL = "https://drive.usercontent.google.com/download";
const MARK = "data-cqd";

interface DownloadInfo {
  id: string;
  authUser: string;
};

function getAuthUserFromHref (anchor: HTMLAnchorElement): string | null {
  const userHref = new URL(anchor.href).searchParams.get("authuser");
  return userHref ?? null;
}

function getAuthUserFromPath (): string {
  const userUrl = location.pathname.match(/^\/u\/(\d+)\//);
  return userUrl?.[1] ?? "0";
}

function parseAttachLink(anchor: HTMLAnchorElement): DownloadInfo | null {
  const fileHref = anchor.href.match(FILE_PATH);
  const authUser = getAuthUserFromHref(anchor) ?? getAuthUserFromPath();
  
  if (!fileHref?.[1]) {
    return null;
  }
  return {id: fileHref[1], authUser}
}

function createDownloadUrl(fileId: string, authUser: string): string {
  const downloadUrl = new URL(DOWNLOAD_URL);
  downloadUrl.searchParams.set("id", fileId);
  downloadUrl.searchParams.set("export", "download");
  downloadUrl.searchParams.set("authuser", authUser);
  return downloadUrl.toString();
}

function addButton(anchor: HTMLAnchorElement): void {
  if (anchor.hasAttribute(MARK)) {
    return;
  }

  const fileUrl = anchor.href.match(FILE_URL);
  if (!fileUrl?.[1]) {
    return;
  }
  anchor.setAttribute(MARK, "added");

  const btnElm = document.createElement("a");
  btnElm.className = "dl-btn";
  btnElm.textContent = "Download";
  btnElm.href = createDownloadUrl(fileUrl[1], getAuthUser(anchor));
  btnElm.target = "_blank";
  btnElm.rel = "noopener";
  btnElm.addEventListener("click", (event) => event.stopPropagation());

  anchor.after(btnElm);
}

function scan(): void {
  const anchors = document.querySelectorAll<HTMLAnchorElement>(FILE_SELECTOR);
  anchors.forEach(addButton);
}

let timer: number | undefined;
new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(scan, 200);
}).observe(document.body, {childList: true, subtree: true});

scan();