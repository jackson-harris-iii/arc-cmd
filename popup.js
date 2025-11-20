const STORAGE_KEY = "arcCommandSettings";
const toggle = document.getElementById("popup-toggle");
const statusText = document.getElementById("status-text");
const optionsButton = document.getElementById("open-options");

initPopup();

function initPopup() {
  loadState();
  toggle.addEventListener("change", handleToggle);
  optionsButton.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      applySettings(changes[STORAGE_KEY].newValue);
    }
  });
}

async function loadState() {
  const data = await chrome.storage.sync.get(STORAGE_KEY);
  applySettings(data[STORAGE_KEY]);
}

function applySettings(settings) {
  const arcMode = Boolean(settings?.arcMode);
  toggle.checked = arcMode;
  statusText.textContent = arcMode
    ? "Arc Mode is active. Shortcuts override Chrome defaults."
    : "Arc Mode is off. Chrome defaults remain untouched.";
}

async function handleToggle(event) {
  await chrome.runtime.sendMessage({
    type: "arc-cmd:set-arc-mode",
    arcMode: event.target.checked
  });
}

