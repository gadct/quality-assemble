// Service worker / background script. Works in Chromium browsers (Chrome, Edge, Opera, Opera GX, Brave, Vivaldi)
// and Firefox. Responsibilities:
//  - open the tool: native side panel when available, Firefox sidebar, or a docked popup window as fallback
//  - remember which page tab the tool is working on (needed in window mode)
//  - activate capture in tabs that were already open, show the welcome page on first install
//  - apply updates downloaded by instalador/actualizar.ps1

const HAS_SIDE_PANEL = !!(chrome.sidePanel && chrome.sidePanel.setPanelBehavior);
const FF_SIDEBAR = (typeof browser !== 'undefined' && browser.sidebarAction) ? browser.sidebarAction : null;
const PANEL_WIDTH = 420;

const CAPTURE_SCRIPTS = [
  { files: ['capture-main.js'], world: 'MAIN' },
  { files: ['capture-bridge.js'], world: 'ISOLATED' }
];

// 'panel' (native side panel) unless the browser lacks it or the user chose 'ventana' in Datos > Tus datos.
async function applyOpenMode() {
  if (!HAS_SIDE_PANEL) return;
  const { qa } = await chrome.storage.local.get('qa');
  const useWindow = qa && qa.settings && qa.settings.modoPanel === 'ventana';
  try { await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: !useWindow }); } catch (_) { /* unsupported */ }
}

async function openPanelWindow(tab) {
  if (tab && tab.id) await rememberTab(tab.id, tab.windowId, tab.url);
  const { panelWindowId } = await chrome.storage.session.get('panelWindowId');
  if (panelWindowId) {
    try { await chrome.windows.update(panelWindowId, { focused: true }); return; } catch (_) { /* was closed */ }
  }
  const opts = { url: chrome.runtime.getURL('sidepanel.html?modo=ventana'), type: 'popup', width: PANEL_WIDTH, height: 800 };
  try {
    const base = await chrome.windows.get(tab ? tab.windowId : chrome.windows.WINDOW_ID_CURRENT);
    if (base.left !== undefined) {
      Object.assign(opts, { left: Math.max(0, base.left + base.width - PANEL_WIDTH), top: base.top, height: base.height });
    }
  } catch (_) { /* default size */ }
  const win = await chrome.windows.create(opts);
  await chrome.storage.session.set({ panelWindowId: win.id });
}

// Only fires when the side panel is NOT bound to the icon (window mode, Firefox, or no sidePanel API).
chrome.action.onClicked.addListener((tab) => {
  if (FF_SIDEBAR) { FF_SIDEBAR.toggle(); return; } // must run synchronously inside the click
  openPanelWindow(tab);
});

// ---- target tab tracking (window mode: the tool's own window is focused while working) ----
async function rememberTab(tabId, windowId, url) {
  if (url && url.startsWith(chrome.runtime.getURL(''))) return; // our own report/welcome pages
  const { panelWindowId } = await chrome.storage.session.get('panelWindowId');
  if (windowId === panelWindowId) return;
  const win = await chrome.windows.get(windowId);
  if (win.type !== 'normal') return;
  await chrome.storage.session.set({ targetTabId: tabId });
}

chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  try { const t = await chrome.tabs.get(tabId); await rememberTab(tabId, windowId, t.url); } catch (_) { /* tab gone */ }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  try {
    const [t] = await chrome.tabs.query({ active: true, windowId });
    if (t) await rememberTab(t.id, windowId, t.url);
  } catch (_) { /* ignore */ }
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const { panelWindowId } = await chrome.storage.session.get('panelWindowId');
  if (windowId === panelWindowId) await chrome.storage.session.remove('panelWindowId');
});

chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  if (msg && msg.type === 'qa-open-window') {
    chrome.storage.session.get('targetTabId')
      .then(({ targetTabId }) => (targetTabId ? chrome.tabs.get(targetTabId).catch(() => null) : null))
      .then((tab) => openPanelWindow(tab))
      .then(() => reply({ ok: true }), () => reply({ ok: false }));
    return true;
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.qa) applyOpenMode();
});

// ---- install / startup ----
function setup() {
  applyOpenMode();
  chrome.alarms.create('update-check', { periodInMinutes: 30 });
}

// Content scripts only run on pages loaded after install/update. Inject them now so open tabs need no reload.
async function injectIntoOpenTabs() {
  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
  for (const tab of tabs) {
    for (const s of CAPTURE_SCRIPTS) {
      try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: s.files, world: s.world }); }
      catch (_) { /* restricted page or no permission yet: skip */ }
    }
  }
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  setup();
  await injectIntoOpenTabs();
  if (reason === 'install') chrome.tabs.create({ url: chrome.runtime.getURL('bienvenida.html') });
});

chrome.runtime.onStartup.addListener(setup);

// ---- updates ----
// The updater swaps the files on disk; the browser keeps the old version in memory.
// Reload when files changed and none of our pages is open, so an unsaved bug draft is never lost.
// If something is open, the panel offers "Aplicar ahora".
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'update-check') return;
  try {
    const res = await fetch(chrome.runtime.getURL('manifest.json'), { cache: 'no-store' });
    const onDisk = (await res.json()).version;
    if (onDisk === chrome.runtime.getManifest().version) return;
    const open = await chrome.runtime.getContexts({ contextTypes: ['SIDE_PANEL', 'TAB'] });
    if (open.length === 0) chrome.runtime.reload();
  } catch (_) { /* files mid-swap, or getContexts unsupported (Firefox): try again later */ }
});
