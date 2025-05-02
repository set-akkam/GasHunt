"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import { FaLock, FaEye, FaEyeSlash, FaRedoAlt } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { authApi } from '@/app/services/api';
import Loading from '@/app/components/Loading';
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "@/app/animations/variants";
import toast from 'react-hot-toast';

/**
 * ResetPassword Component
 * Handles the password reset process after a user clicks on a reset password link
 * Features:
 * - Password validation with requirements
 * - Password visibility toggle
 * - Form submission with API integration
 * - Error handling and user feedback
 * - Animated UI elements
 */
const ResetPassword: React.FC = () => {
  // Router for navigation
  const router = useRouter();
  
  // State management
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [error, setError] = useState(''); // Store error messages
  const [isLoading, setIsLoading] = useState(false); // Loading state for form submission
  
  // Password validation state
  const [passwordValid, setPasswordValid] = useState({
    length: false, // Minimum 8 characters
    number: false, // Contains number
    lowercase: false, // Contains lowercase
    uppercase: false, // Contains uppercase
  });

  // Form data state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  /**
   * Handles input changes and validates password requirements
   * @param e - Input change event
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate password requirements when password field changes
    if (name === 'password') {
      setPasswordValid({
        length: value.length >= 8,
        number: /[0-9]/.test(value),
        lowercase: /[a-z]/.test(value),
        uppercase: /[A-Z]/.test(value),
      });
    }
  };

  /**
   * Handles form submission
   * Validates passwords match and requirements are met
   * Makes API call to reset password
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    // Validate all password requirements are met
    if (!Object.values(passwordValid).every(Boolean)) {
      const errorMsg = 'Please meet all password requirements';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);

    try {
      // Extract token from URL
      const token = window.location.pathname.split('/').pop() || '';
      const response = await authApi.resetPassword(token, formData.password);
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Show success message and redirect to login
      toast.success('Password reset successful! Please login with your new password.');
      router.push('/auth/login?reset=success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Main container with green background
    <div className="flex min-h-screen bg-[#1c7b47]">
      <div className="flex w-full">
        {/* Left Side - Form Section */}
        <motion.div 
          className="w-full md:w-1/2 bg-white p-10 flex flex-col justify-center rounded-r-3xl shadow-lg"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-md mx-auto w-full">
            {/* Back button */}
            <motion.div 
              className="mb-6"
              variants={fadeInFromBottom}
              custom={0}
            >
              <Link href="/auth/login" className="text-gray-500">
                <span className="flex items-center">
                  ←
                </span>
              </Link>
            </motion.div>

            {/* Page title */}
            <motion.div 
              className="mb-8"
              variants={fadeInFromBottom}
              custom={0.2}
            >
              <h1 className="text-5xl font-bold">New Password</h1>
            </motion.div>
            
            {/* Instructions */}
            <motion.p 
              className="text-lg text-gray-500 mb-8"
              variants={fadeInFromBottom}
              custom={0.4}
            >
              Please enter your new password below
            </motion.p>

            {/* Main form */}
            <motion.form 
              onSubmit={handleSubmit}
              variants={fadeInFromBottom}
              custom={0.6}
            >
              {/* Error message display */}
              {error && (
                <motion.div 
                  className="rounded-md bg-red-50 p-4 mb-6"
                  variants={fadeInFromBottom}
                >
                  <div className="text-sm text-red-700">{error}</div>
                </motion.div>
              )}

              {/* Password input field with visibility toggle */}
              <motion.div 
                className="mb-6 relative"
                variants={fadeInFromBottom}
                custom={0.8}
              >
                <div className="flex items-center border-b-2 border-gray-200 py-2">
                  <FaLock className="text-gray-400 mr-3 text-lg" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="New Password"
                    className="appearance-none bg-transparent border-b-2 border-gray-200 focus:border-[#1c7b47] w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 h-full flex items-center px-2"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </motion.div>

              {/* Password requirements checklist */}
              <motion.div 
                className="mb-6 text-xs text-gray-500"
                variants={fadeInFromBottom}
                custom={1.0}
              >
                <div className={`flex items-center mb-1 ${passwordValid.length ? 'text-green-500' : ''}`}>
                  <span className="mr-2">{passwordValid.length ? '✓' : '•'}</span>
                  <p>Least 8 characters</p>
                </div>
                <div className={`flex items-center mb-1 ${passwordValid.number ? 'text-green-500' : ''}`}>
                  <span className="mr-2">{passwordValid.number ? '✓' : '•'}</span>
                  <p>Least one number (0-9) or a symbol</p>
                </div>
                <div className={`flex items-center ${passwordValid.lowercase && passwordValid.uppercase ? 'text-green-500' : ''}`}>
                  <span className="mr-2">{passwordValid.lowercase && passwordValid.uppercase ? '✓' : '•'}</span>
                  <p>Lowercase (a-z) and uppercase (A-Z)</p>
                </div>
              </motion.div>

              {/* Confirm password input field */}
              <motion.div 
                className="mb-6 relative"
                variants={fadeInFromBottom}
                custom={1.2}
              >
                <div className="flex items-center border-b-2 border-gray-200 py-2">
                  <FaRedoAlt className="text-gray-400 mr-3 text-lg" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Re-Type Password"
                    className="appearance-none bg-transparent border-b-2 border-gray-200 focus:border-[#1c7b47] w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </motion.div>

              {/* Submit button */}
              <motion.div 
                className="flex flex-col md:flex-row items-center justify-between mb-6"
                variants={fadeInFromBottom}
                custom={1.4}
              >
                <button
                  type="submit"
                  disabled={isLoading || !Object.values(passwordValid).every(Boolean) || formData.password !== formData.confirmPassword}
                  className="bg-[#1c7b47] hover:bg-[#155d3a] text-white font-bold py-3 px-12 rounded-full mb-4 md:mb-0 w-full md:w-auto flex items-center justify-center transition duration-200"
                >
                  {isLoading ? <Loading size="small" /> : 'Reset Password'}
                  <span className="ml-2">→</span>
                </button>
              </motion.div>
            </motion.form>
          </div>
        </motion.div>
        
        {/* Right Side - Illustration Section */}
        <motion.div 
          className="hidden md:flex md:w-1/2 bg-[#1c7b47] rounded-l-3xl justify-center items-center p-8 relative overflow-hidden"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Decorative background element */}
          <motion.div 
            className="absolute top-0 right-0 w-full h-full bg-green-400 rounded-bl-[30%]"
            variants={fadeInFromBottom}
            custom={0.2}
          ></motion.div>
          
          {/* Feature card */}
          <motion.div 
            className="relative z-10"
            variants={fadeInFromBottom}
            custom={0.4}
          >
            <div className="bg-white p-4 rounded-md shadow-md max-w-xs transition-transform duration-300 hover:translate-y-[-10px]">
              <div className="mb-4">
                <h3 className="text-lg font-bold mb-2">Create New Password</h3>
                <p className="text-sm text-gray-700">Choose a strong password to keep your account secure.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword; 