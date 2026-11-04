// Isolated content script: keeps the last events from capture-main.js and hands them to the side panel.
(() => {
  const MAX = 100;
  let logs = [];

  window.addEventListener('message', (e) => {
    if (e.source !== window || !e.data || !e.data.__qaCapture) return;
    logs.push(e.data.entry);
    if (logs.length > MAX) logs = logs.slice(-MAX);
  });

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg.type === 'qa-get-context') {
      reply({
        logs,
        url: location.href,
        title: document.title,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screen: `${screen.width}x${screen.height}`,
        zoom: Math.round(window.devicePixelRatio * 100)
      });
    } else if (msg.type === 'qa-clear-logs') {
      logs = [];
      reply({ ok: true });
    }
  });
})();
