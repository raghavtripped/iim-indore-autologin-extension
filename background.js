(function() {
  function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function normalizeHeaders(headers) {
    const out = {};
    (headers || []).forEach(h => {
      if (h && h.name) out[h.name.toLowerCase()] = h.value || '';
    });
    return out;
  }

  function ensureUsageState(callback) {
    chrome.storage.local.get(['iimi_usage'], (data) => {
      const today = getTodayKey();
      let usage = data.iimi_usage;
      if (!usage || usage.dayKey !== today) {
        usage = { dayKey: today, perAccountBytes: {} };
        chrome.storage.local.set({ iimi_usage: usage }, () => callback(usage));
        return;
      }
      callback(usage);
    });
  }

  function scheduleMidnightReset() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const delayMs = midnight.getTime() - now.getTime();
    chrome.alarms.create('iimiDailyReset', { when: Date.now() + delayMs, periodInMinutes: 24 * 60 });
  }

  function syncActiveFromDefault() {
    try {
      chrome.storage.sync.get(['iimi_accounts', 'iimi_default_id'], (data) => {
        const list = Array.isArray(data.iimi_accounts) ? data.iimi_accounts : [];
        if (!list.length) return;
        const id = data.iimi_default_id || (list[0] && list[0].id) || null;
        if (id) chrome.storage.local.set({ iimi_active_id: id });
      });
    } catch (e) {}
  }

  function requestAllHostPermissionsIfNeeded() {
    try {
      if (chrome.permissions && chrome.permissions.request) {
        chrome.permissions.request({ origins: ['<all_urls>'] }, function(granted) {
          // best-effort; ignore result
        });
      }
    } catch (e) {
      // ignore
    }
  }

  function incrementUsageForActiveAccount(bytes) {
    if (!bytes || bytes <= 0) return;
    chrome.storage.local.get(['iimi_active_id', 'iimi_usage'], (data) => {
      const activeId = data.iimi_active_id;
      if (!activeId) return;
      const today = getTodayKey();
      let usage = data.iimi_usage;
      if (!usage || usage.dayKey !== today) {
        usage = { dayKey: today, perAccountBytes: {} };
      }
      const current = usage.perAccountBytes[activeId] || 0;
      usage.perAccountBytes[activeId] = current + bytes;
      chrome.storage.local.set({ iimi_usage: usage });
    });
  }

  chrome.runtime.onInstalled.addListener(() => {
    scheduleMidnightReset();
    ensureUsageState(function(){})
    requestAllHostPermissionsIfNeeded();
    syncActiveFromDefault();
  });

  chrome.runtime.onStartup.addListener(() => {
    scheduleMidnightReset();
    ensureUsageState(function(){})
    syncActiveFromDefault();
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm && alarm.name === 'iimiDailyReset') {
      const today = getTodayKey();
      chrome.storage.local.set({ iimi_usage: { dayKey: today, perAccountBytes: {} } });
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'iimiActiveAccount') {
      const accountId = msg.accountId || null;
      chrome.storage.local.set({ iimi_active_id: accountId }, () => {
        sendResponse({ ok: true });
      });
      return true; // async
    }
  });

  try {
    chrome.webRequest.onCompleted.addListener(function(details) {
      if (details && details.fromCache) return;
      const headers = normalizeHeaders(details.responseHeaders);
      const lenStr = headers['content-length'];
      if (!lenStr) return;
      const bytes = parseInt(lenStr, 10);
      if (!isFinite(bytes) || bytes <= 0) return;
      incrementUsageForActiveAccount(bytes);
    }, { urls: ['<all_urls>'] }, ['responseHeaders']);
  } catch (e) {
    // ignore
  }

  try {
    chrome.webRequest.onBeforeRequest.addListener(function(details) {
      if (!details || !details.requestBody) return;
      let bytes = 0;
      const body = details.requestBody;
      if (body.raw && Array.isArray(body.raw)) {
        for (let i = 0; i < body.raw.length; i++) {
          const part = body.raw[i];
          if (part && part.bytes && part.bytes.byteLength) {
            bytes += part.bytes.byteLength;
          }
        }
      }
      if (bytes > 0) incrementUsageForActiveAccount(bytes);
    }, { urls: ['<all_urls>'] }, ['requestBody']);
  } catch (e) {
    // ignore
  }
})();


