import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredApiUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function isLoopback(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function getHostname(value) {
  if (!value) return null;
  try {
    const url = new URL(value.includes('://') ? value : `http://${value}`);
    return url.hostname.replace(/^\[|\]$/g, '');
  } catch (_error) {
    return null;
  }
}

function getDevelopmentHost() {
  return getHostname(
    Constants.expoConfig?.hostUri ||
      Constants.expoGoConfig?.debuggerHost ||
      Constants.linkingUri,
  );
}

function resolveApiUrl() {
  const configuredHost = getHostname(configuredApiUrl);
  if (Platform.OS === 'web' || !__DEV__ || !isLoopback(configuredHost)) {
    return configuredApiUrl;
  }

  const developmentHost = getDevelopmentHost();
  if (developmentHost && !isLoopback(developmentHost)) {
    const host = developmentHost.includes(':') ? `[${developmentHost}]` : developmentHost;
    return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return configuredApiUrl;
}

const API_URL = resolveApiUrl();

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch (_error) {
    throw new Error(`Cannot reach the MapPin API at ${API_URL}`);
  }

  if (response.status === 204) return null;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export const api = {
  getPins: () => request('/api/pins'),
  createPin: (pin) => request('/api/pins', { method: 'POST', body: JSON.stringify(pin) }),
  updatePin: (id, pin) =>
    request(`/api/pins/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(pin),
    }),
  deletePin: (id) => request(`/api/pins/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
