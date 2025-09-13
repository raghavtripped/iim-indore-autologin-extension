(function() {
  let accounts = [];
  let defaultId = null;
  let editingId = null;
  let usage = { dayKey: null, perAccountBytes: {} };

  const accountListEl = document.getElementById('accountList');
  const labelInput = document.getElementById('label');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const saveButton = document.getElementById('saveButton');
  const cancelEditButton = document.getElementById('cancelEdit');
  const statusDiv = document.getElementById('status');
  const enableTrackingBtn = document.getElementById('enableTracking');
  const enableSiteTrackingBtn = document.getElementById('enableSiteTracking');

  function generateId() {
    return 'acc_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
  }

  function setStatus(message, ok = true) {
    statusDiv.style.color = ok ? 'green' : 'red';
    statusDiv.textContent = message;
    if (message) setTimeout(() => { statusDiv.textContent = ''; }, 2000);
  }

  function saveState() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ iimi_accounts: accounts, iimi_default_id: defaultId }, resolve);
    });
  }

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B','KB','MB','GB','TB'];
    let i = 0; let n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2) + ' ' + units[i];
  }

  function renderList() {
    accountListEl.innerHTML = '';

    if (!accounts || accounts.length === 0) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.textContent = 'No saved accounts yet.';
      accountListEl.appendChild(li);
      return;
    }

    accounts.forEach((acc) => {
      const li = document.createElement('li');

      const left = document.createElement('div');
      left.className = 'left';

      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'defaultAccount';
      radio.value = acc.id;
      radio.checked = acc.id === defaultId;
      radio.addEventListener('change', () => {
        defaultId = acc.id;
        saveState().then(() => {
          try { chrome.runtime.sendMessage({ type: 'iimiActiveAccount', accountId: defaultId }); } catch (e) {}
          setStatus('Default updated.');
        });
      });

      const textWrap = document.createElement('div');
      const labelSpan = document.createElement('div');
      labelSpan.className = 'label';
      labelSpan.textContent = acc.label || acc.username;
      const userSpan = document.createElement('div');
      userSpan.className = 'muted';
      userSpan.textContent = acc.username;
      const usageSpan = document.createElement('div');
      usageSpan.className = 'muted';
      const bytes = usage.perAccountBytes[acc.id] || 0;
      usageSpan.textContent = 'Today: ' + formatBytes(bytes);
      textWrap.appendChild(labelSpan);
      textWrap.appendChild(userSpan);
      textWrap.appendChild(usageSpan);

      left.appendChild(radio);
      left.appendChild(textWrap);

      const actions = document.createElement('div');
      actions.className = 'actions';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'btn-secondary';
      editBtn.addEventListener('click', () => beginEdit(acc.id));

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.className = 'btn-secondary';
      delBtn.addEventListener('click', () => deleteAccount(acc.id));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(left);
      li.appendChild(actions);
      accountListEl.appendChild(li);
    });
  }

  function resetForm() {
    editingId = null;
    labelInput.value = '';
    usernameInput.value = '';
    passwordInput.value = '';
    saveButton.textContent = 'Save Credential';
    cancelEditButton.style.display = 'none';
  }

  function beginEdit(id) {
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;
    editingId = id;
    labelInput.value = acc.label || '';
    usernameInput.value = acc.username || '';
    passwordInput.value = acc.password || '';
    saveButton.textContent = 'Update Credential';
    cancelEditButton.style.display = 'inline-block';
  }

  function deleteAccount(id) {
    accounts = accounts.filter(a => a.id !== id);
    if (defaultId === id) {
      defaultId = accounts.length ? accounts[0].id : null;
    }
    saveState().then(() => {
      renderList();
      setStatus('Account deleted.');
      if (editingId === id) resetForm();
    });
  }

  function upsertAccount() {
    const label = labelInput.value.trim();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      setStatus('Username and password required.', false);
      return;
    }

    if (editingId) {
      const idx = accounts.findIndex(a => a.id === editingId);
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], label, username, password };
      }
    } else {
      const id = generateId();
      accounts.push({ id, label, username, password });
      if (!defaultId) defaultId = id; // first account becomes default
    }

    saveState().then(() => {
      renderList();
      resetForm();
      setStatus('Saved.');
    });
  }

  function migrateIfNeeded(data) {
    const hasMulti = Array.isArray(data.iimi_accounts);
    const hasSingle = data.iimi_username && data.iimi_password;

    if (!hasMulti && hasSingle) {
      const id = generateId();
      accounts = [{ id, label: 'Default', username: data.iimi_username, password: data.iimi_password }];
      defaultId = id;
      chrome.storage.sync.remove(['iimi_username', 'iimi_password']);
      return saveState();
    }
    return Promise.resolve();
  }

  function loadState() {
    chrome.storage.sync.get(['iimi_accounts', 'iimi_default_id', 'iimi_username', 'iimi_password'], (data) => {
      accounts = Array.isArray(data.iimi_accounts) ? data.iimi_accounts : [];
      defaultId = data.iimi_default_id || (accounts[0] && accounts[0].id) || null;

      migrateIfNeeded(data).then(() => {
        chrome.storage.local.get(['iimi_usage', 'iimi_active_id'], (localData) => {
          usage = localData.iimi_usage || { dayKey: null, perAccountBytes: {} };
          if (localData.iimi_active_id && !defaultId) {
            defaultId = localData.iimi_active_id;
          }
          renderList();
          // Check whether we have <all_urls> permission; if not, show enable button
          try {
            chrome.permissions.contains({ origins: ['<all_urls>'] }, (granted) => {
              if (enableTrackingBtn) enableTrackingBtn.style.display = granted ? 'none' : 'block';
              if (enableSiteTrackingBtn) enableSiteTrackingBtn.style.display = granted ? 'none' : 'block';
            });
          } catch (e) {}
        });
      });
    });
  }

  saveButton.addEventListener('click', upsertAccount);
  cancelEditButton.addEventListener('click', () => { resetForm(); });

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    loadState();
  } else {
    document.addEventListener('DOMContentLoaded', loadState);
  }

  try {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.iimi_usage) {
        usage = changes.iimi_usage.newValue || { dayKey: null, perAccountBytes: {} };
        renderList();
      }
    });
  } catch (e) {}

  if (enableTrackingBtn) {
    enableTrackingBtn.addEventListener('click', () => {
      try {
        chrome.permissions.request({ origins: ['<all_urls>'] }, (granted) => {
          if (granted) {
            enableTrackingBtn.style.display = 'none';
            if (enableSiteTrackingBtn) enableSiteTrackingBtn.style.display = 'none';
            setStatus('Tracking enabled.');
          } else {
            setStatus('Tracking permission denied.', false);
          }
        });
      } catch (e) {
        setStatus('Unable to request permission.', false);
      }
    });
  }

  if (enableSiteTrackingBtn) {
    enableSiteTrackingBtn.addEventListener('click', () => {
      try {
        chrome.permissions.request({ permissions: ['tabs'] }, (tabsGranted) => {
          if (!tabsGranted) {
            setStatus('Tabs permission denied.', false);
            return;
          }
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs && tabs[0];
            if (!tab || !tab.url) {
              setStatus('No active site found.', false);
              return;
            }
            let origin;
            try {
              const u = new URL(tab.url);
              origin = u.origin + '/*';
            } catch (e) {
              setStatus('Unsupported URL.', false);
              return;
            }
            chrome.permissions.request({ origins: [origin] }, (granted) => {
              if (granted) {
                setStatus('Tracking enabled for this site.');
                enableSiteTrackingBtn.style.display = 'none';
              } else {
                setStatus('Site permission denied.', false);
              }
            });
          });
        });
      } catch (e) {
        setStatus('Unable to request site permission.', false);
      }
    });
  }
})();
