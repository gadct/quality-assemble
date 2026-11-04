// Shared by the side panel and the PDF report page: state shape, formatting and text builders.

const KEY = 'qa';
// GitHub repo whose Releases distribute updates (see instalador/actualizar.ps1).
const UPDATE_REPO = 'gadct/quality-assemble';

let state = {
  sessions: [],
  bugs: [],
  dudas: [],
  checks: {},            // { [sessionId]: { [itemId]: 'pasa' | 'falla' | 'na' } }
  activeSessionId: null,
  lastBackup: null,
  counters: { bug: 0, duda: 0, session: 0 },
  settings: { nombre: '' }  // name of the person doing QA, shown as 'Reportado por'
};

const ESTADOS_BUG = [
  { id: 'abierto', nombre: 'Abierto (sin reportar)' },
  { id: 'reportado', nombre: 'Reportado' },
  { id: 'corregido', nombre: 'Corregido, falta retest' },
  { id: 'cerrado', nombre: 'Cerrado (verificado)' },
  { id: 'rechazado', nombre: 'Rechazado / no es bug' }
];

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const now = () => Date.now();
const fmtDate = (t) => t ? new Date(t).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' }) : '';
const fmtDay = (t) => new Date(t).toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(3, '0');
const sessionById = (id) => state.sessions.find((s) => s.id === id);
const bugById = (id) => state.bugs.find((b) => b.id === id);
const sevName = (id) => (SEVERIDADES.find((s) => s.id === id) || {}).nombre || '';
const estadoName = (id) => (ESTADOS_BUG.find((e) => e.id === id) || {}).nombre || id;
function duration(ms) {
  const m = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  return h ? `${h} h ${m % 60} min` : `${m} min`;
}

function browserName() {
  const ua = navigator.userAgent;
  const edge = ua.match(/Edg\/([\d.]+)/);
  const chrome = ua.match(/Chrome\/([\d.]+)/);
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  const name = edge ? `Edge ${edge[1].split('.')[0]}` : chrome ? `Chrome ${chrome[1].split('.')[0]}` : 'Navegador desconocido';
  return os ? `${name} en ${os}` : name;
}

async function save() { await chrome.storage.local.set({ [KEY]: state }); }
async function load() {
  const data = await chrome.storage.local.get(KEY);
  if (data[KEY]) state = { ...state, ...data[KEY], counters: { ...state.counters, ...(data[KEY].counters || {}) }, settings: { ...state.settings, ...(data[KEY].settings || {}) } };
}
async function getImg(bugId) { const d = await chrome.storage.local.get('img:' + bugId); return d['img:' + bugId] || null; }

// ---------- text builders ----------
function numberedSteps(text) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((l, i) => (/^\d+[.)-]/.test(l) ? l : `${i + 1}. ${l}`)).join('\n');
}

function logsText(logs) {
  return (logs || []).map((l) => `- [${l.kind}] ${l.text}`).join('\n');
}

function bugText(b, hasImg) {
  const lines = [
    `[${b.id}] ${b.titulo}`,
    `Severidad: ${sevName(b.severidad)} | Estado: ${estadoName(b.estado)}`,
    `Proyecto: ${b.proyecto || '-'} | Módulo: ${b.modulo || '-'} | Ambiente: ${b.ambiente || '-'}`,
    `Reportado por: ${b.reportadoPor || '-'} | Fecha: ${fmtDate(b.creado)}`,
    `URL: ${b.url || '-'}`,
    `Navegador: ${b.navegador || '-'} | Pantalla: ${b.viewport || '-'}`,
    b.usuario ? `Usuario de prueba: ${b.usuario}` : null,
    '',
    'Pasos para reproducir:',
    numberedSteps(b.pasos) || '-',
    '',
    'Resultado esperado:',
    b.esperado || '-',
    '',
    'Resultado actual:',
    b.actual || '-'
  ];
  if (b.logs && b.logs.length) lines.push('', 'Errores técnicos capturados:', logsText(b.logs));
  if (hasImg) lines.push('', `Evidencia: captura ${b.id}.jpg`);
  return lines.filter((l) => l !== null).join('\n');
}

function csvCell(v) { return `"${String(v ?? '').replace(/"/g, '""')}"`; }

function bugsCsv(bugs) {
  const head = ['ID', 'Fecha', 'Proyecto', 'Módulo', 'Ambiente', 'Título', 'Reportado por', 'Severidad', 'Estado', 'Pasos para reproducir', 'Resultado esperado', 'Resultado actual', 'URL', 'Navegador', 'Pantalla', 'Usuario de prueba', 'Errores técnicos', 'Captura'];
  const rows = bugs.map((b) => [
    b.id, fmtDate(b.creado), b.proyecto, b.modulo, b.ambiente, b.titulo, b.reportadoPor, sevName(b.severidad), estadoName(b.estado),
    numberedSteps(b.pasos), b.esperado, b.actual, b.url, b.navegador, b.viewport, b.usuario, logsText(b.logs), b.tieneCaptura ? `${b.id}.jpg` : ''
  ]);
  // BOM + semicolon: Excel in Spanish opens it with tildes and columns intact.
  return '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(';')).join('\r\n');
}

function sessionStats(s) {
  const checks = state.checks[s.id] || {};
  const vals = Object.values(checks);
  return {
    pasa: vals.filter((v) => v === 'pasa').length,
    falla: vals.filter((v) => v === 'falla').length,
    na: vals.filter((v) => v === 'na').length,
    bugs: state.bugs.filter((b) => b.sessionId === s.id),
    dudas: state.dudas.filter((d) => d.sessionId === s.id),
    tiempo: (s.fin || now()) - s.inicio
  };
}

function sessionSummaryText(s) {
  const st = sessionStats(s);
  const checks = state.checks[s.id] || {};
  const lists = CHECKLISTS.map((c) => {
    const done = c.items.filter((i) => checks[i.id]).length;
    return done ? `- ${c.nombre}: ${done}/${c.items.length} puntos revisados` : null;
  }).filter(Boolean);
  return [
    `Sesión de pruebas ${s.id}`,
    `Realizada por: ${s.qa || state.settings.nombre || '-'}`,
    `Proyecto: ${s.proyecto || '-'} | Módulo: ${s.modulo || '-'} | Ambiente: ${s.ambiente || '-'}`,
    `Objetivo: ${s.objetivo || '-'}`,
    `Inicio: ${fmtDate(s.inicio)} | Fin: ${s.fin ? fmtDate(s.fin) : 'en curso'} | Duración: ${duration(st.tiempo)}`,
    '',
    `Puntos revisados: ${st.pasa + st.falla + st.na} (correctos ${st.pasa}, con falla ${st.falla}, no aplica ${st.na})`,
    ...lists,
    '',
    `Bugs encontrados: ${st.bugs.length}`,
    ...st.bugs.map((b) => `- ${b.id} [${sevName(b.severidad)}] ${b.titulo}`),
    '',
    `Dudas registradas: ${st.dudas.length}`,
    ...st.dudas.map((d) => `- ${d.pregunta}${d.respuesta ? ' -> ' + d.respuesta : ' (sin respuesta)'}`),
    s.notas ? '\nNotas:\n' + s.notas : ''
  ].join('\n').trim();
}

function activityText(from, to) {
  const inRange = (t) => t >= from && t <= to;
  const sessions = state.sessions.filter((s) => inRange(s.inicio));
  const bugs = state.bugs.filter((b) => inRange(b.creado));
  const dudas = state.dudas.filter((d) => inRange(d.creado));
  const total = sessions.reduce((a, s) => a + ((s.fin || now()) - s.inicio), 0);
  let pasa = 0, falla = 0, na = 0;
  sessions.forEach((s) => { const st = sessionStats(s); pasa += st.pasa; falla += st.falla; na += st.na; });
  const bySev = SEVERIDADES.map((sv) => `${sv.nombre}: ${bugs.filter((b) => b.severidad === sv.id).length}`).join(', ');
  return [
    `Resumen de actividad QA del ${fmtDay(from)} al ${fmtDay(to)}`,
    `Realizado por: ${state.settings.nombre || '-'}`,
    '',
    `Sesiones de prueba: ${sessions.length} (tiempo total ${duration(total)})`,
    `Puntos de checklist revisados: ${pasa + falla + na} (correctos ${pasa}, con falla ${falla}, no aplica ${na})`,
    `Bugs reportados: ${bugs.length} (${bySev})`,
    `Dudas registradas: ${dudas.length} (sin respuesta: ${dudas.filter((d) => !d.respuesta).length})`,
    '',
    'Detalle de sesiones:',
    ...sessions.map((s) => `- ${fmtDate(s.inicio)} | ${s.proyecto || '-'} / ${s.modulo || '-'} | ${s.objetivo || '-'} | ${duration((s.fin || now()) - s.inicio)}`),
    '',
    'Bugs:',
    ...bugs.map((b) => `- ${b.id} [${sevName(b.severidad)}] ${b.titulo} (${estadoName(b.estado)})`)
  ].join('\n');
}
