/**
 * API Service Module
 * 
 * This module provides a centralized API service for making HTTP requests to the backend.
 * It includes authentication handling, request/response management, and error handling.
 */

import { getSession } from 'next-auth/react';
import toast from 'react-hot-toast';

// Base URL for API requests, falls back to localhost if not configured
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Generic interface for API responses
 * @template T - The type of data expected in the response
 */
interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Interface for user-related API responses
 */
interface UserResponse {
  user: {
    name: string;
  };
}

/**
 * Interface for password update responses
 */
interface PasswordUpdateResponse {
  message: string;
}

/**
 * Base API service with common request handling
 */
export const api = {
  /**
   * Generic request method for making API calls
   * @param endpoint - API endpoint to call
   * @param options - Request options including method, body, headers
   * @returns Promise with API response data or error
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // Get current session and extract token
      const session = await getSession();
      const token = session?.user?.token;
      
      // Prepare headers with authentication if token exists
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };

      // Make the API request
      const response = await fetch(`${API_URL}/api${endpoint}`, {
        ...options,
        headers,
      });

      // Handle the response
      const data = await handleApiResponse(response);

      return { data: data as T };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  },
};

/**
 * Authentication-related API endpoints
 */
export const authApi = {
  /**
   * Login user with email and password
   */
  login: async (email: string, password: string) => {
    const response = await api.request<{ token: string; user: { name: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  },

  /**
   * Register new user with name, email and password
   */
  register: async (name: string, email: string, password: string) => {
    const response = await api.request<{ token: string; user: { name: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return response;
  },

  /**
   * Request password reset for given email
   */
  forgotPassword: async (email: string) => {
    const response = await api.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response;
  },

  /**
   * Reset password using reset token
   */
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.request<{ message: string }>(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    return response;
  },

  /**
   * Update user's username
   */
  updateUsername: async (username: string) => {
    const response = await api.request<UserResponse>('/auth/update-username', {
      method: 'PUT',
      body: JSON.stringify({ username }),
    });
    return response;
  },

  /**
   * Update user's password
   */
  updatePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.request<PasswordUpdateResponse>('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response;
  },
};

/**
 * Handles API response and error cases
 * @param response - The fetch Response object
 * @returns Parsed response data or throws error
 */
export const handleApiResponse = async (response: Response) => {
  // Check if response is JSON
  const isJson = response.headers.get('content-type')?.includes('application/json');
  
  if (!response.ok) {
    const errorData: { message: string; details?: any } = { 
      message: 'An error occurred' 
    };
    
    try {
      if (isJson) {
        const data = await response.json();
        errorData.message = data.message || data.error || 'Unknown error occurred';
        errorData.details = data.details;
        
        // Handle authentication errors
        if (response.status === 403 && errorData.message.includes('Invalid or expired token')) {
          toast.error('Your session has expired. Please login again.');
          // Clear auth state
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          // Redirect to login
          window.location.href = '/login';
          return null;
        }
      } else {
        const textData = await response.text();
        errorData.message = textData || 'Unknown error occurred';
      }
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      toast.error('Failed to parse server response');
    }

    // Log detailed error information
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint: response.url,
      error: errorData
    });

    throw new Error(errorData.message);
  }

  // Return parsed response data
  return isJson ? response.json() : response.text();
};