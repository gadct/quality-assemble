// Runs inside the page (MAIN world) to see console errors and failed requests.
// Sends each event to capture-bridge.js via window.postMessage. Never modifies page behavior.
(() => {
  if (window.__qaCaptureInstalled) return;
  window.__qaCaptureInstalled = true;

  const send = (entry) => {
    try {
      window.postMessage({ __qaCapture: true, entry: { ...entry, time: Date.now() } }, '*');
    } catch (_) { /* ignore */ }
  };

  const toText = (v) => {
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    if (typeof v === 'string') return v;
    try { return JSON.stringify(v); } catch (_) { return String(v); }
  };

  const origError = console.error;
  console.error = function (...args) {
    send({ kind: 'consola', text: args.map(toText).join(' ').slice(0, 500) });
    return origError.apply(this, args);
  };

  window.addEventListener('error', (e) => {
    if (e.target && e.target !== window && (e.target.src || e.target.href)) {
      send({ kind: 'recurso', text: `No cargó: ${e.target.src || e.target.href}` });
    } else {
      send({ kind: 'js', text: `${e.message || 'Error'} (${e.filename || ''}:${e.lineno || ''})` });
    }
  }, true);

  window.addEventListener('unhandledrejection', (e) => {
    send({ kind: 'js', text: `Promesa sin manejar: ${toText(e.reason)}`.slice(0, 500) });
  });

  const origFetch = window.fetch;
  if (origFetch) {
    window.fetch = async function (input, init) {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      const method = (init && init.method) || (input && input.method) || 'GET';
      try {
        const res = await origFetch.apply(this, arguments);
        if (res.status >= 400) send({ kind: 'red', text: `${method} ${url} -> ${res.status}`, status: res.status });
        return res;
      } catch (err) {
        send({ kind: 'red', text: `${method} ${url} -> sin respuesta (${toText(err)})`, status: 0 });
        throw err;
      }
    };
  }

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    this.__qa = { method, url: String(url) };
    return origOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener('loadend', () => {
      const info = this.__qa || {};
      if (this.status === 0 || this.status >= 400) {
        send({
          kind: 'red',
          text: `${info.method || ''} ${info.url || ''} -> ${this.status || 'sin respuesta'}`,
          status: this.status
        });
      }
    });
    return origSend.apply(this, arguments);
  };
})();
