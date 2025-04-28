import { getSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface UserResponse {
  user: {
    name: string;
  };
}

interface PasswordUpdateResponse {
  message: string;
}

export const api = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const session = await getSession();
      const token = session?.user?.token;
      
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };

      const response = await fetch(`${API_URL}/api${endpoint}`, {
        ...options,
        headers,
      });

      const data = await handleApiResponse(response);

      return { data: data as T };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  },
};

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.request<{ token: string; user: { name: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.request<{ token: string; user: { name: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return response;
  },

  forgotPassword: async (email: string) => {
    const response = await api.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return response;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.request<{ message: string }>(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    return response;
  },

  updateUsername: async (username: string) => {
    const response = await api.request<UserResponse>('/auth/update-username', {
      method: 'PUT',
      body: JSON.stringify({ username }),
    });
    return response;
  },

  updatePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.request<PasswordUpdateResponse>('/auth/update-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response;
  },
};

export const handleApiResponse = async (response: Response) => {
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

    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint: response.url,
      error: errorData
    });

    throw new Error(errorData.message);
  }

  return isJson ? response.json() : response.text();
};