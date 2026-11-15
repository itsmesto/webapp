/* Android platform adapters. Business data stays behind the synchronous native storage bridge. */
(() => {
  'use strict';
  const pending = new Map();
  window.InvoiceyPlatform = {
    resolve(id, payload) {
      const item = pending.get(id); if (!item) return;
      pending.delete(id);
      try { const result = typeof payload === 'string' ? JSON.parse(payload) : payload; if (result.ok) item.resolve(result.value || {}); else item.reject(new Error(result.error || 'Android action failed.')); }
      catch (error) { item.reject(error); }
    }
  };
  function request(operation, args = {}) {
    return new Promise((resolve, reject) => {
      let reply;
      try { reply = JSON.parse(window.InvoiceyPlatformNative.request(operation, JSON.stringify(args))); }
      catch (error) { reject(error); return; }
      if (reply.error) { reject(new Error(reply.error)); return; }
      if (!reply.pending) { resolve(reply.value || {}); return; }
      pending.set(reply.id, { resolve, reject });
    });
  }
  async function activeCompanyId() {
    try { const response = await fetch('/api/backup/status'); return response.ok ? (await response.json()).companyId || '' : ''; }
    catch { return ''; }
  }
  window.invoiceyDesktop = {
    savePDF: options => request('savePDF', options),
    printPDF: options => request('printPDF', options),
    sharePDF: options => request('sharePDF', options),
    chooseBackupDirectory: async () => request('chooseBackupDirectory', { companyId: await activeCompanyId() }),
    saveBackup: async ({ fileName, bytes }) => {
      const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
      let binary = ''; const chunk = 0x8000;
      for (let i = 0; i < data.length; i += chunk) binary += String.fromCharCode(...data.subarray(i, i + chunk));
      return request('saveBackup', { fileName, bytes: btoa(binary) });
    },
    exportWorkspace: () => request('exportWorkspace'),
    importWorkspace: () => request('importWorkspace')
  };
})();

