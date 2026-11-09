import { createDownloadUrl, isValidAuthuser, isValidId, state, type DownloadInfo, FILE_PATH } from "./shared";

const CLASSROOM_ORIGIN = "https://classroom.google.com";

const PRINT_SEL = 'button[aria-label="印刷"], button[aria-label="Print"]';
const DL_SEL = 'button[aria-label="ダウンロード"], button[aria-label="Download"]';
const ICON_VIEWBOX = "0 96 960 960";
const ICON_PATH =
  "M240 896q-33 0-56.5-23.5T160 816V696h80v120h480V696h80v120q0 33-23.5 56.5T720 896H240Zm240-160L280 536l56-58 104 104V256h80v326l104-104 56 58-200 200Z";
const STRIP_ATTRS = [
  "jscontroller", "jsaction", "jsname", "jsshadow", "id",
  "data-tooltip-id", "data-tooltip-enabled", "data-tooltip-y-position", "data-tooltip-classes",
];

let mode: "frame" | "top" | null = null;
let fromParent: DownloadInfo | null = null;
let requestsLeft: number = 8;
let timer: number | undefined;

function requestTarget(): void {
  if (mode !== "frame" || requestsLeft <= 0) {
    return;
  }
  requestsLeft--;

  try {
    window.parent.postMessage({ type: "dnt:ready" }, CLASSROOM_ORIGIN);
  } catch (_) {}
}

function currentTarget(): DownloadInfo | null {
  if (mode === "top") {
    return state.lastOpened;
  }

  const fileId = location.pathname.match(FILE_PATH)?.[1] ?? (fromParent && fromParent.fileId);
  if (!fileId) {
    return null;
  }

  const hrefUser = new URLSearchParams(location.search).get("authuser");;
  const authUser = isValidAuthuser(hrefUser) ? hrefUser : fromParent ? fromParent.authUser : "0";
  return {fileId, authUser};
}

function openDownload(target: DownloadInfo): void {
  const linkElm = document.createElement("a");
  linkElm.href = createDownloadUrl(target.fileId, target.authUser);
  linkElm.target = "_blank";
  linkElm.rel = "noopener";
  linkElm.style.display = "none";
  document.body.appendChild(linkElm);
  linkElm.click();
  linkElm.remove();
}

function embeddedByClassroom(): boolean {
  if (window === window.top) {
    return false;
  }
  const ancestor = location.ancestorOrigins ? Array.from(location.ancestorOrigins) : [];

  return ancestor.length === 0 || ancestor.includes(CLASSROOM_ORIGIN);
}

function addToolbarButton(): void {
  const printBtn: Element | null = document.querySelector(PRINT_SEL);
  if (!printBtn) {
    return;
  }
  const tooltipWrap: Element | null = printBtn.closest("[data-is-tooltip-wrapper]");
  const containerPrintBtn: HTMLElement | null = tooltipWrap && tooltipWrap.parentElement;
  const bar: HTMLElement | null = containerPrintBtn && containerPrintBtn.parentElement;
  if (!containerPrintBtn || !bar) {
    return;
  }

  if (bar.querySelector(DL_SEL) || bar.querySelector("[data-cqd-toolbar]")) {
    return;
  }

  if (!currentTarget()) {
    requestTarget();
    return;
  }

  const wrapDlBtn = containerPrintBtn.cloneNode(true);
  if (!(wrapDlBtn instanceof HTMLElement)) {
    return;
  }
  wrapDlBtn.setAttribute("data-cqd-toolbar", "1");
  
  for (const elm of [wrapDlBtn, ...wrapDlBtn.querySelectorAll("*")]) {
    for (const name of STRIP_ATTRS) {
      elm.removeAttribute(name);
    }
  }
  const toolTip = wrapDlBtn.querySelector('[role="tooltip"]');
  if (toolTip) {
    toolTip.remove();
  }

  const toolBarBtn = wrapDlBtn.querySelector("button");
  const toolBarSvg = wrapDlBtn.querySelector("svg");
  if (!toolBarBtn || !toolBarSvg) {
    return;
  }

  const toolBarPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  toolBarPath.setAttribute("d", ICON_PATH);
  toolBarBtn.type = "button";
  toolBarSvg.setAttribute("viewBox", ICON_VIEWBOX);
  toolBarSvg.setAttribute("class", "Q6yead QJZfhe Q06W8");
  toolBarSvg.replaceChildren(toolBarPath);

  toolBarBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const target = currentTarget();
    if (target) {
      openDownload(target);
    }
  });

  containerPrintBtn.before(wrapDlBtn);
}

function schedule(): void {
  clearTimeout(timer);
  timer = setTimeout(addToolbarButton, 150);
}

function main(): void {
  if (location.hostname === "drive.google.com" && embeddedByClassroom()) {
    mode = "frame";
  } else if (location.origin === CLASSROOM_ORIGIN && window === window.top) {
    mode = "top";
  }
  if (!mode) {
    return;
  } else if (mode === "frame") {
    addEventListener("message", (event) => {
      if (event.origin !== CLASSROOM_ORIGIN || event.source !== window.parent) {
        return;
      }
      const data = event.data;
      if (!data || data.type !== "dnt:target") {
        return;
      }
      if (!isValidId(data.fileId) || !isValidAuthuser(data.authUser)) {
        return;
      }
      fromParent = { fileId: data.fileId, authUser: data.authUser };
      addToolbarButton();
    })
  }

  new MutationObserver(schedule).observe(document.documentElement, {childList: true, subtree: true});

  requestTarget();
  addToolbarButton();
}

main();