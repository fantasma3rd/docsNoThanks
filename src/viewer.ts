import { createDownloadUrl, isValidAuthuser, isValidId, state, type DownloadInfo, FILE_PATH } from "./shared";

const CLASSROOM_ORIGIN = "https://classroom.google.com";
let mode: "frame" | "top" | null = null;
let fromParent: DownloadInfo | null = null;
let requestsLeft: number = 8;

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
