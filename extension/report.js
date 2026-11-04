// Printable report page. Opened by the side panel with ?type=bugs&ids=... | ?type=sesion&id=... | ?type=actividad&from=...&to=...
// The PDF comes from Chrome's own "Save as PDF" print destination: no libraries needed.

const params = new URLSearchParams(location.search);

function kv(rows) {
  return `<table class="kv">${rows.filter(([, v]) => v !== null && v !== undefined).map(([k, v]) => `<tr><th>${esc(k)}</th><td class="pre">${esc(v || '-')}</td></tr>`).join('')}</table>`;
}

function header(title, metaLines) {
  return `<header class="doc"><h1>${esc(title)}</h1>${metaLines.filter(Boolean).map((l) => `<div class="meta">${esc(l)}</div>`).join('')}</header>`;
}

function footer() {
  return `<footer class="doc">Generado con Quality Assemble el ${esc(fmtDate(now()))}${state.settings.nombre ? ' por ' + esc(state.settings.nombre) : ''}.</footer>`;
}

async function bugBlock(b) {
  const img = b.tieneCaptura ? await getImg(b.id) : null;
  return `<section class="bug">
    <div class="bug-head">
      <h2>${esc(b.id)} · ${esc(b.titulo)}</h2>
      ${kv([
        ['Reportado por', b.reportadoPor],
        ['Fecha', fmtDate(b.creado)],
        ['Severidad', sevName(b.severidad)],
        ['Estado', estadoName(b.estado)],
        ['Proyecto / módulo', `${b.proyecto || '-'} / ${b.modulo || '-'}`],
        ['Ambiente', b.ambiente],
        ['URL', b.url],
        ['Navegador', b.navegador],
        ['Pantalla', b.viewport],
        ['Usuario de prueba', b.usuario || null]
      ])}
    </div>
    <h3>Pasos para reproducir</h3><p class="pre">${esc(numberedSteps(b.pasos) || '-')}</p>
    <h3>Resultado esperado</h3><p class="pre">${esc(b.esperado || '-')}</p>
    <h3>Resultado actual</h3><p class="pre">${esc(b.actual || '-')}</p>
    ${b.logs && b.logs.length ? `<h3>Errores técnicos capturados</h3><div class="logs">${esc(logsText(b.logs))}</div>` : ''}
    ${img ? `<h3>Evidencia</h3><img class="shot" src="${img}" alt="Captura de pantalla de ${esc(b.id)}">` : ''}
  </section>`;
}

function bugTable(bugs) {
  if (!bugs.length) return '<p>No se registraron bugs.</p>';
  return `<table class="list"><thead><tr><th>ID</th><th>Título</th><th>Severidad</th><th>Estado</th><th>Reportado por</th></tr></thead><tbody>
    ${bugs.map((b) => `<tr><td>${esc(b.id)}</td><td>${esc(b.titulo)}</td><td>${esc(sevName(b.severidad))}</td><td>${esc(estadoName(b.estado))}</td><td>${esc(b.reportadoPor || '-')}</td></tr>`).join('')}
  </tbody></table>`;
}

async function reportBugs() {
  const ids = (params.get('ids') || '').split(',').filter(Boolean);
  const bugs = ids.map(bugById).filter(Boolean);
  const reporters = [...new Set(bugs.map((b) => b.reportadoPor).filter(Boolean))];
  const title = bugs.length === 1 ? `Reporte de bug ${bugs[0].id}` : `Reporte de bugs (${bugs.length})`;
  document.title = bugs.length === 1 ? `${bugs[0].id} - ${bugs[0].titulo}` : `Bugs ${fmtDay(now())}`;
  const blocks = [];
  for (const b of bugs) blocks.push(await bugBlock(b));
  return header(title, [
    reporters.length ? `Reportado por: ${reporters.join(', ')}` : null,
    `Generado: ${fmtDate(now())}`
  ]) + (bugs.length > 1 ? `<h2>Resumen</h2>${bugTable(bugs)}<div style="break-after:page"></div>` : '') + blocks.join('');
}

async function reportSesion() {
  const s = sessionById(params.get('id'));
  if (!s) return '<p>No se encontró la sesión.</p>';
  const st = sessionStats(s);
  const checks = state.checks[s.id] || {};
  document.title = `Sesion ${s.id} - ${s.objetivo || ''}`;
  const lists = CHECKLISTS.map((c) => {
    const items = c.items.filter((i) => checks[i.id]);
    if (!items.length) return '';
    const label = { pasa: 'Funciona', falla: 'Falla', na: 'No aplica' };
    return `<h3>${esc(c.nombre)} (${items.length}/${c.items.length})</h3>
      <table class="list"><tbody>${items.map((i) => `<tr><td>${esc(i.que)}</td><td>${label[checks[i.id]]}</td></tr>`).join('')}</tbody></table>`;
  }).join('');
  const blocks = [];
  for (const b of st.bugs) blocks.push(await bugBlock(b));
  return header(`Resumen de sesión ${s.id}`, [
    `Realizada por: ${s.qa || state.settings.nombre || '-'}`,
    `${fmtDate(s.inicio)} a ${s.fin ? fmtDate(s.fin) : 'en curso'} · ${duration(st.tiempo)}`
  ]) + kv([
    ['Objetivo', s.objetivo],
    ['Proyecto / módulo', `${s.proyecto || '-'} / ${s.modulo || '-'}`],
    ['Ambiente', s.ambiente],
    ['Puntos revisados', `${st.pasa + st.falla + st.na} (funciona ${st.pasa}, falla ${st.falla}, no aplica ${st.na})`],
    ['Bugs', String(st.bugs.length)],
    ['Dudas', String(st.dudas.length)]
  ]) + (lists ? `<h2>Lo que se revisó</h2>${lists}` : '')
    + (st.dudas.length ? `<h2>Dudas</h2><table class="list"><thead><tr><th>Pregunta</th><th>A quién</th><th>Respuesta</th></tr></thead><tbody>${st.dudas.map((d) => `<tr><td>${esc(d.pregunta)}</td><td>${esc(d.aQuien || '-')}</td><td>${esc(d.respuesta || 'Sin respuesta')}</td></tr>`).join('')}</tbody></table>` : '')
    + (s.notas ? `<h2>Notas</h2><p class="pre">${esc(s.notas)}</p>` : '')
    + `<h2>Bugs</h2>${bugTable(st.bugs)}`
    + (blocks.length ? `<div style="break-after:page"></div>${blocks.join('')}` : '');
}

function reportActividad() {
  const from = new Date(params.get('from') + 'T00:00:00').getTime();
  const to = new Date(params.get('to') + 'T23:59:59').getTime();
  const inRange = (t) => t >= from && t <= to;
  const sessions = state.sessions.filter((s) => inRange(s.inicio));
  const bugs = state.bugs.filter((b) => inRange(b.creado));
  const dudas = state.dudas.filter((d) => inRange(d.creado));
  const total = sessions.reduce((a, s) => a + ((s.fin || now()) - s.inicio), 0);
  let pasa = 0, falla = 0, na = 0;
  sessions.forEach((s) => { const st = sessionStats(s); pasa += st.pasa; falla += st.falla; na += st.na; });
  document.title = `Actividad QA ${params.get('from')} a ${params.get('to')}`;
  return header('Resumen de actividad QA', [
    `Realizado por: ${state.settings.nombre || '-'}`,
    `Periodo: ${params.get('from')} al ${params.get('to')}`
  ]) + kv([
    ['Sesiones de prueba', `${sessions.length} (tiempo total ${duration(total)})`],
    ['Puntos de checklist revisados', `${pasa + falla + na} (funciona ${pasa}, falla ${falla}, no aplica ${na})`],
    ['Bugs reportados', `${bugs.length} (${SEVERIDADES.map((sv) => `${sv.nombre}: ${bugs.filter((b) => b.severidad === sv.id).length}`).join(', ')})`],
    ['Dudas registradas', `${dudas.length} (sin respuesta: ${dudas.filter((d) => !d.respuesta).length})`]
  ]) + `<h2>Sesiones</h2>${sessions.length ? `<table class="list"><thead><tr><th>Fecha</th><th>Proyecto / módulo</th><th>Objetivo</th><th>Duración</th></tr></thead><tbody>
      ${sessions.map((s) => `<tr><td>${esc(fmtDate(s.inicio))}</td><td>${esc(s.proyecto || '-')} / ${esc(s.modulo || '-')}</td><td>${esc(s.objetivo || '-')}</td><td>${duration((s.fin || now()) - s.inicio)}</td></tr>`).join('')}
    </tbody></table>` : '<p>No hubo sesiones en este periodo.</p>'}`
    + `<h2>Bugs</h2>${bugTable(bugs)}`
    + (dudas.length ? `<h2>Dudas</h2><table class="list"><thead><tr><th>Pregunta</th><th>A quién</th><th>Respuesta</th></tr></thead><tbody>${dudas.map((d) => `<tr><td>${esc(d.pregunta)}</td><td>${esc(d.aQuien || '-')}</td><td>${esc(d.respuesta || 'Sin respuesta')}</td></tr>`).join('')}</tbody></table>` : '');
}

async function main() {
  await load();
  const type = params.get('type');
  const html = type === 'bugs' ? await reportBugs() : type === 'sesion' ? await reportSesion() : type === 'actividad' ? reportActividad() : '<p>Tipo de reporte desconocido.</p>';
  document.getElementById('report').innerHTML = html + footer();
  await Promise.all([...document.images].map((img) => img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
  setTimeout(() => window.print(), 300);
}

document.getElementById('print').addEventListener('click', () => window.print());
main();
