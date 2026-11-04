// Welcome page shown once after install: saves the tester's name, asks for page access if the browser
// requires it (Firefox), and opens the tool in whatever form this browser supports.
const input = document.getElementById('nombre');
const IS_FIREFOX = typeof browser !== 'undefined' && !!browser.sidebarAction;
let windowId = null; // fetched up front: sidePanel.open must be called synchronously in the click
chrome.windows.getCurrent().then((w) => { windowId = w.id; });

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

async function guardar() {
  const nombre = input.value.trim();
  if (!nombre) { toast('Escribe tu nombre'); input.focus(); return; }
  await load();
  state.settings.nombre = nombre;
  await save();
  document.getElementById('n1').classList.add('done');
  document.getElementById('n1').textContent = '✓';
  toast('Nombre guardado');
}

document.getElementById('guardar').addEventListener('click', guardar);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') guardar(); });

document.getElementById('abrir').addEventListener('click', () => {
  // Side panel and Firefox sidebar must be opened synchronously inside the click.
  if (IS_FIREFOX) { browser.sidebarAction.open(); }
  else if (chrome.sidePanel && chrome.sidePanel.open && state.settings.modoPanel !== 'ventana') {
    chrome.sidePanel.open({ windowId }).catch(() => chrome.runtime.sendMessage({ type: 'qa-open-window' }));
  } else {
    chrome.runtime.sendMessage({ type: 'qa-open-window' });
  }
  if (input.value.trim()) guardar();
});

document.getElementById('dar-permiso').addEventListener('click', async () => {
  const ok = await chrome.permissions.request({ origins: ['<all_urls>'] });
  if (ok) {
    document.getElementById('np').classList.add('done');
    document.getElementById('np').textContent = '✓';
    toast('Permiso concedido');
  } else {
    toast('Sin permiso no se pueden tomar capturas');
  }
});

load().then(async () => {
  input.value = state.settings.nombre || '';
  input.focus();
  try {
    const granted = await chrome.permissions.contains({ origins: ['<all_urls>'] });
    document.getElementById('permiso').hidden = granted;
  } catch (_) { /* API missing: nothing to ask */ }
});
