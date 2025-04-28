/**
 * Authentication Provider Component
 * Manages user authentication state and provides authentication-related
 * functionality throughout the application using React Context.
 */
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

/**
 * User interface defining the structure of authenticated user data
 */
interface User {
  _id: string;
  name: string;
  email: string;
  token: string;
  avatarUrl: string;
}

/**
 * Authentication context interface defining available authentication operations
 */
interface AuthContextType {
  user: User | null;          // Current authenticated user or null if not authenticated
  logout: () => void;         // Function to handle user logout
  isLoading: boolean;         // Loading state during authentication operations
  updateUser: (updatedUser: Partial<User>) => void;  // Function to update user data
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component that wraps the application and provides authentication state
 * and functionality to all child components
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  // Effect to sync user state with session data
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Create user data object from session information
      const userData = {
        _id: session.user._id as string,
        name: session.user.name as string,
        email: session.user.email as string,
        token: session.user.token as string,
        // Generate avatar URL using DiceBear API
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(session.user.email || '')}`
      };
      setUser(userData);
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status]);

  /**
   * Handles user logout by clearing session and redirecting to login page
   */
  const logout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    router.push('/auth/login');
  };

  /**
   * Updates user data with partial user information
   */
  const updateUser = (updatedUser: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedUser } : null);
  };

  // Context value containing authentication state and functions
  const value = {
    user,
    logout,
    isLoading: status === 'loading',
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context
 * Must be used within an AuthProvider component
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};