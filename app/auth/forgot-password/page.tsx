/**
 * ForgotPassword Component
 * 
 * A page component that handles the password reset request flow.
 * Users can enter their email to receive password reset instructions.
 * Features responsive design, animations, and error handling.
 */

"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaEnvelope } from 'react-icons/fa';
import { authApi } from '@/app/services/api';
import Loading from '@/app/components/Loading';
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "@/app/animations/variants";
import toast from 'react-hot-toast';

const ForgotPassword: React.FC = () => {
  // State management for form handling and UI feedback
  const [email, setEmail] = useState(''); // User's email input
  const [error, setError] = useState(''); // Error message state
  const [success, setSuccess] = useState(false); // Success state for form submission
  const [isLoading, setIsLoading] = useState(false); // Loading state during API calls

  /**
   * Handles form submission for password reset request
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setSuccess(true);
      toast.success('Password reset instructions have been sent to your email.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
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
        {/* Left Section - Password Reset Form */}
        <motion.div 
          className="w-full md:w-1/2 bg-white p-10 flex flex-col justify-center rounded-r-3xl shadow-lg"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-md mx-auto w-full">
            {/* Back button to login page */}
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
              <h1 className="text-5xl font-bold">Reset Password</h1>
            </motion.div>
            
            {/* Instructions text */}
            <motion.p 
              className="text-lg text-gray-500 mb-8"
              variants={fadeInFromBottom}
              custom={0.4}
            >
              Enter your email address and we'll send you a link to reset your password.
            </motion.p>

            {/* Password reset form */}
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

              {/* Success message display */}
              {success && (
                <motion.div 
                  className="rounded-md bg-green-50 p-4 mb-6"
                  variants={fadeInFromBottom}
                >
                  <div className="text-sm text-green-700">
                    Reset password link has been sent to your email address. Please check your inbox.
                  </div>
                </motion.div>
              )}

              {/* Email input field */}
              <motion.div 
                className="mb-6 relative"
                variants={fadeInFromBottom}
                custom={0.8}
              >
                <div className="flex items-center border-b-2 border-gray-200 py-2">
                  <FaEnvelope className="text-gray-400 mr-3 text-lg" />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    className="appearance-none bg-transparent border-b-2 border-gray-200 focus:border-[#1c7b47] w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </motion.div>

              {/* Submit button */}
              <motion.div 
                className="flex flex-col md:flex-row items-center justify-between mb-6"
                variants={fadeInFromBottom}
                custom={1.0}
              >
                <button
                  type="submit"
                  disabled={isLoading || success}
                  className="bg-[#1c7b47] hover:bg-[#155d3a] text-white font-bold py-3 px-12 rounded-full mb-4 md:mb-0 w-full md:w-auto flex items-center justify-center transition duration-200"
                >
                  {isLoading ? (
                    <Loading size="small" />
                  ) : (
                    'Send Reset Link'
                  )}
                  <span className="ml-2">→</span>
                </button>
              </motion.div>
            </motion.form>
          </div>
        </motion.div>
        
        {/* Right Section - Visual Elements */}
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
                <h3 className="text-lg font-bold mb-2">Password Recovery</h3>
                <p className="text-sm text-gray-700">We'll help you get back into your account safely and securely.</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword; 