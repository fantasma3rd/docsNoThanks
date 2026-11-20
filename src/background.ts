import { createDownloadUrl, isValidAuthuser, isValidId, MSG_DOWNLOAD } from "./shared";

const FIRST_CHECK_MS = 2000;  // 初回確認までの待ち時間
const RECHECK_MS = 1000;  // 再確認の間隔
const GIVE_UP_MS = 20000;  // 待ち時間の限度

const pendingMap = new Map<number, { start: number }>();

async function check(tabId: number): Promise<void> {
  const entry = pendingMap.get(tabId);
  if (!entry) {  // ダウンロード開始時
    return;
  }

  let tab: chrome.tabs.Tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch (_) {
    pendingMap.delete(tabId);  // すでに存在しない場合
    return;
  }

  if (tab.status === "loading" && (Date.now() - entry.start) < GIVE_UP_MS) {  // 応答待ちの場合
    schedule(tabId, RECHECK_MS);
    return;
  }

  // ページ表示またはエラーの場合
  pendingMap.delete(tabId);
  await reveal(tab);
}

function schedule(tabId: number, ms: number): void {
  setTimeout(() => {
    check(tabId).catch(() => pendingMap.delete(tabId));
  }, ms)
}

async function reveal(tab: chrome.tabs.Tab): Promise<void> {
  await chrome.tabs.update(tab.id, { active: true }).catch(() => {});
  if (tab.windowId !== undefined) {
    await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
  }
}

async function startDownload(url: string, openerTabId: number | undefined): Promise<void> {
  let tab: chrome.tabs.Tab;
  try {
    tab = await chrome.tabs.create({ url, active: false, openerTabId });
  } catch (_) {
    try {
      tab = await chrome.tabs.create({ url, active: false });
    } catch (_) {
      return;
    }
  }

  if (!tab || tab.id === undefined) {
    return;
  }

  pendingMap.set(tab.id, { start: Date.now() });
  schedule(tab.id, FIRST_CHECK_MS);
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== MSG_DOWNLOAD) {
    return false;
  }
  if (!isValidId(msg.fileId) || !isValidAuthuser(msg.authUser)) {
    sendResponse({ ok: false });
    return false;
  }
  startDownload(createDownloadUrl(msg.fileId, msg.authUser)).catch(() => { });
  sendResponse({ ok: true });
  return false;
});