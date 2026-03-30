/**
 * Popup UI Logic
 * Settings management, live preview, method selection, overrides
 */

(function () {
  'use strict';

  // ─── DOM REFS ──────────────────────────────────────────
  const currentDomainEl = document.getElementById('currentDomain');
  const livePreviewEl = document.getElementById('livePreview');
  const patternModeBtn = document.getElementById('patternModeBtn');
  const defaultModeBtn = document.getElementById('defaultModeBtn');
  const defaultPanel = document.getElementById('defaultPanel');
  const patternPanel = document.getElementById('patternPanel');
  const defaultPasswordInput = document.getElementById('defaultPasswordInput');
  const toggleVisBtn = document.getElementById('toggleVisBtn');
  const methodListEl = document.getElementById('methodList');
  const customTemplateSection = document.getElementById('customTemplateSection');
  const customTemplateInput = document.getElementById('customTemplateInput');
  const showIconToggle = document.getElementById('showIconToggle');
  const autoFillToggle = document.getElementById('autoFillToggle');
  const overridesList = document.getElementById('overridesList');
  const addOverrideBtn = document.getElementById('addOverrideBtn');
  const overrideForm = document.getElementById('overrideForm');
  const overrideDomainInput = document.getElementById('overrideDomain');
  const overrideMethodSelect = document.getElementById('overrideMethod');
  const saveOverrideBtn = document.getElementById('saveOverrideBtn');
  const saveStatus = document.getElementById('saveStatus');

  let settings = null;
  let currentDomain = 'github'; // Fallback

  // ─── LOAD SETTINGS ────────────────────────────────────
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        settings = response;
        resolve(response);
      });
    });
  }

  // ─── SAVE SETTINGS ────────────────────────────────────
  async function saveSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings }, (response) => {
        // Show save indicator
        saveStatus.classList.add('visible');
        setTimeout(() => saveStatus.classList.remove('visible'), 1500);
        resolve(response);
      });
    });
  }

  // ─── GET CURRENT TAB URL ──────────────────────────────
  async function getCurrentDomain() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_CURRENT_TAB_URL' }, (response) => {
        if (response && response.url) {
          const domain = PasswordGenerator.extractDomain(response.url);
          resolve(domain);
        } else {
          resolve('example');
        }
      });
    });
  }

  // ─── RENDER METHOD LIST ───────────────────────────────
  function renderMethods() {
    methodListEl.innerHTML = '';
    const methods = PasswordGenerator.methods;

    for (const [id, method] of Object.entries(methods)) {
      const numId = parseInt(id);
      const card = document.createElement('div');
      card.className = `method-card ${settings.method === numId ? 'active' : ''}`;
      card.dataset.method = id;

      // Generate live example with current domain
      const example = PasswordGenerator.preview(
        currentDomain,
        numId,
        numId === 6 ? settings.customTemplate : undefined
      );

      card.innerHTML = `
        <div class="method-num">${id}</div>
        <div class="method-info">
          <div class="method-name">${method.name}</div>
          <div class="method-example">${example}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        settings.method = numId;
        renderMethods();
        updateCustomTemplateVisibility();
        updatePreview();
        saveSettings();
      });

      methodListEl.appendChild(card);
    }
  }

  // ─── UPDATE CUSTOM TEMPLATE VISIBILITY ────────────────
  function updateCustomTemplateVisibility() {
    customTemplateSection.style.display = settings.method === 6 ? 'flex' : 'none';
  }

  // ─── UPDATE LIVE PREVIEW ──────────────────────────────
  function updatePreview() {
    if (settings.mode === 'default') {
      const pwd = settings.defaultPassword || '(not set)';
      livePreviewEl.textContent = pwd === '(not set)' ? pwd : '•'.repeat(pwd.length);
      livePreviewEl.title = pwd;
    } else {
      // Check for site override
      const overrideMethod = settings.siteOverrides?.[currentDomain];
      const methodToUse = overrideMethod || settings.method;
      const password = PasswordGenerator.preview(
        currentDomain,
        methodToUse,
        methodToUse === 6 ? settings.customTemplate : undefined
      );
      livePreviewEl.textContent = password;
      livePreviewEl.title = '';
    }
  }

  // ─── RENDER MODE ──────────────────────────────────────
  function renderMode() {
    if (settings.mode === 'default') {
      patternModeBtn.classList.remove('active');
      defaultModeBtn.classList.add('active');
      defaultPanel.style.display = 'flex';
      patternPanel.style.display = 'none';
    } else {
      defaultModeBtn.classList.remove('active');
      patternModeBtn.classList.add('active');
      defaultPanel.style.display = 'none';
      patternPanel.style.display = 'flex';
    }
  }

  // ─── RENDER OVERRIDES ─────────────────────────────────
  function renderOverrides() {
    overridesList.innerHTML = '';
    const overrides = settings.siteOverrides || {};

    if (Object.keys(overrides).length === 0) {
      overridesList.innerHTML = '<div class="empty-overrides">No site overrides yet</div>';
      return;
    }

    for (const [domain, methodId] of Object.entries(overrides)) {
      const method = PasswordGenerator.methods[methodId];
      const item = document.createElement('div');
      item.className = 'override-item';
      item.innerHTML = `
        <span class="override-domain">${domain}</span>
        <span class="override-method">Method ${methodId}: ${method ? method.name : 'Unknown'}</span>
        <button class="override-remove" data-domain="${domain}" title="Remove override">&times;</button>
      `;
      overridesList.appendChild(item);
    }

    // Attach remove handlers
    overridesList.querySelectorAll('.override-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        delete settings.siteOverrides[btn.dataset.domain];
        renderOverrides();
        updatePreview();
        saveSettings();
      });
    });
  }

  // ─── POPULATE OVERRIDE METHOD SELECT ──────────────────
  function populateOverrideMethodSelect() {
    overrideMethodSelect.innerHTML = '';
    for (const [id, method] of Object.entries(PasswordGenerator.methods)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `${id}. ${method.name}`;
      overrideMethodSelect.appendChild(opt);
    }
  }

  // ─── EVENT LISTENERS ──────────────────────────────────

  // Mode toggle
  patternModeBtn.addEventListener('click', () => {
    settings.mode = 'pattern';
    renderMode();
    updatePreview();
    saveSettings();
  });

  defaultModeBtn.addEventListener('click', () => {
    settings.mode = 'default';
    renderMode();
    updatePreview();
    saveSettings();
  });

  // Default password input
  defaultPasswordInput.addEventListener('input', () => {
    settings.defaultPassword = defaultPasswordInput.value;
    updatePreview();
    saveSettings();
  });

  // Toggle password visibility
  toggleVisBtn.addEventListener('click', () => {
    const isPassword = defaultPasswordInput.type === 'password';
    defaultPasswordInput.type = isPassword ? 'text' : 'password';
    toggleVisBtn.innerHTML = isPassword
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
           <line x1="1" y1="1" x2="23" y2="23"/>
         </svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
         </svg>`;
  });

  // Custom template input
  customTemplateInput.addEventListener('input', () => {
    settings.customTemplate = customTemplateInput.value;
    renderMethods(); // Update method 6 example
    updatePreview();
    saveSettings();
  });

  // Variable chips — insert into template input
  document.querySelectorAll('.var-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const varStr = chip.dataset.var;
      const input = customTemplateInput;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const before = input.value.substring(0, start);
      const after = input.value.substring(end);
      input.value = before + varStr + after;
      input.focus();
      input.setSelectionRange(start + varStr.length, start + varStr.length);

      settings.customTemplate = input.value;
      renderMethods();
      updatePreview();
      saveSettings();
    });
  });

  // Options toggles
  showIconToggle.addEventListener('change', () => {
    settings.showIcon = showIconToggle.checked;
    saveSettings();
  });

  autoFillToggle.addEventListener('change', () => {
    settings.autoFill = autoFillToggle.checked;
    saveSettings();
  });

  // Site overrides
  addOverrideBtn.addEventListener('click', () => {
    const isVisible = overrideForm.style.display !== 'none';
    overrideForm.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      overrideDomainInput.value = currentDomain;
      overrideDomainInput.focus();
    }
  });

  saveOverrideBtn.addEventListener('click', () => {
    const domain = overrideDomainInput.value.trim().toLowerCase();
    const method = parseInt(overrideMethodSelect.value);

    if (domain) {
      if (!settings.siteOverrides) settings.siteOverrides = {};
      settings.siteOverrides[domain] = method;
      renderOverrides();
      updatePreview();
      saveSettings();
      overrideForm.style.display = 'none';
      overrideDomainInput.value = '';
    }
  });

  // ─── INIT ─────────────────────────────────────────────
  async function init() {
    await loadSettings();
    currentDomain = await getCurrentDomain();

    // Update domain display
    currentDomainEl.textContent = PasswordGenerator.capitalize(currentDomain);

    // Populate UI from settings
    defaultPasswordInput.value = settings.defaultPassword || '';
    customTemplateInput.value = settings.customTemplate || '*{Domain}{year}#';
    showIconToggle.checked = settings.showIcon !== false;
    autoFillToggle.checked = settings.autoFill || false;

    renderMode();
    renderMethods();
    updateCustomTemplateVisibility();
    updatePreview();
    populateOverrideMethodSelect();
    renderOverrides();
  }

  init();

})();
