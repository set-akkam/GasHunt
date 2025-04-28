/**
 * Root layout component for the Fuel Price Tracker application.
 * This is the top-level component that wraps all pages and provides
 * global context providers and styling.
 */
'use client';

// Import fonts and global styles
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";

// Import context providers
import { AuthProvider } from "./providers/AuthProvider";
import { LanguageProvider } from "./providers/LanguageProvider";
import { OnboardingProvider } from "./providers/OnboardingProvider";

// Import layout components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { SessionProvider } from "next-auth/react";
import { Toaster } from 'react-hot-toast';

// Configure Poppins font with specific weights
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/**
 * RootLayout component that provides the basic structure for all pages
 * Includes:
 * - Font configuration
 * - Authentication context
 * - Language settings
 * - Onboarding state
 * - Navigation and footer
 * - Toast notifications
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${poppins.className} antialiased`}
      >
        {/* Authentication and user session management */}
        <SessionProvider>
          {/* User authentication state and methods */}
          <AuthProvider>
            {/* Language localization settings */}
            <LanguageProvider>
              {/* User onboarding flow state */}
              <OnboardingProvider>
                <Navbar />
                <main>{children}</main>
                <Footer />
              </OnboardingProvider>
            </LanguageProvider>
          </AuthProvider>
        </SessionProvider>
        {/* Toast notifications configuration */}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
