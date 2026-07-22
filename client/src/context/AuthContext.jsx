import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE = '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pc_token'));
  const [loading, setLoading] = useState(true);

  // Fetch current user on mount if token exists
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Token invalid
        localStorage.removeItem('pc_token');
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem('pc_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // TODO(security): Token should be stored in httpOnly cookie set by backend
    // For this MVP, storing in localStorage with awareness of XSS risk
    localStorage.setItem('pc_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const signup = async (name, email, password, role) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    localStorage.setItem('pc_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const logout = useCallback(() => {
    localStorage.removeItem('pc_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const authFetch = useCallback(
    async (url, options = {}) => {
      const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });
      if (res.status === 401) {
        logout();
        throw new Error('Session expired');
      }
      return res;
    },
    [token, logout]
  );

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
