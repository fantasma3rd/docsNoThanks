import { DEFAULT_MODE, isValidMode, SETTINGS_KEY, type DownloadMode } from "./shared";

const settingForm = document.getElementById("settings");
const settingRadios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="mode"]'));

settingForm?.addEventListener("submit", (event) => event.preventDefault());

function show(mode: DownloadMode): void {
  for (const settingRadio of settingRadios) {
    settingRadio.checked = settingRadio.value === mode;
  }
}

async function load(): Promise<void> {
  let mode: DownloadMode = DEFAULT_MODE;
  try {
    const settingValue = await chrome.storage.local.get(SETTINGS_KEY);
    if (settingValue && isValidMode(settingValue[SETTINGS_KEY])) {
      mode = settingValue[SETTINGS_KEY];
    }
  } catch (_) { }

  show(mode);
}

for (const settingRadio of settingRadios) {
  settingRadio.addEventListener("change", () => {
    if (!settingRadio.checked) {
      return;
    }
    chrome.storage.local.set({ [SETTINGS_KEY]: settingRadio.value });
  })
}

load();
