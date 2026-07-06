/* ============================================================
 * FlowGuard Client Portal — Shared API request helper
 * ------------------------------------------------------------
 * ONE place that handles: base URL, auth header, 401 -> login,
 * and surfacing the server's real error message.
 * All portal API calls should go through apiRequest().
 * ============================================================ */
(function () {
  const API_BASE = 'https://api.flowguard.ng/api/v1';

  /**
   * apiRequest(path, options)
   *  - path: e.g. '/profile' or '/properties/PROP-123/tickets'
   *  - options: standard fetch options ({ method, body, headers })
   *    body may be a plain object (auto-JSON) or a pre-stringified string.
   * Returns parsed JSON on success.
   * Throws Error(message) on failure, where message is the server's
   * error text when available, so callers can show it directly.
   */
  async function apiRequest(path, options = {}) {
    const token = localStorage.getItem('token');
    const opts = { ...options, headers: { ...(options.headers || {}) } };

    // Auth header (unless caller explicitly set one)
    if (token && !opts.headers['Authorization']) {
      opts.headers['Authorization'] = `Bearer ${token}`;
    }

    // Auto-JSON body if a plain object was passed
    if (opts.body && typeof opts.body === 'object') {
      opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
      opts.body = JSON.stringify(opts.body);
    }

    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, opts);
    } catch (netErr) {
      console.error('apiRequest network error:', path, netErr);
      throw new Error('Network error — please check your connection and try again.');
    }

    // Global 401 handling: session dead -> clear + redirect to login
    if (res.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (_) {}
      // Only redirect if we aren't already on the login page
      if (!/login\.html$/.test(window.location.pathname)) {
        window.location.href = 'login.html';
      }
      throw new Error('Your session has expired. Please sign in again.');
    }

    let data = null;
    try { data = await res.json(); } catch (_) { /* non-JSON */ }

    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data;
  }

  // Expose globally + keep API_BASE available for any legacy references
  window.apiRequest = apiRequest;
  window.API_BASE = window.API_BASE || API_BASE;
})();
