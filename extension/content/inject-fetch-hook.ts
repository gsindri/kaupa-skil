(function () {
  const origFetch = window.fetch;
  window.fetch = (async (...args) => {
    const res = await origFetch(...args);
    try {
      const clone = res.clone();
      const ct = clone.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        clone
          .json()
          .then(body => {
            window.postMessage({ __KPS: true, type: 'NETWORK_JSON', body }, '*');
          })
          .catch(() => {
            /* intentionally ignored */
          });
      }
    } catch (e) {
      /* intentionally ignored */
    }
    return res;
  }) as typeof fetch;

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (...openArgs: any[]) {
    this.addEventListener('load', function () {
      try {
        const ct = this.getResponseHeader('Content-Type') || '';
        if (ct.includes('application/json')) {
          const body = this.responseType === 'json' ? this.response : JSON.parse(this.responseText);
          window.postMessage({ __KPS: true, type: 'NETWORK_JSON', body }, '*');
        }
      } catch (e) {
        /* intentionally ignored */
      }
    });
    return origOpen.apply(this, openArgs as any);
  };
})();
