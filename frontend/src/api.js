const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'todo_workshop_jwt_token';
const USER_KEY = 'todo_workshop_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  getUser: () => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

async function request(endpoint, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }

  return data;
}

// 5 Backend APIs
export const api = {
  // 1. Send OTP (Minimoth API backend dispatch)
  sendOtp: (phone) =>
    request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone })
    }),

  // 2. Verify OTP and authenticate user
  verifyOtp: (phone, otp, name) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp, name })
    }),

  // 3. Get todos
  getTodos: () => request('/todos', { method: 'GET' }),

  // 4. Create todo
  createTodo: (text, priority) =>
    request('/todos', {
      method: 'POST',
      body: JSON.stringify({ text, priority })
    }),

  // 5. Update or Delete todo
  updateTodo: (id, updates) =>
    request(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),

  deleteTodo: (id) =>
    request(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ _delete: true })
    })
};
