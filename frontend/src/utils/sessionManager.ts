/**
 * Session Manager
 * Handles multi-device session conflicts and token management
 */

const SESSION_KEY = 'session_id';
const DEVICE_KEY = 'device_id';

/**
 * Generate a unique device ID
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_KEY);
  
  if (!deviceId) {
    // Generate new device ID
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(DEVICE_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize session on login
 */
export function initializeSession(): string {
  const sessionId = generateSessionId();
  localStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

/**
 * Get current session ID
 */
export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}

/**
 * Clear session on logout
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
}

/**
 * Check if session is valid
 * This can be extended to check with backend
 */
export function isSessionValid(): boolean {
  const token = localStorage.getItem('auth_token');
  const sessionId = getSessionId();
  
  return !!(token && sessionId);
}

/**
 * Handle session conflict (when logging in on another device)
 */
export function handleSessionConflict(): void {
  console.warn('[SESSION] Session conflict detected - clearing local session');
  clearSession();
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/auth';
  }
}

/**
 * Add session info to API headers
 */
export function getSessionHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  const sessionId = getSessionId();
  const deviceId = getDeviceId();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (sessionId) {
    headers['X-Session-Id'] = sessionId;
  }
  
  if (deviceId) {
    headers['X-Device-Id'] = deviceId;
  }
  
  return headers;
}
