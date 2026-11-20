import { createDownloadUrl, isValidAuthuser, isValidId, MSG_DOWNLOAD } from "./shared";

const FIRST_CHECK_MS = 2000;  // 初回確認までの待ち時間
const RECHECK_MS = 1000;  // 再確認の間隔
const GIVE_UP_MS = 20000;  // 待ち時間の限度
async function reveal(tab: chrome.tabs.Tab): Promise<void> {
  await chrome.tabs.update(tab.id, { active: true }).catch(() => {});
  if (tab.windowId !== undefined) {
    await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
  }
}

async function inspect(downloadId: number): Promise<void> {
  const url = pendingMap.get(downloadId);
  if (!url) {
    return;
  }

  const [downloadItem] = await chrome.downloads.search({ id: downloadId });

  if (!downloadItem) {  // ダウンロード完了時
    pendingMap.delete(downloadId);
    return;
  }

  if (downloadItem.error) {  // ダウンロード失敗時(ネットワークエラー)
    pendingMap.delete(downloadId);
    if (/^(SERVER_|NETWORK_)/.test(downloadItem.error)) {
      openTab(url);
    }
    return;
  }

  if (downloadItem.mime && /^text\/html\b/i.test(downloadItem.mime)) {  // ダウンロード失敗時(Webページ返却)
    pendingMap.delete(downloadId);
    await chrome.downloads.cancel(downloadId).catch(() => { });
    await chrome.downloads.erase({ id: downloadId }).catch(() => { });
    openTab(url);
    return;
  }

  if (downloadItem.mime || downloadItem.state === "complete") {
    pendingMap.delete(downloadId);
  }
}

async function startDownload(url: string): Promise<void> {
  if (!chrome.downloads) {  // ブラウザ非対応時
    openTab(url);
    return;
  }
  try {
    const downloadId = await chrome.downloads.download({ url, saveAs: false });
    if (downloadId === undefined) {  // バックグラウンドでのダウンロード失敗時
      openTab(url);
      return;
    }
    pendingMap.set(downloadId, url);
    await inspect(downloadId);
  } catch (_) {
    openTab(url);
  }
}

if (chrome.downloads?.onChanged) {
  chrome.downloads.onChanged.addListener((diff) => {
    if (!pendingMap.has(diff.id)) {
      return;
    }
    if (diff.mime || diff.error || diff.state) {
      inspect(diff.id).catch(() => { });
    }
  });
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