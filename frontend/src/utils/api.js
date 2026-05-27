// API utility — centralized fetch wrapper with auth support

const TOKEN_KEY = 'news_portal_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return { success: true };
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Something went wrong');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get(url) {
    return request(url, { method: 'GET' });
  },

  post(url, body) {
    const options = { method: 'POST' };
    if (body instanceof FormData) {
      options.body = body;
    } else if (body !== undefined) {
      options.body = JSON.stringify(body);
    }
    return request(url, options);
  },

  put(url, body) {
    const options = { method: 'PUT' };
    if (body instanceof FormData) {
      options.body = body;
    } else if (body !== undefined) {
      options.body = JSON.stringify(body);
    }
    return request(url, options);
  },

  delete(url) {
    return request(url, { method: 'DELETE' });
  },
};
