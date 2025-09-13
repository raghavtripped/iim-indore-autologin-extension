function attemptLogin(username, password) {
  const usernameField = document.querySelector('input[name="username"], input#username, input[name="UserName"], input[name="user"]');
  const passwordField = document.querySelector('input[name="password"], input#password, input[name="Password"], input[name="pass"]');
  const submitButton = document.querySelector('input[type="submit"], button[type="submit"], input[value="Login"], input[value="Sign In"], button[name="login"]');

  if (usernameField && passwordField) {
    usernameField.value = username;
    passwordField.value = password;

    if (submitButton) {
      submitButton.click();
    } else {
      const form = usernameField.form || passwordField.form || document.querySelector('form');
      if (form) form.submit();
    }
  }
}

chrome.storage.sync.get(['iimi_accounts', 'iimi_default_id', 'iimi_username', 'iimi_password'], (data) => {
  // Prefer multi-account structure; fall back to legacy keys
  let username = null;
  let password = null;

  if (Array.isArray(data.iimi_accounts) && data.iimi_accounts.length > 0) {
    const byId = (data.iimi_accounts || []).reduce((map, a) => { map[a.id] = a; return map; }, {});
    const def = byId[data.iimi_default_id] || data.iimi_accounts[0];
    if (def) { username = def.username; password = def.password; }
  } else if (data.iimi_username && data.iimi_password) {
    username = data.iimi_username;
    password = data.iimi_password;
  }

  if (username && password) {
    if (document.readyState !== 'loading') {
      attemptLogin(username, password);
    } else {
      document.addEventListener('DOMContentLoaded', () => attemptLogin(username, password));
    }
  }
});
