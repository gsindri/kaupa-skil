const out = document.getElementById('out');
const logsEl = document.getElementById('logs');

function log(...args) {
  out.textContent += args.join(' ') + '\n';
}

document.getElementById('ping').addEventListener('click', async () => {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'PING' });
    log('PING', JSON.stringify(res));
    updateStatus(res);
  } catch (e) {
    log('PING error', e);
  }
});

const originInput = document.getElementById('origin');
document.getElementById('perm').addEventListener('click', async () => {
  const origin = originInput.value;
  const res = await chrome.runtime.sendMessage({ type: 'REQUEST_ORIGIN_PERMISSION', origin });
  log('PERM', JSON.stringify(res));
});

document.getElementById('sync').addEventListener('click', async () => {
  const res = await chrome.runtime.sendMessage({ type: 'SYNC_PRICE' });
  log('SYNC', JSON.stringify(res));
});

function updateStatus(res) {
  const el = document.getElementById('status') || document.createElement('div');
  el.id = 'status';
  el.textContent = res && res.ok ? `SW ${res.version}` : 'SW inactive';
  document.body.prepend(el);
}

async function refreshLogs() {
  const all = await chrome.storage.local.get(null);
  const recents = Object.keys(all).filter(k => k.startsWith('recent:'));
  logsEl.textContent = recents.map(k => `${k}: ${JSON.stringify(all[k])}`).join('\n');
}
setInterval(refreshLogs, 1000);

chrome.runtime.sendMessage({ type: 'PING' }).then(updateStatus).catch(() => updateStatus(null));
