const CLASSROOM_ORIGIN = "https://classroom.google.com";
let mode: "frame" | "top" | null = null;
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
