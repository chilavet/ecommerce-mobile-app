import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  getUserByEmail,
  createUser,
  initDatabase,
  updateUserPassword,
  deleteUser,
} from '../database/db';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  biometricsEnabled: boolean;
  setBiometricsEnabled: (enabled: boolean) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(true);

  useEffect(() => {
    async function setup() {
      try {
        await initDatabase();
        // User starts unauthenticated so the Sign In screen is presented first
        setUser(null);
      } catch (err) {
        console.error('Failed to init auth context:', err);
      } finally {
        setIsLoading(false);
      }
    }
    setup();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const found = await getUserByEmail(email);
      if (!found) {
        return { success: false, error: 'No account found with this email' };
      }
      if (found.password && found.password !== pass) {
        return { success: false, error: 'Incorrect password' };
      }
      const loggedUser: User = {
        id: found.id,
        email: found.email,
        name: found.name,
        phone: found.phone,
        createdAt: found.createdAt,
      };
      setUser(loggedUser);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to sign in. Please try again.' };
    }
  };

  const register = async (name: string, email: string, pass: string, phone?: string) => {
    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        return { success: false, error: 'An account with this email already exists' };
      }
      const created = await createUser({
        name,
        email,
        password: pass,
        phone,
      });
      setUser(created);
      return { success: true };
    } catch {
      return { success: false, error: 'Failed to create account.' };
    }
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    if (!user) {
      return { success: false, error: 'You must be signed in to change your password.' };
    }
    const res = await updateUserPassword(user.id, oldPass, newPass);
    return res;
  };

  const deleteAccount = async () => {
    if (!user) {
      return { success: false, error: 'No active user session to delete.' };
    }
    const res = await deleteUser(user.id);
    if (res.success) {
      setUser(null);
    }
    return res;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        biometricsEnabled,
        setBiometricsEnabled,
        login,
        register,
        changePassword,
        deleteAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
