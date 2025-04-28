/**
 * Navbar Component
 * Main navigation component that appears at the top of every page.
 * Features responsive design, user authentication state handling,
 * and internationalization support.
 */
"use client";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import Image from 'next/image';
import { motion } from "framer-motion";
import { fadeInFromTop, staggerContainer } from "../animations/variants";

/**
 * Interface for navigation-related translation strings
 */
interface Translations {
  brand: {
    name: string;
  };
  nav: {
    leaderboard: string;
    nearbyStations: string;
    dashboard: string;
    liveMap: string;
    login: string;
    settings: string;
    logout: string;
  };
}

/**
 * Generates a random color class for UI elements
 * Used for visual variety in the interface
 */
const getRandomColor = () => {
  const colors = ["ring-[#25a55f]", "ring-[#2ecf77]", "ring-[#1c7b47]", "ring-[#e6e6e6]", "ring-[#57d992]"];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Navbar component that handles navigation and user interaction
 * Features:
 * - Responsive design with mobile menu
 * - User authentication state
 * - Dropdown profile menu
 * - Internationalization
 * - Animated transitions
 */
const Navbar = () => {
  // State management
  const [ringColor, setRingColor] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [translations, setTranslations] = useState<Translations | null>(null);

  // Hooks and refs
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  // Load translations when language changes
  useEffect(() => {
    fetch(`/locales/${language}/common.json`)
      .then(res => res.json())
      .then(data => setTranslations(data))
      .catch(err => console.error('Error loading translations:', err));
  }, [language]);

  // Set random color for UI elements on initial render
  useEffect(() => {
    setRingColor(getRandomColor());
  }, []); // Runs once when the user logs in

  // Handle clicking outside of profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle profile dropdown visibility
  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Wait for translations to load
  if (!translations) {
    return null; // Or a loading spinner
  }

  return (
    <nav className="bg-white shadow-lg w-full">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between h-16 w-full">
          {/* Left Section - Logo and Navigation Links */}
          <div className="flex items-center space-x-4 sm:space-x-8">
            {/* Logo and Brand Name */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <motion.div 
                className="flex-shrink-0"
                variants={fadeInFromTop}
                initial="hidden"
                animate="visible"
                custom={0}
              >
                <Link href="/landing">
                  <Image
                    src="/logo.jpg"
                    alt={translations.brand.name}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                    priority
                  />
                </Link>
              </motion.div>
              <motion.h1 
                className="text-xl font-bold cursor-pointer"
                variants={fadeInFromTop}
                initial="hidden"
                animate="visible"
                custom={0.2}
              >
                <Link href="/landing">
                  {translations.brand.name}
                </Link>
              </motion.h1>
            </div>
            {/* Desktop Navigation Links */}
            <motion.div 
              className="hidden lg:flex lg:items-center lg:space-x-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeInFromTop} custom={0.6}>
                <Link href="/leaderboard" className="animated-underline nav-link">
                  {translations.nav.leaderboard}
                </Link>
              </motion.div>
              <motion.div variants={fadeInFromTop} custom={0.7}>
                <Link href="/nearby" className="animated-underline nav-link">
                  {translations.nav.nearbyStations}
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Section - User Actions */}
          <div className="flex items-center space-x-6 sm:space-x-4">
            {/* Dashboard Link - Only visible when logged in */}
            {user && (
              <motion.div
                variants={fadeInFromTop}
                initial="hidden"
                animate="visible"
                custom={0.8}
                className="hidden lg:block"
              >
                <Link
                  href="/dashboard"
                  className="animated-underline nav-link"
                >
                  {translations.nav.dashboard}
                </Link>
              </motion.div>
            )}
            {/* Live Map Link */}
            <motion.div
              variants={fadeInFromTop}
              initial="hidden"
              animate="visible"
              custom={0.8}
              className="hidden lg:block"
            >
              <Link
                href="/map"
                className="animated-underline nav-link"
              >
                {translations.nav.liveMap}
              </Link>
            </motion.div>

            {/* Mobile Menu Button */}
            <motion.div
              variants={fadeInFromTop}
              initial="hidden"
              animate="visible"
              custom={1.0}
              className="lg:hidden flex items-center"
            >
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </motion.div>

            {/* User Profile Section */}
            {user ? (
              <motion.div 
                className="relative"
                ref={dropdownRef}
                variants={fadeInFromTop}
                initial="hidden"
                animate="visible"
                custom={1.0}
              >
                <button
                  onClick={toggleProfile}
                  className="flex items-center space-x-3 focus:outline-none relative z-50"
                >
                  <div className={`h-8 w-8 rounded-full overflow-hidden ring-2 ${ringColor}`}>
                    <img
                      src={user.avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </button>
              
                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-xl py-2 z-[9999] ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {translations.nav.settings}
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {translations.nav.logout}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                variants={fadeInFromTop}
                initial="hidden"
                animate="visible"
                custom={1.0}
                className="hidden lg:block"
              >
                <Link
                  href="/auth/login"
                  className="animated-underline nav-link"
                >
                  {translations.nav.login}
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween' }}
            className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col space-y-4">
              {user && (
                <Link
                  href="/dashboard"
                  className="animated-underline nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {translations.nav.dashboard}
                </Link>
              )}
              <Link
                href="/leaderboard"
                className="animated-underline nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {translations.nav.leaderboard}
              </Link>
              <Link
                href="/nearby"
                className="animated-underline nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {translations.nav.nearbyStations}
              </Link>
              <Link
                href="/map"
                className="animated-underline nav-link"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {translations.nav.liveMap}
              </Link>
              
              {!user && (
                <Link
                  href="/auth/login"
                  className="animated-underline nav-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {translations.nav.login}
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;