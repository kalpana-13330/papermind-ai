/**
 * AI Research Paper Summarizer - Centralized API & Authentication Service
 * Connects Vanilla JS Frontend to the Express.js Backend API
 */

(function () {
  // Determine API Base URL from APP_CONFIG or default to local backend
  const API_BASE_URL =
    (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) ||
    'http://localhost:5000/api';

  const TOKEN_KEY = 'papermind_token';
  const USER_KEY = 'papermind_user';
  const ACTIVE_PAPER_KEY = 'papermind_current_paper_id';

  // --- Token & Auth Helpers ---
  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  }

  function setToken(token) {
    if (!token) return;
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  function removeToken() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }

  function getUser() {
    const data = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    try {
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function setUser(user) {
    if (!user) return;
    const str = JSON.stringify(user);
    localStorage.setItem(USER_KEY, str);
    sessionStorage.setItem(USER_KEY, str);
  }

  function logout() {
    removeToken();
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ACTIVE_PAPER_KEY);
    sessionStorage.removeItem('papermind_upload_data');
    sessionStorage.removeItem('papermind_summary_data');
    window.location.href = 'login.html';
  }

  function isAuthenticated() {
    return !!getToken();
  }

  // --- Active Paper ID State Helpers ---
  function getActivePaperId() {
    const directId = sessionStorage.getItem(ACTIVE_PAPER_KEY) || localStorage.getItem(ACTIVE_PAPER_KEY);
    if (directId) return directId;

    // Check if stored in upload_data
    const uploadDataStr = sessionStorage.getItem('papermind_upload_data');
    if (uploadDataStr) {
      try {
        const parsed = JSON.parse(uploadDataStr);
        if (parsed.paperId) return parsed.paperId;
      } catch (e) {}
    }

    // Check if stored in summary_data
    const summaryDataStr = sessionStorage.getItem('papermind_summary_data');
    if (summaryDataStr) {
      try {
        const parsed = JSON.parse(summaryDataStr);
        if (parsed.paperId) return parsed.paperId;
      } catch (e) {}
    }

    return null;
  }

  function setActivePaperId(paperId, metadata = null) {
    if (!paperId) return;
    const previousPaperId = sessionStorage.getItem(ACTIVE_PAPER_KEY);
    if (previousPaperId !== String(paperId)) {
      sessionStorage.removeItem('papermind_summary_data');
      sessionStorage.removeItem('papermind_upload_data');
    }
    sessionStorage.setItem(ACTIVE_PAPER_KEY, String(paperId));
    localStorage.setItem(ACTIVE_PAPER_KEY, String(paperId));
    if (metadata) {
      sessionStorage.setItem('papermind_upload_data', JSON.stringify({ ...metadata, paperId }));
    }
  }

  // --- Core API Fetch Wrapper ---
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = options.headers ? { ...options.headers } : {};

    // Attach JWT authorization if available
    const token = getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Set JSON Content-Type if not sending FormData
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle unauthenticated response
      if (response.status === 401) {
        const isAuthRoute =
          endpoint.includes('/auth/login') ||
          endpoint.includes('/auth/register') ||
          endpoint.includes('/auth/github') ||
          endpoint.includes('/auth/forgot-password') ||
          endpoint.includes('/auth/reset-password');

        if (!isAuthRoute) {
          removeToken();
          const page = window.location.pathname.split('/').pop();
          if (page && page !== 'login.html' && page !== 'register.html' && page !== 'index.html' && page !== '') {
            window.location.href = 'login.html';
          }
        }
      }

      const contentType = response.headers.get('content-type') || '';

      // Return Blob for downloads or raw PDF streaming
      if (options.responseType === 'blob') {
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `Download failed with status ${response.status}`);
        }
        return await response.blob();
      }

      // Parse JSON response
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (!response.ok) {
          const errorMsg =
            data.message ||
            (data.errors && data.errors.join(', ')) ||
            `Request failed with status ${response.status}`;
          const err = new Error(errorMsg);
          err.status = response.status;
          err.data = data;
          throw err;
        }
        return data;
      }

      if (!response.ok) {
        const text = await response.text();
        const err = new Error(text || `Request failed with status ${response.status}`);
        err.status = response.status;
        throw err;
      }

      return response;
    } catch (err) {
      console.error(`[API Call Failed] ${options.method || 'GET'} ${endpoint}:`, err);
      throw err;
    }
  }

  // --- Authentication API ---
  const authAPI = {
    async register(name, email, password) {
      const res = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (res && res.data && res.data.token) {
        setToken(res.data.token);
        if (res.data.user) setUser(res.data.user);
      }
      return res;
    },

    async login(email, password) {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res && res.data && res.data.token) {
        setToken(res.data.token);
        if (res.data.user) setUser(res.data.user);
      }
      return res;
    },

    async getMe() {
      const res = await apiRequest('/auth/me', { method: 'GET' });
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
      }
      return res;
    },

    async forgotPassword(email) {
      return await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async resetPassword(token, password) {
      const res = await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      if (res && res.data && res.data.token) {
        setToken(res.data.token);
        if (res.data.user) setUser(res.data.user);
      }
      return res;
    },

    async updateProfile(name) {
      const res = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
      if (res && res.data && res.data.user) {
        setUser(res.data.user);
      }
      return res;
    },

    async changePassword(currentPassword, newPassword) {
      const res = await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (res && res.data && res.data.token) {
        setToken(res.data.token);
        if (res.data.user) setUser(res.data.user);
      }
      return res;
    },

    loginWithGithub() {
      window.location.href = `${API_BASE_URL}/auth/github`;
    },

    async googleAuth(credential) {
      const res = await apiRequest('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      if (res && res.data && res.data.token) {
        setToken(res.data.token);
        if (res.data.user) setUser(res.data.user);
      }
      return res;
    },

    logout,
    getToken,
    getUser,
    isAuthenticated,
  };

  // --- Research Papers API ---
  const paperAPI = {
    async upload(file) {
      const formData = new FormData();
      formData.append('file', file);

      return await apiRequest('/papers/upload', {
        method: 'POST',
        body: formData,
      });
    },

    async importFromUrl(url) {
      return await apiRequest('/papers/url', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    },

    async process(paperId) {
      return await apiRequest(`/papers/${paperId}/process`, {
        method: 'POST',
      });
    },

    async summarize(paperId, regenerate = false) {
      const query = regenerate ? '?regenerate=true' : '';
      return await apiRequest(`/papers/${paperId}/summarize${query}`, {
        method: 'POST',
      });
    },

    async getSummary(paperId) {
      return await apiRequest(`/papers/${paperId}/summary`, {
        method: 'GET',
      });
    },

    async downloadSummaryBlob(paperId, format = 'pdf') {
      return await apiRequest(`/papers/${paperId}/summary/download?format=${format}`, {
        method: 'GET',
        responseType: 'blob',
      });
    },

    async getPdfBlob(paperId) {
      return await apiRequest(`/papers/${paperId}/pdf`, {
        method: 'GET',
        responseType: 'blob',
      });
    },

    async getSuggestedQuestions(paperId) {
      return await apiRequest(`/papers/${paperId}/questions`, {
        method: 'GET',
      });
    },

    async getRelatedPapers(paperId) {
      return await apiRequest(`/papers/${paperId}/related`, {
        method: 'GET',
      });
    },

    async getPapers(page = 1, limit = 20) {
      return await apiRequest(`/papers?page=${page}&limit=${limit}`, {
        method: 'GET',
      });
    },

    async getPaper(paperId) {
      return await apiRequest(`/papers/${paperId}`, {
        method: 'GET',
      });
    },

    async deletePaper(paperId) {
      return await apiRequest(`/papers/${paperId}`, {
        method: 'DELETE',
      });
    },
  };

  // --- Chat / Ask AI API ---
  const chatAPI = {
    async askQuestion(paperId, message) {
      return await apiRequest(`/papers/${paperId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },

    async getChatHistory(paperId) {
      return await apiRequest(`/papers/${paperId}/chat`, {
        method: 'GET',
      });
    },

    async clearChatHistory(paperId) {
      return await apiRequest(`/papers/${paperId}/chat`, {
        method: 'DELETE',
      });
    },
  };

  // --- Helper to update Header user profile and navigation links dynamically ---
  function updateHeaderUserInfo() {
    const user = getUser();
    if (!user) return;

    const displayName = user.name || user.email.split('@')[0];
    const firstName = displayName.split(' ')[0];
    const userEmail = user.email || '';

    // Update greeting / welcome text across pages
    document.querySelectorAll('.welcome-text h2 span').forEach((el) => {
      el.textContent = firstName;
    });

    const copilotGreeting = document.getElementById('copilotGreeting');
    if (copilotGreeting) {
      copilotGreeting.textContent = `Hello ${firstName}! How can I assist your research right now?`;
    }

    // Update avatar and name across header/sidebar dropdowns
    document.querySelectorAll('.user-profile-menu').forEach((el) => {
      const h4 = el.querySelector('.user-info h4');
      if (h4) h4.textContent = displayName;
      const avatar = el.querySelector('img.avatar');
      if (avatar) {
        avatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&rounded=true`;
      }
    });

    document.querySelectorAll('.profile-dropdown-header').forEach((el) => {
      const h4 = el.querySelector('h4');
      if (h4) h4.textContent = displayName;
      const p = el.querySelector('p');
      if (p) p.textContent = userEmail;
      const avatarLg = el.querySelector('img.avatar-lg');
      if (avatarLg) {
        avatarLg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=6366f1&color=fff&rounded=true`;
      }
    });

    // Dynamically wire up all placeholder navigation links
    document.querySelectorAll('a').forEach((link) => {
      const text = link.textContent.trim().toLowerCase();
      const href = link.getAttribute('href');

      if (href === '#' || !href) {
        if (text.includes('favorites')) {
          link.href = 'papers.html?filter=favorites';
        } else if (text.includes('history')) {
          link.href = 'history.html';
        } else if (text.includes('settings')) {
          link.href = 'settings.html';
        } else if (text.includes('profile') || text.includes('my account')) {
          link.href = 'profile.html';
        } else if (text.includes('billing')) {
          link.href = 'settings.html?tab=billing';
        } else if (text.includes('help center')) {
          link.href = 'index.html#faq';
        }
      }
    });

    // Wire up all logout buttons
    document.querySelectorAll('a').forEach((link) => {
      const text = link.textContent.trim().toLowerCase();
      if (text.includes('logout')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          logout();
        });
      }
    });
  }

  // Execute header info update on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    updateHeaderUserInfo();
  });

  /**
   * requireAuth() — Route Guard
   * Call at the top of any protected page script.
   * If no valid token is present, redirects to login.html
   * and passes the current page as ?next= so the user is
   * returned here after successful login.
   */
  function requireAuth() {
    if (!getToken()) {
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      window.location.href = 'login.html?next=' + encodeURIComponent(currentPage);
      return false;
    }
    return true;
  }

  // Export to window
  window.API_BASE_URL = API_BASE_URL;
  window.authAPI = authAPI;
  window.paperAPI = paperAPI;
  window.chatAPI = chatAPI;
  window.getActivePaperId = getActivePaperId;
  window.setActivePaperId = setActivePaperId;
  window.updateHeaderUserInfo = updateHeaderUserInfo;
  window.isAuthenticated = isAuthenticated;
  window.getToken = getToken;
  window.requireAuth = requireAuth;
})();
