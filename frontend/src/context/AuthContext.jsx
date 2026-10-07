import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { registerUserSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('queueless_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('queueless_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('queueless_token');
      if (storedToken) {
        try {
          const res = await api('/auth/profile');
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('queueless_user', JSON.stringify(res.user));
            registerUserSocket(res.user.id);
          }
        } catch (err) {
          console.error('Session validation failed:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.success) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('queueless_token', res.token);
      localStorage.setItem('queueless_user', JSON.stringify(res.user));
      registerUserSocket(res.user.id);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (res.success) {
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('queueless_token', res.token);
      localStorage.setItem('queueless_user', JSON.stringify(res.user));
      registerUserSocket(res.user.id);
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('queueless_token');
    localStorage.removeItem('queueless_user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
