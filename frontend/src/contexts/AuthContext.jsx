import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, removeToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.get('/api/auth/me')
        .then(data => {
          setUser(data.data || data.user || data);
        })
        .catch(() => {
          removeToken();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const data = await api.post('/api/auth/register', { username, email, password });
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    removeToken();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const data = await api.put('/api/auth/profile', profileData);
    setUser(data.user || data.data);
    return data;
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
