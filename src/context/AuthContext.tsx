import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  quickUsers: User[];
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchUser: (targetUser: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [quickUsers, setQuickUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuickUsers = async () => {
    try {
      const list = await api.getQuickUsers();
      setQuickUsers(list);
    } catch (e) {
      console.error('Error fetching quick users:', e);
    }
  };

  const initAuth = async () => {
    setLoading(true);
    try {
      await fetchQuickUsers();
      const token = getStoredToken();
      if (token) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          setStoredToken(null);
          setUser(null);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    await fetchQuickUsers();
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const switchUser = (targetUser: User) => {
    setStoredToken(targetUser.id);
    setUser(targetUser);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch {
      // ignore
    }
    await fetchQuickUsers();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        quickUsers,
        loading,
        login,
        logout,
        switchUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
