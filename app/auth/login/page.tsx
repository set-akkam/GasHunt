"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FcGoogle } from 'react-icons/fc';
import { 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaFacebook,
} from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { authApi } from '@/app/services/api';
import Loading from '@/app/components/Loading';
import { signIn } from 'next-auth/react';
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "@/app/animations/variants";
import toast from 'react-hot-toast';

interface LoginResponse {
  _id: string;
  name: string;
  email: string;
  token: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      toast.success(message);
    }
  }, [searchParams]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const isFormValid = () => {
    return validateEmail(formData.email) && formData.password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isFormValid()) {
      const errorMsg = 'Please fill in all fields correctly';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        toast.success('Successfully logged in!');
        const returnUrl = searchParams.get('return_url');
        const redirectPath = returnUrl && returnUrl.startsWith('/') 
          ? returnUrl
          : '/dashboard';
        router.replace(redirectPath);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const returnUrl = searchParams.get('return_url');
      const callbackUrl = returnUrl && returnUrl.startsWith('/') 
        ? returnUrl
        : '/dashboard';
        
      await signIn('google', {
        callbackUrl,
        redirect: true
      });
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#1c7b47]">
      <div className="flex w-full">
        {/* Left Side - Form */}
        <motion.div 
          className="w-full md:w-1/2 bg-white p-10 flex flex-col justify-center rounded-r-3xl shadow-lg"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-md mx-auto w-full">
            <motion.div 
              className="mb-6"
              variants={fadeInFromBottom}
              custom={0}
            >
              <Link href="/" className="text-gray-500">
                <span className="flex items-center">
                  ←
                </span>
              </Link>
            </motion.div>

            <motion.div 
              className="flex justify-between items-center mb-8"
              variants={fadeInFromBottom}
              custom={0.2}
            >
              <h1 className="text-5xl font-bold">Sign In</h1>
              <p className="text-lg text-gray-600 font-bold">
                New user? <Link href="/auth/signup" className="text-[#1c7b47] font-bold text-lg hover:underline">Sign up</Link>
              </p>
            </motion.div>
            
            <motion.p 
              className="text-lg text-gray-500 mb-8"
              variants={fadeInFromBottom}
              custom={0.4}
            >
              👋 Welcome back! Please enter your details
            </motion.p>

            <motion.form 
              onSubmit={handleSubmit}
              variants={fadeInFromBottom}
              custom={0.6}
            >
              {error && (
                <motion.div 
                  className="rounded-md bg-red-50 p-4 mb-6"
                  variants={fadeInFromBottom}
                >
                  <div className="text-sm text-red-700">{error}</div>
                </motion.div>
              )}

              {successMessage && (
                <motion.div 
                  className="rounded-md bg-green-50 p-4 mb-6"
                  variants={fadeInFromBottom}
                >
                  <div className="text-sm text-green-700">{successMessage}</div>
                </motion.div>
              )}

              {/* Email Field */}
              <motion.div 
                className="mb-6 relative"
                variants={fadeInFromBottom}
                custom={0.8}
              >
                <div className={`flex items-center border-b-2 ${
                  touched.email && !validateEmail(formData.email)
                    ? 'border-red-500'
                    : touched.email && validateEmail(formData.email)
                    ? 'border-green-500'
                    : 'border-gray-200'
                } py-2`}>
                  <FaEnvelope className={`${
                    touched.email && !validateEmail(formData.email)
                      ? 'text-red-500'
                      : touched.email && validateEmail(formData.email)
                      ? 'text-green-500'
                      : 'text-gray-400'
                  } mr-3 text-lg`} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    className="appearance-none bg-transparent w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur('email')}
                    required
                  />
                </div>
                {touched.email && !validateEmail(formData.email) && (
                  <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
                )}
              </motion.div>

              {/* Password Field */}
              <motion.div 
                className="mb-6 relative"
                variants={fadeInFromBottom}
                custom={1.0}
              >
                <div className={`flex items-center border-b-2 ${
                  touched.password && formData.password.length < 6
                    ? 'border-red-500'
                    : touched.password && formData.password.length >= 6
                    ? 'border-green-500'
                    : 'border-gray-200'
                } py-2`}>
                  <FaLock className={`${
                    touched.password && formData.password.length < 6
                      ? 'text-red-500'
                      : touched.password && formData.password.length >= 6
                      ? 'text-green-500'
                      : 'text-gray-400'
                  } mr-3 text-lg`} />
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Password"
                      className="appearance-none bg-transparent w-full text-gray-700 pr-10 py-2 leading-tight focus:outline-none"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2"
                    >
                      {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                    </button>
                  </div>
                </div>
                {touched.password && formData.password.length < 6 && (
                  <p className="text-red-500 text-xs mt-1">Password must be at least 6 characters</p>
                )}
              </motion.div>

              <motion.div 
                className="flex justify-end mb-6"
                variants={fadeInFromBottom}
                custom={1.2}
              >
                <Link href="/auth/forgot-password" className="text-sm text-[#1c7b47] font-bold hover:underline">
                  Forgot password?
                </Link>
              </motion.div>

              <motion.div 
                className="flex flex-col md:flex-row items-center justify-between mb-6"
                variants={fadeInFromBottom}
                custom={1.4}
              >
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid()}
                  className={`${
                    isFormValid() 
                      ? 'bg-[#1c7b47] hover:bg-[#155d3a]' 
                      : 'bg-gray-400 cursor-not-allowed'
                  } text-white font-bold py-3 px-12 rounded-full mb-4 md:mb-0 w-full md:w-auto flex items-center justify-center transition duration-200`}
                >
                  {isLoading ? <Loading size="small" /> : 'Sign In'}
                  <span className="ml-2">→</span>
                </button>
                
                <span className="text-lg text-gray-800 mb-4 md:mb-0">Or</span>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    disabled={googleLoading}
                    onClick={handleGoogleSignIn}
                    className="flex items-center bg-white border border-gray-500 rounded-full py-2 px-4 transition duration-200 hover:border-gray-700 disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <Loading size="small" />
                    ) : (
                      <>
                        <FcGoogle className="text-xl mr-2" />
                        <span className="font-bold">Sign in with Google</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.form>
          </div>
        </motion.div>
        
        {/* Right Side - Illustration/Features */}
        <motion.div 
          className="hidden md:flex md:w-1/2 bg-[#1c7b47] rounded-l-3xl justify-center items-center p-8 relative overflow-hidden"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="absolute top-0 right-0 w-full h-full bg-green-400 rounded-bl-[30%]"
            variants={fadeInFromBottom}
            custom={0.2}
          ></motion.div>
          
          <motion.div 
            className="relative z-10"
            variants={fadeInFromBottom}
            custom={0.4}
          >
            <div className="bg-white p-4 rounded-md shadow-md max-w-xs transition-transform duration-300 hover:translate-y-[-10px]">
              <h3 className="font-bold text-[#1c7b47] mb-2">Track Your Fuel Costs 🚗</h3>
              <p className="text-sm text-gray-700">Join thousands of users who save money by tracking their fuel expenses. Get insights, analytics, and smart recommendations for better fuel efficiency.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;