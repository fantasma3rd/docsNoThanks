import { DEFAULT_MODE, isValidMode, MODES, SETTINGS_KEY, type DownloadMode } from "./shared";

const settingForm = document.getElementById("settings");
const settingRadios = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="mode"]'));
const radioBackground = settingRadios.find((settingRadio) => settingRadio.value === MODES.BACKGROUND);
const warningNote = document.getElementById("bg-unavailable");

const supportsBackground = Boolean(chrome?.downloads);
if (!supportsBackground) {
  if (radioBackground) {
    radioBackground.disabled = true;
    radioBackground.closest(".opt")?.classList.add("is-disabled");
  }
  if (warningNote) {
    warningNote.hidden = false;
  }
}

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

  if (mode === MODES.BACKGROUND && !supportsBackground) {
    mode = DEFAULT_MODE;
  }
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
