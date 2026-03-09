/**
 * Auth utility for Google OAuth.
 *
 * Flow:
 *   1. User clicks "Login with Google" → navigates to {apiBaseUrl}/api/auth/google
 *   2. After Google consent, backend redirects back to frontend with ?auth_code=... (one-time code)
 *   3. handleTokenFromURL() exchanges the code for the actual JWT via GET /api/auth/exchange
 *   4. fetchCurrentUser() validates the token with /api/auth/me
 *
 * JWT is never exposed in the URL — only a short-lived (60s) single-use opaque code is.
 */

const TOKEN_KEY = 'auth_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * If the URL contains ?auth_code=... or ?consent_code=...,
 * exchange the code for the actual token via GET /api/auth/exchange.
 * Returns { token, consentToken } — same shape as before.
 */
export async function handleTokenFromURL(apiBaseUrl) {
  const params = new URLSearchParams(window.location.search);
  const authCode = params.get('auth_code');
  const consentCode = params.get('consent_code');

  // Clean URL immediately before any async work
  if (authCode || consentCode) {
    params.delete('auth_code');
    params.delete('consent_code');
    const clean = window.location.pathname + (params.toString() ? `?${params}` : '');
    window.history.replaceState({}, '', clean);
  }

  if (authCode) {
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/exchange?code=${encodeURIComponent(authCode)}`);
      if (!res.ok) return { token: null, consentToken: null };
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        return { token: data.token, consentToken: null };
      }
    } catch {
      // Exchange failed — treat as unauthenticated
    }
    return { token: null, consentToken: null };
  }

  if (consentCode) {
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/exchange?code=${encodeURIComponent(consentCode)}`);
      if (!res.ok) return { token: null, consentToken: null };
      const data = await res.json();
      if (data.consentToken) {
        return { token: null, consentToken: data.consentToken };
      }
    } catch {
      // Exchange failed
    }
    return { token: null, consentToken: null };
  }

  return { token: null, consentToken: null };
}

/**
 * Fetch current user from backend using stored JWT.
 * Returns { id, email, name } or null.
 */
export async function fetchCurrentUser(apiBaseUrl) {
  const token = getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${apiBaseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      clearToken(); // token invalid/expired
      return null;
    }
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

/**
 * Logout: clear token.
 */
export function logout() {
  clearToken();
}
