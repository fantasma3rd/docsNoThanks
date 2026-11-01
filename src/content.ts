const FILE_SELECTOR = 'a[href*="drive.google.com/file/d/"]';
const FILE_URL = /^https:\/\/drive\.google\.com\/file\/d\/([\w-]+)/;
const DOWNLOAD_URL = "https://drive.usercontent.google.com/download";
const MARK = "data-cqd";

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

function addButton(anchor: HTMLAnchorElement): void {
  if (anchor.hasAttribute(MARK)) {
    return;
  }

  const fileUrl = anchor.href.match(FILE_URL);
  if (!fileUrl?.[1]) {
    return;
  }

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
  const anchors = document.querySelectorAll(FILE_SELECTOR);
  anchors.forEach(addButton());
}

let timer: number = null;
new MutationObserver(() => {
  clearTimeout(timer);
  timer = setTimeout(scan, 200);
}).observe(document.body, {childList: true, subtree: true});

scan();