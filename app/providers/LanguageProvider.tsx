/**
 * Language Provider Component
 * Manages the application's internationalization state and provides
 * language selection functionality throughout the application.
 * Features:
 * - Persists language preference in localStorage
 * - Detects and uses browser language as fallback
 * - Supports English, Spanish, French, German, and Dutch
 */
"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Supported language codes
 * Restricted to specific set of languages to ensure translation availability
 */
type Language = 'en' | 'es' | 'fr' | 'de' | 'nl';

/**
 * Language context interface defining available language operations
 */
interface LanguageContextType {
  language: Language;          // Current active language
  setLanguage: (lang: Language) => void;  // Function to change the active language
}

// Create the language context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * LanguageProvider component that manages language state and preferences
 * Wraps the application to provide language context to all child components
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Initialize language preference on component mount
  useEffect(() => {
    // Try to load saved language preference
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    } else {
      // Fall back to browser language if supported
      const browserLang = navigator.language.split('-')[0] as Language;
      if (['en', 'es', 'fr', 'de', 'nl'].includes(browserLang)) {
        setLanguage(browserLang);
      }
      // Defaults to 'en' if browser language is not supported
    }
  }, []);

  /**
   * Updates the active language and persists the choice
   * Also updates the document's lang attribute for accessibility
   */
  const handleSetLanguage = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Custom hook to access language context
 * Provides easy access to current language and language switching functionality
 * Must be used within a LanguageProvider component
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 