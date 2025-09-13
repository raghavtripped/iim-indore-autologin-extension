(function() {
  let accounts = [];
  let defaultId = null;
  let editingId = null;

  const accountListEl = document.getElementById('accountList');
  const labelInput = document.getElementById('label');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const saveButton = document.getElementById('saveButton');
  const cancelEditButton = document.getElementById('cancelEdit');
  const statusDiv = document.getElementById('status');

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
        saveState().then(() => setStatus('Default updated.'));
      });

      const textWrap = document.createElement('div');
      const labelSpan = document.createElement('div');
      labelSpan.className = 'label';
      labelSpan.textContent = acc.label || acc.username;
      const userSpan = document.createElement('div');
      userSpan.className = 'muted';
      userSpan.textContent = acc.username;
      textWrap.appendChild(labelSpan);
      textWrap.appendChild(userSpan);

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
        renderList();
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
})();
