'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Link from 'next/link';
import { authApi } from '@/app/services/api';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const { data: session } = useSession();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is authenticated via Google
  const isGoogleUser = session?.user?.provider === 'google';

  // Update formData when user data changes
  useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({
        ...prev,
        username: user.name
      }));
    }
  }, [user?.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    setError('');
    setSuccess('');
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authApi.updateUsername(formData.username);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      toast.success('Username updated successfully');
      // Update the user context
      if (response.data?.user?.name && user) {
        updateUser({ ...user, name: response.data.user.name });
      }
    } catch (error) {
      console.error('Error updating username:', error);
      setError('An error occurred while updating username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.updatePassword(formData.currentPassword, formData.newPassword);
      
      if (response.error) {
        setError(response.error);
        return;
      }

      setSuccess('Password updated successfully');
      // Clear password fields after successful update
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Error updating password:', error);
      setError('An error occurred while updating password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e6e6e6] text-gray-800">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-[#e6e6e6] border-r border-gray-800">
          <div className="p-6">
            <h1 className="text-xl font-semibold mb-6">Settings</h1>
            <nav className="space-y-2">
              <Link 
                href="/settings"
                className="block px-3 py-2 text-gray-800 bg-[#e6e6e6] rounded-md"
              >
                General
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <div className="p-8">
            <div className="mb-12">
              <h2 className="text-2xl font-semibold">General Settings</h2>
              <p className="text-[#1c7b47] mt-1">Manage your account settings and preferences.</p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-md text-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-md text-green-200">
                {success}
              </div>
            )}

            {/* Username Section */}
            <div className="mb-16">
              <h3 className="text-lg font-medium mb-4">Username</h3>
              <form onSubmit={handleUpdateUsername} className="max-w-md flex items-end gap-4">
                <div className="flex-grow">
                  <label htmlFor="username" className="block text-sm font-medium text-black mb-1">
                    Current username
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    className="appearance-none bg-transparent border-b-2 border-gray-400 focus:border-[#1c7b47] w-full text-gray-800 py-2 px-2 leading-tight focus:outline-none"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-[#2ecf77] text-white rounded-md hover:bg-[#1c7b47] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save username'}
                </button>
              </form>
            </div>

            {/* Password Section - Only show for non-Google users */}
            {!isGoogleUser && (
              <div className="mb-16">
                <h3 className="text-lg font-medium mb-4">Password</h3>
                <p className="text-black text-sm mb-6">Change your password to keep your account secure.</p>
                
                <form onSubmit={handleUpdatePassword} className="max-w-md space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-black mb-1">
                      Current password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        name="currentPassword"
                        id="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="block w-full rounded-md bg-[#e6e6e6] border-gray-700 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showCurrentPassword ? (
                          <FaEyeSlash className="h-5 w-5 text-gray-400" />
                        ) : (
                          <FaEye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        id="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="appearance-none bg-transparent border-b-2 border-gray-400 focus:border-[#1c7b47] w-full text-gray-800 py-2 px-2 leading-tight focus:outline-none"
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showNewPassword ? (
                          <FaEyeSlash className="h-5 w-5 text-gray-400" />
                        ) : (
                          <FaEye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                      Confirm new password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="appearance-none bg-transparent border-b-2 border-gray-400 focus:border-[#1c7b47] w-full text-gray-800 py-2 px-2 leading-tight focus:outline-none"
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash className="h-5 w-5 text-gray-400" />
                        ) : (
                          <FaEye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save new password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Google Account Notice - Show for Google users */}
            {isGoogleUser && (
              <div className="mb-16">
                <h3 className="text-lg font-medium mb-4">Password Management</h3>
                <div className="p-4 bg-[#1c7b47] rounded-md">
                  <p className="text-white">
                    You're signed in with Google. Password management is handled through your Google Account settings.
                  </p>
                </div>
              </div>
            )}

            {/* Logout Button */}
            <div className="mt-16 border-t border-gray-800 pt-8">
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 