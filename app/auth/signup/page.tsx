"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FcGoogle } from 'react-icons/fc';
import { 
  FaUser, 
  FaEnvelope, 
  FaLock, 
  FaRedoAlt,
  FaEye, 
  FaEyeSlash,
} from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { authApi } from '@/app/services/api';
import Loading from '@/app/components/Loading';
import { signIn } from 'next-auth/react';
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "@/app/animations/variants";
import toast from 'react-hot-toast';

/**
 * Interface for the API response after successful signup
 * Contains user details and authentication token
 */
interface SignupResponse {
  _id: string;
  name: string;
  email: string;
  token: string;
}

const SignUp: React.FC = () => {
  // State for password visibility toggle
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State for password validation rules
  const [passwordValid, setPasswordValid] = useState({
    length: false,    // Minimum 8 characters
    number: false,    // Contains at least one number
    lowercase: false, // Contains at least one lowercase letter
    uppercase: false, // Contains at least one uppercase letter
  });
  
  // State for form validation and submission
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [googleLoading, setGoogleLoading] = useState(false);

  const router = useRouter();
  const auth = useAuth();

  /**
   * Validates email format using regex
   * @param email - Email string to validate
   * @returns boolean indicating if email is valid
   */
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  /**
   * Marks a form field as touched when it loses focus
   * Used to show validation errors only after user interaction
   */
  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  /**
   * Checks if all form fields meet validation requirements
   * @returns boolean indicating if form is valid
   */
  const isFormValid = () => {
    return (
      formData.name.length >= 2 && // Name must be at least 2 characters
      validateEmail(formData.email) && // Email must be valid format
      Object.values(passwordValid).every(Boolean) && // All password rules must be met
      formData.password === formData.confirmPassword // Passwords must match
    );
  };

  /**
   * Handles form field changes and updates validation state
   * For password field, checks against all validation rules
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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
   * Validates form data and makes API call to register user
   * Shows success/error messages using toast notifications
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      return;
    }

    // Validate password requirements
    if (!Object.values(passwordValid).every(Boolean)) {
      const errorMsg = 'Please meet all password requirements';
      setError(errorMsg);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register(
        formData.name,
        formData.email,
        formData.password
      );
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data) {
        toast.success('Registration successful');
        router.push('/auth/login');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles Google OAuth sign-in
   * Uses NextAuth.js for authentication
   * Shows loading state and error messages
   */
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setError('');
      const result = await signIn('google', { 
        redirect: false
      });
      
      if (result?.error) {
        setError('Failed to sign in with Google');
        toast.error('Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to sign in with Google');
      toast.error('Failed to sign in with Google');
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
              <h1 className="text-5xl font-bold">Sign Up</h1>
              <p className="text-lg text-gray-600 font-bold">
                Already member? <Link href="/auth/login" className="text-[#1c7b47] font-bold text-lg hover:underline">Sign in</Link>
              </p>
            </motion.div>
            
            <motion.p 
              className="text-lg text-gray-500 mb-8"
              variants={fadeInFromBottom}
              custom={0.4}
            >
              📍 GasHunt – Real-Time Fuel Prices at Your Fingertips
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

              {/* Name Field with validation feedback */}
              <motion.div 
                className="mb-6 relative"
                variants={fadeInFromBottom}
                custom={0.8}
              >
                <div className={`flex items-center border-b-2 ${
                  touched.name && formData.name.length < 2 
                    ? 'border-red-500' 
                    : touched.name && formData.name.length >= 2 
                    ? 'border-green-500' 
                    : 'border-gray-200'
                } py-2`}>
                  <FaUser className={`${
                    touched.name && formData.name.length < 2 
                      ? 'text-red-500' 
                      : touched.name && formData.name.length >= 2 
                      ? 'text-green-500' 
                      : 'text-gray-400'
                  } mr-3 text-lg`} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Username"
                    className="appearance-none bg-transparent w-full text-gray-700 py-2 px-2 leading-tight focus:outline-none"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    required
                  />
                </div>
                {touched.name && formData.name.length < 2 && (
                  <p className="text-red-500 text-xs mt-1">Name must be at least 2 characters long</p>
                )}
              </motion.div>

              {/* Email Field */}
              <motion.div 
                className="mb-6 relative"
                variants={fadeInFromBottom}
                custom={1.0}
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
                custom={1.2}
              >
                <div className={`flex items-center border-b-2 ${
                  touched.password && !Object.values(passwordValid).every(Boolean)
                    ? 'border-red-500'
                    : touched.password && Object.values(passwordValid).every(Boolean)
                    ? 'border-green-500'
                    : 'border-gray-200'
                } py-2`}>
                  <FaLock className={`${
                    touched.password && !Object.values(passwordValid).every(Boolean)
                      ? 'text-red-500'
                      : touched.password && Object.values(passwordValid).every(Boolean)
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
              </motion.div>

              {/* Password Requirements */}
              <motion.div 
                className="mb-6 text-xs text-gray-500"
                variants={fadeInFromBottom}
                custom={1.4}
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

              {/* Confirm Password Field */}
              <motion.div 
                className="mb-6 relative"
                variants={fadeInFromBottom}
                custom={1.6}
              >
                <div className={`flex items-center border-b-2 ${
                  touched.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'border-red-500'
                    : touched.confirmPassword && formData.password === formData.confirmPassword
                    ? 'border-green-500'
                    : 'border-gray-200'
                } py-2`}>
                  <FaRedoAlt className={`${
                    touched.confirmPassword && formData.password !== formData.confirmPassword
                      ? 'text-red-500'
                      : touched.confirmPassword && formData.password === formData.confirmPassword
                      ? 'text-green-500'
                      : 'text-gray-400'
                  } mr-3 text-lg`} />
                  <div className="relative flex-1">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Re-Type Password"
                      className="appearance-none bg-transparent w-full text-gray-700 pr-10 py-2 leading-tight focus:outline-none"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={() => handleBlur('confirmPassword')}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-2"
                    >
                      {showConfirmPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                    </button>
                  </div>
                </div>
                {touched.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
                )}
              </motion.div>

              <motion.div 
                className="flex flex-col md:flex-row items-center justify-between mb-6"
                variants={fadeInFromBottom}
                custom={1.8}
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
                  {isLoading ? <Loading size="small" /> : 'Sign Up'}
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
              <h3 className="font-bold text-[#1c7b47] mb-2">Start Saving Today! 🌟</h3>
              <p className="text-sm text-gray-700">Create your account and join our community of smart drivers. Compare prices, track expenses, and make informed decisions about your fuel purchases.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignUp;