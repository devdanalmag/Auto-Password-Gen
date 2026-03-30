/**
 * Content Script — Password Field Detection & Auto-Fill
 * Injected into every page to find password inputs and add fill functionality
 */

(function() {
  'use strict';

  let currentSettings = null;
  const processedFields = new WeakSet();
  const ICON_SIZE = 28;

  /**
   * Load settings from background
   */
  async function loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        currentSettings = response;
        resolve(response);
      });
    });
  }

  /**
   * Create the floating key icon button
   */
  function createKeyIcon(passwordField) {
    const wrapper = document.createElement('div');
    wrapper.className = 'spg-icon-wrapper';

    const btn = document.createElement('button');
    btn.className = 'spg-fill-btn';
    btn.title = 'Generate & Fill Password';
    btn.type = 'button';
    btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
      </svg>
    `;

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'spg-copy-btn';
    copyBtn.title = 'Copy Password';
    copyBtn.type = 'button';
    copyBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
      </svg>
    `;

    // Toast notification
    const toast = document.createElement('div');
    toast.className = 'spg-toast';
    toast.textContent = 'Password filled!';

    wrapper.appendChild(btn);
    wrapper.appendChild(copyBtn);
    wrapper.appendChild(toast);

    // Position the wrapper
    positionWrapper(wrapper, passwordField);

    // Fill button click
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      await loadSettings();
      const password = PasswordGenerator.generate(window.location.href, currentSettings);

      if (password) {
        // Set value using native input setter to trigger React/Vue/Angular change detection
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(passwordField, password);

        // Dispatch events to trigger framework handlers
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('change', { bubbles: true }));

        // Show toast
        showToast(toast, 'Password filled!');
      }
    });

    // Copy button click
    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      await loadSettings();
      const password = PasswordGenerator.generate(window.location.href, currentSettings);

      if (password) {
        navigator.clipboard.writeText(password).then(() => {
          showToast(toast, 'Copied!');
        });
      }
    });

    document.body.appendChild(wrapper);
    return wrapper;
  }

  /**
   * Position the icon wrapper relative to the password field
   */
  function positionWrapper(wrapper, field) {
    function updatePosition() {
      const rect = field.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      wrapper.style.position = 'absolute';
      wrapper.style.top = `${rect.top + scrollY + (rect.height / 2) - (ICON_SIZE / 2)}px`;
      wrapper.style.left = `${rect.right + scrollX + 6}px`;
      wrapper.style.zIndex = '2147483646';
    }

    updatePosition();

    // Reposition on scroll/resize
    const observer = new IntersectionObserver(() => updatePosition());
    observer.observe(field);
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });

    // Clean up if field is removed
    const mutObserver = new MutationObserver(() => {
      if (!document.contains(field)) {
        wrapper.remove();
        observer.disconnect();
        mutObserver.disconnect();
      }
    });
    mutObserver.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Show toast notification
   */
  function showToast(toast, message) {
    toast.textContent = message;
    toast.classList.add('spg-toast-show');
    setTimeout(() => toast.classList.remove('spg-toast-show'), 1500);
  }

  /**
   * Process a password field — add icon + optional auto-fill
   */
  async function processPasswordField(field) {
    if (processedFields.has(field)) return;
    processedFields.add(field);

    if (!currentSettings) {
      await loadSettings();
    }

    if (currentSettings.showIcon !== false) {
      createKeyIcon(field);
    }

    // Auto-fill if enabled
    if (currentSettings.autoFill) {
      const password = PasswordGenerator.generate(window.location.href, currentSettings);
      if (password) {
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputValueSetter.call(field, password);
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }

  /**
   * Scan the page for password fields
   */
  function scanForPasswordFields() {
    const fields = document.querySelectorAll('input[type="password"]');
    fields.forEach(processPasswordField);
  }

  /**
   * Set up MutationObserver for dynamically added password fields
   */
  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          // Check if the added node itself is a password field
          if (node.matches && node.matches('input[type="password"]')) {
            processPasswordField(node);
          }

          // Check children of the added node
          if (node.querySelectorAll) {
            const fields = node.querySelectorAll('input[type="password"]');
            fields.forEach(processPasswordField);
          }
        }

        // Also check for attribute changes (type might change to "password")
        if (mutation.type === 'attributes' && mutation.attributeName === 'type') {
          if (mutation.target.type === 'password') {
            processPasswordField(mutation.target);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['type']
    });
  }

  /**
   * Listen for settings updates from background
   */
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SETTINGS_UPDATED') {
      currentSettings = message.settings;
    }
  });

  // ─── INIT ────────────────────────────────────────────
  loadSettings().then(() => {
    scanForPasswordFields();
    observeDOM();
  });

})();
