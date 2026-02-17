"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { serverFetch } from "@/lib/serverFetch";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'teacher' | 'admin' | 'content_team';
  stream?: string;
  class_level?: number;
  subjects?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  stream?: string;
  class_level?: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
        const res = await serverFetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include'
        });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await serverFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      credentials: 'include'
    });
  
    const data = await res.json();
  
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
  
    setUser(data.user);
  };


  const register = async (data: RegisterData) => {
    const res = await serverFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include'
    });

  const responseData = await res.json();

  if (!res.ok) {
    throw new Error(responseData.error || 'Registration failed');
  }

  setUser(responseData.user);
};


    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Registration failed');
    }

    const responseData = await res.json();
    setUser(responseData.user);
  };

  const logout = async () => {
    await serverFetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
