// Quality Assemble side panel. All data lives in chrome.storage.local on this machine.
// Screenshots are stored under separate keys ("img:<bugId>") so the main state stays small.

const BACKUP_DAYS = 7;

// UI-only state, not persisted.
const ui = { tab: 'sesion', checklistId: null, bugId: null, draft: null, sessionView: null, guia: null, bugFilter: 'abiertos', glossQ: '' };

// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);
const activeSession = () => sessionById(state.activeSessionId);

async function setImg(bugId, dataUrl) {
  if (dataUrl) await chrome.storage.local.set({ ['img:' + bugId]: dataUrl });
  else await chrome.storage.local.remove('img:' + bugId);
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Copiado al portapapeles'); }
  catch (_) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    toast('Copiado al portapapeles');
  }
}

function download(name, content, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function downloadDataUrl(name, dataUrl) {
  const a = document.createElement('a');
  a.href = dataUrl; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

// Two-click confirmation for destructive buttons (no blocking dialogs).
function confirmClick(btn, label) {
  if (btn.dataset.armed) return true;
  btn.dataset.armed = '1';
  const original = btn.textContent;
  btn.textContent = label || '¿Seguro? Clic otra vez';
  setTimeout(() => { delete btn.dataset.armed; btn.textContent = original; }, 3000);
  return false;
}

// ---------- page context capture ----------
async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function captureContext() {
  const tab = await activeTab();
  const ctx = { url: tab?.url || '', title: tab?.title || '', navegador: browserName(), viewport: '', logs: [], aviso: '' };
  if (!tab) return { ctx, img: null };
  try {
    const r = await chrome.tabs.sendMessage(tab.id, { type: 'qa-get-context' });
    Object.assign(ctx, { url: r.url, title: r.title, viewport: `${r.viewport} (zoom ${r.zoom}%)`, logs: r.logs || [] });
  } catch (_) {
    ctx.aviso = 'No se pudieron leer los errores técnicos de esta página. Recárgala (F5) y vuelve a capturar.';
  }
  let img = null;
  try { img = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 80 }); }
  catch (_) { ctx.aviso = (ctx.aviso ? ctx.aviso + ' ' : '') + 'No se pudo tomar la captura de esta pestaña.'; }
  return { ctx, img };
}

async function clearPageLogs() {
  const tab = await activeTab();
  try { await chrome.tabs.sendMessage(tab.id, { type: 'qa-clear-logs' }); return true; }
  catch (_) { return false; }
}


// ---------- rendering ----------
function renderSessionBar() {
  const s = activeSession();
  $('#session-bar').innerHTML = s
    ? `Sesión activa: <strong>${esc(s.proyecto || 'Sin proyecto')}${s.modulo ? ' / ' + esc(s.modulo) : ''}</strong> · ${duration(now() - s.inicio)}`
    : 'Sin sesión activa';
}

// ---------- updates ----------
// The updater script (instalador/actualizar.ps1) replaces the files on disk.
// Chrome keeps running the old version until the extension reloads or the browser restarts.
function cmpVersion(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0); }
  return 0;
}

async function checkUpdates() {
  const running = chrome.runtime.getManifest().version;
  let onDisk = running;
  try { onDisk = (await (await fetch(chrome.runtime.getURL('manifest.json'), { cache: 'no-store' })).json()).version; } catch (_) { /* keep running version */ }
  if (cmpVersion(onDisk, running) !== 0) { ui.update = { tipo: 'instalada', version: onDisk }; renderBanner(); return; }
  const { update = {} } = await chrome.storage.local.get('update');
  if (!update.checked || now() - update.checked > 86400000) {
    try {
      const r = await fetch(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`, { cache: 'no-store' });
      if (r.ok) { update.latest = (await r.json()).tag_name.replace(/^v/, ''); update.checked = now(); await chrome.storage.local.set({ update }); }
    } catch (_) { /* offline: try again next time */ }
  }
  if (update.latest && cmpVersion(update.latest, running) > 0) { ui.update = { tipo: 'disponible', version: update.latest }; renderBanner(); }
}

function renderBanner() {
  const hasData = state.bugs.length || state.sessions.length;
  const old = !state.lastBackup || now() - state.lastBackup > BACKUP_DAYS * 86400000;
  let html = '';
  if (ui.update && ui.update.tipo === 'instalada') {
    html += `<div class="banner">Se descargó la versión ${esc(ui.update.version)}. ${ui.draft ? 'Guarda primero el bug que estás editando. ' : ''}<button class="btn small" data-action="apply-update">Aplicar ahora</button></div>`;
  } else if (ui.update && ui.update.tipo === 'disponible') {
    html += `<div class="banner">Hay una versión nueva (${esc(ui.update.version)}). Se instala sola al reiniciar el equipo, o abre el acceso directo "Actualizar Quality Assemble" del escritorio.</div>`;
  }
  if (hasData && old) {
    html += `<div class="banner">Tus datos solo están en este navegador. ${state.lastBackup ? 'El último respaldo fue el ' + esc(fmtDate(state.lastBackup)) + '.' : 'Aún no haces ningún respaldo.'} <button class="btn small" data-action="backup">Hacer respaldo ahora</button></div>`;
  }
  $('#banner').innerHTML = html;
}

function render() {
  document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === ui.tab)));
  renderSessionBar();
  renderBanner();
  const views = { sesion: viewSesion, probar: viewProbar, bugs: viewBugs, dudas: viewDudas, ayuda: viewAyuda, datos: viewDatos };
  $('#view').innerHTML = views[ui.tab]();
  if (ui.tab === 'bugs' && ui.draft) hydrateBugImage();
}

function projectOptions() {
  const uniq = (k) => [...new Set(state.sessions.map((s) => s[k]).filter(Boolean))];
  return ['proyecto', 'modulo', 'ambiente'].map((k) => `<datalist id="dl-${k}">${uniq(k).map((v) => `<option value="${esc(v)}">`).join('')}</datalist>`).join('');
}

function viewSesion() {
  if (ui.sessionView) {
    const s = sessionById(ui.sessionView);
    return `<button class="btn small" data-action="back-sessions">Volver</button>
      <div class="card" style="margin-top:10px"><h2>Resumen de la sesión</h2><div class="logs" style="max-height:none">${esc(sessionSummaryText(s))}</div>
      <div class="row"><button class="btn primary" data-action="copy-summary" data-id="${s.id}">Copiar resumen</button><button class="btn" data-action="pdf-session" data-id="${s.id}">Descargar PDF</button></div></div>`;
  }
  const s = activeSession();
  if (s) {
    const st = sessionStats(s);
    return `<div class="card">
      <h2>${esc(s.objetivo || 'Sesión en curso')}</h2>
      <p class="muted">${esc(s.proyecto || '-')} / ${esc(s.modulo || '-')} · Ambiente: ${esc(s.ambiente || '-')} · Desde ${esc(fmtDate(s.inicio))}</p>
      <p class="muted">${st.pasa + st.falla + st.na} puntos revisados · ${st.bugs.length} bugs · ${st.dudas.length} dudas</p>
      <label for="s-notas">Notas de la sesión <span class="hint">(qué probaste, qué entiendes que debe hacer la pantalla, lo que te llame la atención)</span></label>
      <textarea id="s-notas" data-field="notas" rows="6">${esc(s.notas || '')}</textarea>
      <div class="row">
        <button class="btn primary" data-tab-go="probar">Ir a probar</button>
        <button class="btn" data-action="end-session">Terminar sesión</button>
      </div>
    </div>`;
  }
  const past = [...state.sessions].reverse().slice(0, 15);
  return `<div class="card">
      <h2>Nueva sesión de pruebas</h2>
      <p class="muted">Una sesión es un bloque de trabajo con un objetivo. Sirve para saber después qué probaste, cuándo y cuánto tiempo.</p>
      ${projectOptions()}
      <label for="n-proyecto">Proyecto o sistema</label><input id="n-proyecto" list="dl-proyecto" placeholder="Nombre del sistema">
      <label for="n-modulo">Módulo o pantalla</label><input id="n-modulo" list="dl-modulo" placeholder="Por ejemplo: Clientes, Facturación">
      <label for="n-ambiente">Ambiente</label><input id="n-ambiente" list="dl-ambiente" placeholder="Pruebas, QA, staging">
      <label for="n-qa">Tu nombre <span class="hint">(aparece como "Reportado por" en los reportes)</span></label><input id="n-qa" value="${esc(state.settings.nombre)}" placeholder="Nombre y apellido">
      <label for="n-objetivo">Objetivo <span class="hint">(qué vas a probar)</span></label><input id="n-objetivo" placeholder="Probar el alta y edición de clientes">
      <div class="row"><button class="btn primary" data-action="start-session">Iniciar sesión</button></div>
    </div>
    ${past.length ? `<h3>Sesiones anteriores</h3>${past.map((p) => `<button class="list-item" data-action="open-session" data-id="${p.id}">
        <div>${esc(p.objetivo || 'Sin objetivo')}</div>
        <div class="meta">${esc(p.proyecto || '-')} / ${esc(p.modulo || '-')} · ${esc(fmtDate(p.inicio))} · ${duration((p.fin || now()) - p.inicio)}</div></button>`).join('')}` : ''}`;
}

function viewProbar() {
  const s = activeSession();
  if (!s) return `<div class="empty"><p>Para registrar lo que pruebas, primero inicia una sesión.</p><button class="btn primary" data-tab-go="sesion">Iniciar sesión</button></div>`;
  const checks = state.checks[s.id] || {};
  if (!ui.checklistId) {
    return `<p class="muted">Elige el tipo de pantalla que estás probando. "Cualquier pantalla" aplica siempre.</p>
      ${CHECKLISTS.map((c) => {
        const done = c.items.filter((i) => checks[i.id]).length;
        const fails = c.items.filter((i) => checks[i.id] === 'falla').length;
        return `<button class="list-item" data-action="open-checklist" data-id="${c.id}">
          <div><strong>${esc(c.nombre)}</strong></div>
          <div class="meta">${esc(c.cuando)}</div>
          <div class="meta">${done}/${c.items.length} revisados${fails ? ` · ${fails} con falla` : ''}</div></button>`;
      }).join('')}`;
  }
  const c = CHECKLISTS.find((x) => x.id === ui.checklistId);
  const done = c.items.filter((i) => checks[i.id]).length;
  const opts = [['pasa', 'Funciona'], ['falla', 'Falla'], ['na', 'No aplica']];
  return `<button class="btn small" data-action="close-checklist">Volver a las listas</button>
    <div class="card" style="margin-top:10px">
      <h2>${esc(c.nombre)}</h2>
      <p class="progress">${done} de ${c.items.length} revisados</p>
      ${c.items.map((i) => `<div class="item">
        <div class="que">${esc(i.que)}</div>
        <details><summary>Por qué y cómo se ve si falla</summary>
          <p><strong>Por qué:</strong> ${esc(i.porque)}</p>
          <p><strong>Si falla verás:</strong> ${esc(i.falla)}</p></details>
        <div class="state-btns">${opts.map(([v, l]) => `<button data-action="set-check" data-id="${i.id}" data-val="${v}" ${checks[i.id] === v ? `data-on="${v}"` : ''}>${l}</button>`).join('')}
          ${checks[i.id] === 'falla' ? `<button data-action="bug-from-check" data-id="${i.id}">Crear bug</button>` : ''}</div>
      </div>`).join('')}
    </div>`;
}

function viewBugs() {
  if (ui.draft) return viewBugForm();
  const filters = { abiertos: (b) => !['cerrado', 'rechazado'].includes(b.estado), sesion: (b) => b.sessionId && b.sessionId === state.activeSessionId, todos: () => true };
  const list = [...state.bugs].reverse().filter(filters[ui.bugFilter] || filters.todos);
  const retest = state.bugs.filter((b) => b.estado === 'corregido').length;
  return `<div class="row" style="margin-top:0">
      <button class="btn primary" data-action="new-bug">Nuevo bug</button>
      <select id="bug-filter" aria-label="Filtrar bugs" style="width:auto">
        <option value="abiertos" ${ui.bugFilter === 'abiertos' ? 'selected' : ''}>Pendientes</option>
        <option value="sesion" ${ui.bugFilter === 'sesion' ? 'selected' : ''}>De la sesión activa</option>
        <option value="todos" ${ui.bugFilter === 'todos' ? 'selected' : ''}>Todos</option>
      </select>
    </div>
    <p class="muted" style="margin-top:8px">Al presionar "Nuevo bug" se guarda una captura de la pestaña y los errores técnicos de la página. Abre primero la pantalla donde está el problema.</p>
    ${retest ? `<p><strong>${retest}</strong> bug(s) marcados como corregidos esperan retest.</p>` : ''}
    ${list.length ? list.map((b) => `<button class="list-item" data-action="open-bug" data-id="${b.id}">
        <div><span class="sev sev-${b.severidad}">${esc(sevName(b.severidad))}</span> ${esc(b.id)} · ${esc(b.titulo || 'Sin título')}</div>
        <div class="meta">${esc(estadoName(b.estado))} · ${esc(b.proyecto || '-')} / ${esc(b.modulo || '-')} · ${esc(fmtDate(b.creado))}</div></button>`).join('')
      : `<div class="empty"><p>No hay bugs en este filtro.</p></div>`}`;
}

function viewBugForm() {
  const b = ui.draft;
  const sev = SEVERIDADES.find((s) => s.id === b.severidad);
  return `<button class="btn small" data-action="cancel-bug">Volver a la lista</button>
  <div class="card" style="margin-top:10px">
    <h2>${b.id ? esc(b.id) : 'Nuevo bug'}</h2>
    ${b.aviso ? `<p class="banner" style="margin:0 0 8px">${esc(b.aviso)}</p>` : ''}
    <label for="b-titulo">Título <span class="hint">(qué pasa y dónde)</span></label>
    <input id="b-titulo" data-draft="titulo" value="${esc(b.titulo)}" placeholder="Guardar cliente duplica el registro con doble clic">
    <label for="b-sev">Severidad</label>
    <select id="b-sev" data-draft="severidad">${SEVERIDADES.map((s) => `<option value="${s.id}" ${b.severidad === s.id ? 'selected' : ''}>${s.nombre}</option>`).join('')}</select>
    <p class="muted" id="sev-hint">${esc(sev ? sev.regla : '')}</p>
    <label for="b-pasos">Pasos para reproducir <span class="hint">(uno por línea)</span></label>
    <textarea id="b-pasos" data-draft="pasos" rows="5" placeholder="Entrar al módulo Clientes&#10;Presionar Nuevo&#10;Llenar nombre y guardar con doble clic">${esc(b.pasos)}</textarea>
    <label for="b-esperado">Resultado esperado <span class="hint">(qué debería pasar)</span></label>
    <textarea id="b-esperado" data-draft="esperado" rows="2">${esc(b.esperado)}</textarea>
    <label for="b-actual">Resultado actual <span class="hint">(qué pasa realmente)</span></label>
    <textarea id="b-actual" data-draft="actual" rows="2">${esc(b.actual)}</textarea>
    <label for="b-por">Reportado por</label>
    <input id="b-por" data-draft="reportadoPor" value="${esc(b.reportadoPor)}" placeholder="Tu nombre">
    <label for="b-usuario">Usuario de prueba usado <span class="hint">(nunca la contraseña)</span></label>
    <input id="b-usuario" data-draft="usuario" value="${esc(b.usuario)}">
    <label for="b-estado">Estado</label>
    <select id="b-estado" data-draft="estado">${ESTADOS_BUG.map((e) => `<option value="${e.id}" ${b.estado === e.id ? 'selected' : ''}>${e.nombre}</option>`).join('')}</select>

    <h3>Contexto capturado</h3>
    <p class="muted">URL: ${esc(b.url || '-')}<br>Navegador: ${esc(b.navegador || '-')}<br>Pantalla: ${esc(b.viewport || '-')}</p>
    <label>Errores técnicos <span class="hint">(${b.logs.length})</span></label>
    ${b.logs.length ? `<div class="logs">${esc(logsText(b.logs))}</div>` : '<p class="muted">No se registraron errores técnicos en la página.</p>'}
    <div id="shot-wrap"></div>
    <div class="row">
      <button class="btn small" data-action="recapture">Volver a capturar</button>
      <button class="btn small" data-action="clear-and-recapture" title="Borra los errores registrados en la página para que repitas los pasos y solo queden los nuevos">Limpiar errores y repetir</button>
      <button class="btn small" data-action="remove-shot">Quitar captura</button>
    </div>
    <div class="row">
      <button class="btn primary" data-action="save-bug">Guardar</button>
      <button class="btn" data-action="copy-bug">Copiar texto</button>
      <button class="btn" data-action="pdf-bug">Descargar PDF</button>
      <button class="btn" data-action="download-shot">Descargar captura</button>
      ${b.id ? '<button class="btn danger" data-action="delete-bug">Eliminar</button>' : ''}
    </div>
  </div>
  <div class="card"><h3 style="margin-top:0">Consejos</h3><ul class="muted" style="padding-left:18px;margin:0">${CONSEJOS_REPORTE.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>`;
}

async function hydrateBugImage() {
  const wrap = $('#shot-wrap');
  if (!wrap) return;
  const img = ui.draft.img !== undefined ? ui.draft.img : (ui.draft.id ? await getImg(ui.draft.id) : null);
  ui.draft.img = img;
  wrap.innerHTML = img ? `<label>Captura</label><img class="shot" src="${img}" alt="Captura de la pantalla con el problema">` : '<p class="muted">Sin captura.</p>';
}

function viewDudas() {
  const list = [...state.dudas].reverse();
  return `<div class="card">
      <h2>Registrar una duda</h2>
      <p class="muted">Cuando no sabes si algo está bien, pregunta y déjalo anotado. Así queda constancia de qué preguntaste, a quién y qué te respondieron.</p>
      <label for="d-pregunta">Pregunta</label><textarea id="d-pregunta" rows="2" placeholder="¿El buscador debe encontrar nombres sin tilde?"></textarea>
      <label for="d-quien">A quién se la hiciste</label><input id="d-quien" placeholder="Nombre o cargo">
      <div class="row"><button class="btn primary" data-action="add-duda">Guardar duda</button></div>
    </div>
    ${list.map((d) => `<div class="card">
      <div><strong>${esc(d.pregunta)}</strong></div>
      <p class="muted">${esc(d.id)} · A: ${esc(d.aQuien || '-')} · ${esc(fmtDate(d.creado))}${d.respondido ? ' · Respondida ' + esc(fmtDate(d.respondido)) : ''}</p>
      <label for="r-${d.id}">Respuesta</label>
      <textarea id="r-${d.id}" data-duda="${d.id}" rows="2" placeholder="Anota lo que te respondieron">${esc(d.respuesta || '')}</textarea>
      <div class="row"><button class="btn small danger" data-action="delete-duda" data-id="${d.id}">Eliminar</button></div>
    </div>`).join('')}`;
}

function viewAyuda() {
  const g = ui.guia || GUIA_BUG.inicio;
  const res = GUIA_BUG.resultados[g];
  const paso = GUIA_BUG.pasos[g];
  const guia = res
    ? `<p><strong>${esc(res.titulo)}.</strong> ${esc(res.texto)}</p>
       <div class="row">${res.accion === 'bug' ? '<button class="btn primary" data-action="new-bug">Crear bug</button>' : ''}${res.accion === 'duda' ? '<button class="btn primary" data-tab-go="dudas">Registrar duda</button>' : ''}<button class="btn" data-action="guia-reset">Empezar de nuevo</button></div>`
    : `<p>${esc(paso.pregunta)}</p><div class="row"><button class="btn" data-action="guia" data-to="${paso.si}">Sí</button><button class="btn" data-action="guia" data-to="${paso.no}">No</button>${g !== GUIA_BUG.inicio ? '<button class="btn small" data-action="guia-reset">Empezar de nuevo</button>' : ''}</div>`;
  const q = ui.glossQ.toLowerCase();
  const terms = GLOSARIO.filter((t) => !q || (t.termino + ' ' + t.def).toLowerCase().includes(q));
  return `<div class="card"><h2>¿Es un bug?</h2>${guia}</div>
    <div class="card"><h2>Cómo elegir la severidad</h2>
      ${SEVERIDADES.map((s) => `<p><span class="sev sev-${s.id}">${esc(s.nombre)}</span> ${esc(s.regla)}<br><span class="muted">Ejemplo: ${esc(s.ejemplo)}</span></p>`).join('')}</div>
    <div class="card"><h2>Glosario</h2>
      <input id="gloss-q" placeholder="Buscar un término" value="${esc(ui.glossQ)}" aria-label="Buscar en el glosario">
      <dl class="gloss">${terms.map((t) => `<dt>${esc(t.termino)}</dt><dd>${esc(t.def)}</dd>`).join('') || '<p class="muted">No hay términos con esa palabra.</p>'}</dl></div>`;
}

function viewDatos() {
  const today = fmtDay(now());
  const weekAgo = fmtDay(now() - 6 * 86400000);
  return `<div class="card">
      <h2>Exportar bugs a Excel</h2>
      <p class="muted">Genera un archivo .csv que Excel abre directamente. Las capturas se descargan aparte con el nombre del bug (por ejemplo BUG-001.jpg).</p>
      <label for="x-scope">Qué bugs</label>
      <select id="x-scope">
        <option value="abiertos">Abiertos (sin reportar)</option>
        <option value="sesion">De la sesión activa</option>
        <option value="todos">Todos</option>
      </select>
      <div class="row"><button class="btn primary" data-action="export-csv">Descargar Excel</button><button class="btn" data-action="pdf-bugs">Descargar PDF</button><button class="btn" data-action="export-shots">Descargar capturas</button></div>
      <p class="muted" style="margin-top:8px">Después de pasarlos al Excel o a la aplicación de la empresa, cambia su estado a "Reportado".</p>
      <div class="row"><button class="btn small" data-action="mark-reported">Marcar los abiertos como reportados</button></div>
    </div>
    <div class="card">
      <h2>Resumen de actividad</h2>
      <p class="muted">Texto listo para enviar: sesiones, tiempo, puntos revisados, bugs y dudas en un rango de fechas.</p>
      <div class="row" style="margin-top:0">
        <div style="flex:1"><label for="a-from">Desde</label><input id="a-from" type="date" value="${weekAgo}"></div>
        <div style="flex:1"><label for="a-to">Hasta</label><input id="a-to" type="date" value="${today}"></div>
      </div>
      <div class="row"><button class="btn primary" data-action="copy-activity">Copiar resumen</button><button class="btn" data-action="pdf-activity">Descargar PDF</button></div>
    </div>
    <div class="card">
      <h2>Tus datos</h2>
      <label for="set-nombre">Tu nombre <span class="hint">(aparece como "Reportado por")</span></label>
      <input id="set-nombre" data-setting="nombre" value="${esc(state.settings.nombre)}" placeholder="Nombre y apellido">
    </div>
    <div class="card">
      <h2>Respaldo</h2>
      <p class="muted">Tus datos solo existen en este navegador. Si desinstalas la extensión o borras los datos del navegador, se pierden. Guarda el respaldo en una carpeta segura (OneDrive, Google Drive o un pendrive).</p>
      <p class="muted">Último respaldo: ${state.lastBackup ? esc(fmtDate(state.lastBackup)) : 'nunca'}</p>
      <div class="row"><button class="btn primary" data-action="backup">Descargar respaldo</button>
        <button class="btn" data-action="pick-restore">Restaurar respaldo</button>
        <input id="restore-file" type="file" accept="application/json,.json" hidden></div>
      <p class="muted" style="margin-top:8px">Restaurar reemplaza todos los datos actuales por los del archivo. Antes de hacerlo se descarga una copia de lo que tienes ahora.</p>
    </div>`;
}

// ---------- actions ----------
function newDraft(extra = {}) {
  const s = activeSession();
  return {
    id: null, titulo: '', severidad: 'medio', pasos: '', esperado: '', actual: '', usuario: '', estado: 'abierto',
    proyecto: s?.proyecto || '', modulo: s?.modulo || '', ambiente: s?.ambiente || '', sessionId: s?.id || null,
    url: '', navegador: '', viewport: '', logs: [], aviso: '', img: null, reportadoPor: state.settings.nombre || '', ...extra
  };
}

async function openNewBug(extra) {
  ui.tab = 'bugs';
  toast('Capturando la pantalla...');
  const { ctx, img } = await captureContext();
  ui.draft = newDraft({ ...extra, url: ctx.url, navegador: ctx.navegador, viewport: ctx.viewport, logs: ctx.logs, aviso: ctx.aviso, img });
  render();
}

async function recapture() {
  const { ctx, img } = await captureContext();
  Object.assign(ui.draft, { url: ctx.url, navegador: ctx.navegador, viewport: ctx.viewport, logs: ctx.logs, aviso: ctx.aviso, img });
  render();
  toast('Contexto actualizado');
}

async function saveBug() {
  const d = ui.draft;
  if (!d.titulo.trim()) { toast('Escribe un título antes de guardar'); $('#b-titulo')?.focus(); return null; }
  const fields = ['titulo', 'severidad', 'pasos', 'esperado', 'actual', 'usuario', 'estado', 'proyecto', 'modulo', 'ambiente', 'sessionId', 'url', 'navegador', 'viewport', 'logs', 'checkItemId', 'reportadoPor'];
  let bug = d.id && bugById(d.id);
  if (!bug) {
    state.counters.bug += 1;
    bug = { id: `BUG-${pad(state.counters.bug)}`, creado: now() };
    state.bugs.push(bug);
    d.id = bug.id;
  }
  fields.forEach((f) => { if (d[f] !== undefined) bug[f] = d[f]; });
  bug.actualizado = now();
  bug.tieneCaptura = !!d.img;
  await setImg(bug.id, d.img);
  await save();
  ui.draft = null;
  render();
  toast(`${bug.id} guardado`);
  return bug.id;
}

async function backup() {
  const all = await chrome.storage.local.get(null);
  const images = Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith('img:')));
  state.lastBackup = now();
  await save();
  download(`quality-assemble-respaldo-${fmtDay(now())}.json`, JSON.stringify({ version: 1, state, images }), 'application/json');
  render();
  toast('Respaldo descargado');
}

async function restore(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data.state || !Array.isArray(data.state.bugs) || !Array.isArray(data.state.sessions)) throw new Error('formato');
    // Safety net: download the current data before replacing it.
    if (state.bugs.length || state.sessions.length || state.dudas.length) {
      const all = await chrome.storage.local.get(null);
      const images = Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith('img:')));
      download(`quality-assemble-antes-de-restaurar-${fmtDay(now())}.json`, JSON.stringify({ version: 1, state, images }), 'application/json');
    }
    await chrome.storage.local.clear();
    state = { ...state, ...data.state };
    await chrome.storage.local.set({ [KEY]: state, ...(data.images || {}) });
    ui.draft = null; ui.sessionView = null; ui.checklistId = null;
    render();
    toast('Respaldo restaurado');
  } catch (_) {
    toast('El archivo no es un respaldo válido de Quality Assemble');
  }
}

function openReport(params) {
  chrome.tabs.create({ url: chrome.runtime.getURL('report.html') + '?' + new URLSearchParams(params) });
}

function bugsByScope(scope) {
  if (scope === 'abiertos') return state.bugs.filter((b) => b.estado === 'abierto');
  if (scope === 'sesion') return state.bugs.filter((b) => b.sessionId && b.sessionId === state.activeSessionId);
  return state.bugs;
}

const actions = {
  'start-session': async () => {
    const v = (id) => $(id).value.trim();
    state.counters.session += 1;
    const s = { id: `S-${pad(state.counters.session)}`, proyecto: v('#n-proyecto'), modulo: v('#n-modulo'), ambiente: v('#n-ambiente'), objetivo: v('#n-objetivo'), qa: v('#n-qa'), inicio: now(), fin: null, notas: '' };
    if (s.qa) state.settings.nombre = s.qa;
    state.sessions.push(s);
    state.activeSessionId = s.id;
    await save(); render(); toast('Sesión iniciada');
  },
  'end-session': async (btn) => {
    if (!confirmClick(btn, '¿Terminar? Clic otra vez')) return;
    const s = activeSession();
    s.fin = now();
    state.activeSessionId = null;
    ui.sessionView = s.id;
    await save(); render();
  },
  'open-session': (btn) => { ui.sessionView = btn.dataset.id; render(); },
  'back-sessions': () => { ui.sessionView = null; render(); },
  'copy-summary': (btn) => copy(sessionSummaryText(sessionById(btn.dataset.id))),
  'open-checklist': (btn) => { ui.checklistId = btn.dataset.id; render(); },
  'close-checklist': () => { ui.checklistId = null; render(); },
  'set-check': async (btn) => {
    const sid = state.activeSessionId;
    state.checks[sid] = state.checks[sid] || {};
    const cur = state.checks[sid][btn.dataset.id];
    if (cur === btn.dataset.val) delete state.checks[sid][btn.dataset.id];
    else state.checks[sid][btn.dataset.id] = btn.dataset.val;
    await save();
    const y = window.scrollY; render(); window.scrollTo(0, y);
  },
  'bug-from-check': (btn) => {
    const item = CHECKLISTS.flatMap((c) => c.items).find((i) => i.id === btn.dataset.id);
    openNewBug({ pasos: item.que, checkItemId: item.id });
  },
  'new-bug': () => openNewBug(),
  'open-bug': (btn) => { const b = bugById(btn.dataset.id); ui.draft = { ...b, logs: b.logs || [], img: undefined, aviso: '' }; render(); },
  'cancel-bug': () => { ui.draft = null; render(); },
  'save-bug': saveBug,
  'recapture': recapture,
  'clear-and-recapture': async () => {
    const ok = await clearPageLogs();
    toast(ok ? 'Errores borrados. Repite los pasos en la página y luego presiona "Volver a capturar".' : 'No se pudo acceder a la página. Recárgala (F5).');
  },
  'remove-shot': () => { ui.draft.img = null; hydrateBugImage(); },
  'copy-bug': () => copy(bugText(ui.draft, !!ui.draft.img)),
  'download-shot': () => {
    if (!ui.draft.img) { toast('Este bug no tiene captura'); return; }
    downloadDataUrl(`${ui.draft.id || 'bug-nuevo'}.jpg`, ui.draft.img);
  },
  'delete-bug': async (btn) => {
    if (!confirmClick(btn)) return;
    const id = ui.draft.id;
    state.bugs = state.bugs.filter((b) => b.id !== id);
    await setImg(id, null); await save();
    ui.draft = null; render(); toast(`${id} eliminado`);
  },
  'add-duda': async () => {
    const pregunta = $('#d-pregunta').value.trim();
    if (!pregunta) { toast('Escribe la pregunta'); return; }
    state.counters.duda += 1;
    state.dudas.push({ id: `D-${pad(state.counters.duda)}`, pregunta, aQuien: $('#d-quien').value.trim(), creado: now(), respuesta: '', respondido: null, sessionId: state.activeSessionId });
    await save(); render(); toast('Duda guardada');
  },
  'delete-duda': async (btn) => {
    if (!confirmClick(btn)) return;
    state.dudas = state.dudas.filter((d) => d.id !== btn.dataset.id);
    await save(); render();
  },
  'guia': (btn) => { ui.guia = btn.dataset.to; render(); },
  'guia-reset': () => { ui.guia = null; render(); },
  'export-csv': () => {
    const list = bugsByScope($('#x-scope').value);
    if (!list.length) { toast('No hay bugs para exportar'); return; }
    download(`bugs-${fmtDay(now())}.csv`, bugsCsv(list), 'text/csv;charset=utf-8');
  },
  'export-shots': async () => {
    const list = bugsByScope($('#x-scope').value).filter((b) => b.tieneCaptura);
    if (!list.length) { toast('No hay capturas para descargar'); return; }
    for (const b of list) {
      const img = await getImg(b.id);
      if (img) { downloadDataUrl(`${b.id}.jpg`, img); await new Promise((r) => setTimeout(r, 300)); }
    }
    toast(`${list.length} captura(s) descargadas`);
  },
  'mark-reported': async (btn) => {
    const list = state.bugs.filter((b) => b.estado === 'abierto');
    if (!list.length) { toast('No hay bugs abiertos'); return; }
    if (!confirmClick(btn, `Marcar ${list.length}. Clic otra vez`)) return;
    list.forEach((b) => { b.estado = 'reportado'; b.actualizado = now(); });
    await save(); render(); toast(`${list.length} bug(s) marcados como reportados`);
  },
  'copy-activity': () => {
    const from = new Date($('#a-from').value + 'T00:00:00').getTime();
    const to = new Date($('#a-to').value + 'T23:59:59').getTime();
    if (isNaN(from) || isNaN(to) || from > to) { toast('Revisa las fechas'); return; }
    copy(activityText(from, to));
  },
  'backup': backup,
  'apply-update': () => chrome.runtime.reload(),
  'pick-restore': () => $('#restore-file').click(),
  'pdf-bug': async () => {
    const id = await saveBug();
    if (id) openReport({ type: 'bugs', ids: id });
  },
  'pdf-bugs': () => {
    const list = bugsByScope($('#x-scope').value);
    if (!list.length) { toast('No hay bugs para el PDF'); return; }
    openReport({ type: 'bugs', ids: list.map((b) => b.id).join(',') });
  },
  'pdf-session': (btn) => openReport({ type: 'sesion', id: btn.dataset.id }),
  'pdf-activity': () => {
    const from = $('#a-from').value, to = $('#a-to').value;
    if (!from || !to || from > to) { toast('Revisa las fechas'); return; }
    openReport({ type: 'actividad', from, to });
  }
};

// ---------- events ----------
document.addEventListener('click', (e) => {
  const tabBtn = e.target.closest('.tabs button');
  if (tabBtn) { ui.tab = tabBtn.dataset.tab; ui.sessionView = null; window.scrollTo(0, 0); render(); return; }
  const go = e.target.closest('[data-tab-go]');
  if (go) { ui.tab = go.dataset.tabGo; render(); return; }
  const btn = e.target.closest('[data-action]');
  if (btn && actions[btn.dataset.action]) actions[btn.dataset.action](btn);
});

let saveTimer;
const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); };

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.draft && ui.draft) {
    ui.draft[t.dataset.draft] = t.value;
    if (t.dataset.draft === 'severidad') {
      const s = SEVERIDADES.find((x) => x.id === t.value);
      $('#sev-hint').textContent = s ? s.regla : '';
    }
  } else if (t.dataset.field === 'notas' && activeSession()) {
    activeSession().notas = t.value; saveSoon();
  } else if (t.dataset.duda) {
    const d = state.dudas.find((x) => x.id === t.dataset.duda);
    d.respuesta = t.value;
    d.respondido = t.value.trim() ? (d.respondido || now()) : null;
    saveSoon();
  } else if (t.dataset.setting) {
    state.settings[t.dataset.setting] = t.value.trim(); saveSoon();
  } else if (t.id === 'gloss-q') {
    ui.glossQ = t.value;
    const pos = t.selectionStart; render();
    const input = $('#gloss-q'); input.focus(); input.setSelectionRange(pos, pos);
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'bug-filter') { ui.bugFilter = e.target.value; render(); }
  if (e.target.id === 'restore-file' && e.target.files[0]) restore(e.target.files[0]);
});

setInterval(renderSessionBar, 30000);

load().then(render).then(checkUpdates);
