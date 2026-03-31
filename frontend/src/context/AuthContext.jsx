import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/axios';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      return data;
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed';
      toast.error(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password, role = 'user') => {
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name, email, password, role });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success('Account created successfully!');
      return data;
    } catch (error) {
      const msg = error.response?.data?.error || 'Registration failed';
      toast.error(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await authAPI.getProfile();
      const updated = data.user;
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
    } catch {
      // Token might be expired
    }
  }, []);

  useEffect(() => {
    if (user && localStorage.getItem('token')) {
      refreshProfile();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
