/**
 * Auth utility for Google OAuth.
 *
 * Flow:
 *   1. User clicks "Login with Google" → navigates to {apiBaseUrl}/api/auth/google
 *   2. After Google consent, backend redirects back to frontend with ?auth_token=...
 *   3. handleTokenFromURL() captures and stores it in localStorage
 *   4. fetchCurrentUser() validates the token with /api/auth/me
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
 * If the URL contains ?auth_token=..., store it and clean the URL.
 * Returns the token if found, null otherwise.
 */
export function handleTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('auth_token');
  if (token) {
    setToken(token);
    params.delete('auth_token');
    const clean = window.location.pathname + (params.toString() ? `?${params}` : '');
    window.history.replaceState({}, '', clean);
    return token;
  }
  return null;
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
