import store from '../store';

const API_BASE = (import.meta.env.VITE_API_URL?.trim() || '/api').replace(/\/+$/, '');

/**
 * Opens an authenticated PDF document or template preview in a new tab.
 * Opens the new tab synchronously to prevent popup blocker suppression,
 * then streams the PDF blob into the window.
 */
export async function openPdf(path) {
  const state = store.getState();
  const token = state.auth?.token;
  const businessId = state.business?.activeBusinessId;

  const win = window.open('', '_blank');
  try {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (businessId) headers['X-Business-Id'] = businessId;

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const res = await fetch(`${API_BASE}${normalizedPath}`, {
      headers,
    });

    if (!res.ok) {
      throw new Error(`Could not load PDF (${res.status})`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    if (win) {
      win.location.href = url;
    }
    // Clean up blob URL after 1 minute
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) {
    if (win) win.close();
    throw error;
  }
}
