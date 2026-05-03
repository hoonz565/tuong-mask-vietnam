// api/client.js — Centralized API configuration
// All backend communication routes through this module.

const BASE_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

export const API_BASE = BASE_URL;
export const API_ENDPOINT = `${BASE_URL}/api`;

/**
 * Core fetch wrapper.
 * - Unwraps the { data, status } response envelope (api.md convention).
 * - If the response is a plain array/object (no envelope), returns it as-is.
 * - Throws a descriptive error on non-ok HTTP responses.
 *
 * @param {string} path    — Relative path, e.g. "/masks" or "/masks/match"
 * @param {RequestInit} options — Fetch options (method, headers, body, …)
 * @returns {Promise<any>} — Resolved data payload
 */
async function request(path, options = {}) {
  const url = `${API_ENDPOINT}${path}`;

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const message = `API Error ${response.status}: ${response.statusText} — ${url}`;
    console.error('[API Client]', message);
    throw new Error(message);
  }

  const json = await response.json();

  // Unwrap envelope: { data: ..., status: "ok" }
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data;
  }

  // Raw array/object (e.g. GET /masks returns a plain list)
  return json;
}

export default request;
