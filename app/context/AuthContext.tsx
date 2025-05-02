'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Interface defining the structure of a user object
 * @interface User
 * @property {string} _id - Unique identifier for the user
 * @property {string} name - User's display name
 * @property {string} email - User's email address
 * @property {string} token - Authentication token for API requests
 */
interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
}

/**
 * Interface defining the shape of the authentication context
 * @interface AuthContextType
 * @property {User | null} user - Current authenticated user or null if not authenticated
 * @property {(userData: User) => void} login - Function to log in a user
 * @property {() => void} logout - Function to log out the current user
 * @property {boolean} isLoading - Loading state indicator
 */
interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

// Create the authentication context with undefined as default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider component that manages user authentication state
 * @component AuthProvider
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be wrapped by the provider
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check for stored user data on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  /**
   * Logs in a user and stores their data in localStorage
   * @param {User} userData - User data to be stored
   */
  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  /**
   * Logs out the current user and redirects to login page
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access the authentication context
 * @returns {AuthContextType} The authentication context
 * @throws {Error} If used outside of AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 