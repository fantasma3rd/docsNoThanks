const FILE_SELECTOR = 'a[href*="drive.google.com/file/d/"]';
const FILE_URL = /^https:\/\/drive\.google\.com\/file\/d\/([\w-]+)/;
const FILE_PATH = /\/file\/d\/([\w-]+)/;
const DOWNLOAD_URL = "https://drive.usercontent.google.com/download";
const MARK = "data-cqd";

const cardButtonsMap = new WeakMap<HTMLAnchorElement, HTMLAnchorElement>();
let lastOpened: DownloadInfo;

interface DownloadInfo {
  fileId: string;
  authUser: string;
}

function getAuthUserFromHref (anchor: HTMLAnchorElement): string | null {
  const userHref = new URL(anchor.href).searchParams.get("authuser");
  return userHref;
}

function getAuthUserFromPath (): string {
  const userUrl = location.pathname.match(/^\/u\/(\d+)\//);
  return userUrl?.[1] ?? "0";
}

function parseAttachLink(anchor: HTMLAnchorElement): DownloadInfo | null {
  const fileId = anchor.href.match(FILE_URL)?.[1];
  if (!fileId) {
    return null;
  }
  const authUser = getAuthUserFromHref(anchor) ?? getAuthUserFromPath();
  
  return {fileId, authUser};
}

function createIcon(): SVGSVGElement {
  const NS = "http://www.w3.org/2000/svg";
  const svgElm = document.createElementNS(NS, "svg");
  svgElm.setAttribute("viewBox", "0 0 24 24");
  svgElm.setAttribute("aria-hidden", "true");
  svgElm.setAttribute("focusable", "false");
  const pathElm = document.createElementNS(NS, "path");
  pathElm.setAttribute("d", "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z");
  pathElm.setAttribute("fill", "currentColor");
  svgElm.appendChild(pathElm);

  return svgElm;
}

function createDownloadUrl(fileId: string, authUser: string): string {
  const downloadUrl = new URL(DOWNLOAD_URL);
  downloadUrl.searchParams.set("id", fileId);
  downloadUrl.searchParams.set("export", "download");
  downloadUrl.searchParams.set("authuser", authUser);
  return downloadUrl.toString();
}

function createButton(className: string, target: DownloadInfo): HTMLAnchorElement {
  const btnElm = document.createElement("a");
  btnElm.className = className;
  btnElm.href = createDownloadUrl(target.fileId, target.authUser);
  btnElm.target = "_blank";
  btnElm.rel = "noopener";
  btnElm.appendChild(createIcon());
  btnElm.addEventListener("click", (event) => event.stopPropagation());

  return btnElm;
}

function addCardButton(anchor: HTMLAnchorElement): void {
  const exist = cardButtonsMap.get(anchor);
  if (exist && exist.isConnected) {
    return;
  }

  const target = parseAttachLink(anchor);
  const host = anchor.parentElement;
  if (!target || !host) {
    return;
  }

  const btnElm = createButton("cqd-card-btn", target);

  if (host.querySelectorAll(FILE_SELECTOR).length === 1) {
    host.classList.add("cqd-host");
    btnElm.classList.add("cqd-card-btn--overlay");
    host.appendChild(btnElm);
  } else {
    anchor.after(btnElm);
  }

  cardButtonsMap.set(anchor, btnElm);
}

function findViewerFrame(): HTMLIFrameElement | null {
  for (const frame of document.querySelectorAll("iframe")) {
    const rect = frame.getBoundingClientRect();
    if (rect.width >= innerWidth * 0.9 && rect.height >= innerHeight * 0.8) {
      return frame;
    }
  }
  return null;
}

function resolveViewerTarget(frame: HTMLIFrameElement): DownloadInfo | null {
  let fileId: string | null = null;
  let authUser: string | null = null;

  try {
    const url = new URL(frame.src, location.href);
    const id = url.pathname.match(FILE_PATH)?.[1];
    if (id) {
      fileId = id;
    }
    authUser = url.searchParams.get("authuser");
  } catch (_) {}

  if (!fileId && lastOpened) {
    fileId = lastOpened.fileId;
    authUser = authUser ?? lastOpened.authUser;
  }
  if (!fileId) {
    return null;
  }

  return {fileId, authUser: authUser ?? getAuthUserFromPath()};
}

document.addEventListener("click", (event) => {
  const attachment = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>(FILE_SELECTOR) : null;
  const tabOpened = attachment && parseAttachLink(attachment);
  if (tabOpened) {
    lastOpened = tabOpened;
  }
}, true);

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