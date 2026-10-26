/**
 * AI Research Paper Summarizer - Settings Controller
 * Handles user preferences, theme synchronization, AI options, and local persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!window.authAPI || !window.authAPI.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const pageLoader = document.getElementById('pageLoader');
  if (pageLoader) {
    setTimeout(() => pageLoader.classList.add('fade-out'), 400);
  }

  const SETTINGS_KEY = 'papermind_settings';

  const defaultSettings = {
    theme: localStorage.getItem('papermind_theme') || 'dark',
    summaryFormat: 'detailed',
    targetLength: 'standard',
    autoQuestions: true,
    emailNotifs: true,
    browserNotifs: false,
  };

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return { ...defaultSettings, ...saved };
    } catch (e) {
      return defaultSettings;
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    showToast('Settings saved successfully!');
  }

  // Populate UI
  const settings = loadSettings();

  // Theme radios
  const themeRadios = document.querySelectorAll('input[name="appTheme"]');
  themeRadios.forEach(radio => {
    if (radio.value === settings.theme) radio.checked = true;
    radio.addEventListener('change', (e) => {
      const isLight = e.target.value === 'light';
      document.body.classList.toggle('light-theme', isLight);
      localStorage.setItem('papermind_theme', isLight ? 'light' : 'dark');
      settings.theme = isLight ? 'light' : 'dark';
      saveSettings(settings);
    });
  });

  // Summary format
  const summaryFormatSelect = document.getElementById('summaryFormatSelect');
  if (summaryFormatSelect) {
    summaryFormatSelect.value = settings.summaryFormat;
    summaryFormatSelect.addEventListener('change', (e) => {
      settings.summaryFormat = e.target.value;
      saveSettings(settings);
    });
  }

  // Target length
  const targetLengthSelect = document.getElementById('targetLengthSelect');
  if (targetLengthSelect) {
    targetLengthSelect.value = settings.targetLength;
    targetLengthSelect.addEventListener('change', (e) => {
      settings.targetLength = e.target.value;
      saveSettings(settings);
    });
  }

  // Auto questions
  const autoQuestionsToggle = document.getElementById('autoQuestionsToggle');
  if (autoQuestionsToggle) {
    autoQuestionsToggle.checked = settings.autoQuestions;
    autoQuestionsToggle.addEventListener('change', (e) => {
      settings.autoQuestions = e.target.checked;
      saveSettings(settings);
    });
  }

  // Email notifs
  const emailNotifsToggle = document.getElementById('emailNotifsToggle');
  if (emailNotifsToggle) {
    emailNotifsToggle.checked = settings.emailNotifs;
    emailNotifsToggle.addEventListener('change', (e) => {
      settings.emailNotifs = e.target.checked;
      saveSettings(settings);
    });
  }

  // Clear session data button
  const clearSessionBtn = document.getElementById('clearSessionBtn');
  if (clearSessionBtn) {
    clearSessionBtn.addEventListener('click', () => {
      if (confirm('Clear local cache and active paper sessions? You will stay logged in.')) {
        sessionStorage.clear();
        localStorage.removeItem('papermind_favorites');
        showToast('Local cache and session storage cleared.');
      }
    });
  }

  function showToast(msg) {
    let toast = document.getElementById('settingsToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'settingsToast';
      toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background: #10b981;
        color: #fff;
        padding: 0.8rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 3500);
  }
});
