/**
 * Footer Component
 * Provides the main footer section for the application with navigation links,
 * language selection, and branding information.
 * Features a responsive grid layout and internationalization support.
 */
"use client";
import Link from "next/link";
import { FaTwitter, FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { useLanguage } from "../providers/LanguageProvider";
import { useEffect, useState } from "react";

/**
 * Interface for footer-related translation strings
 * Includes branding and various section headings
 */
interface Translations {
  brand: {
    name: string;
    slogan: string;
  };
  footer: {
    selectLanguage: string;
    support: string;
    helpCenter: string;
    map: string;
    liveMap: string;
    mapInfo: string;
    about: string;
    aboutUs: string;
    copyright: string;
    termsOfUse: string;
    privacyPolicy: string;
    copyrightNotice: string;
  };
}

export default function Footer() {
  const { language, setLanguage } = useLanguage();
  const [translations, setTranslations] = useState<Translations | null>(null);

  // Load translations when language changes
  useEffect(() => {
    fetch(`/locales/${language}/common.json`)
      .then(res => res.json())
      .then(data => setTranslations(data))
      .catch(err => console.error('Error loading translations:', err));
  }, [language]);

  // Wait for translations to load
  if (!translations) {
    return null; // Or a loading spinner
  }

  return (
    <footer className="bg-white border-t border-gray-300">
      <div className="px-8 sm:px-12 lg:px-20 py-16 mx-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Branding Section */}
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">{translations.brand.name}</h2>
            <p className="text-lg text-gray-700 mt-2 font-medium">
              {translations.brand.slogan}
            </p>

            {/* Language Selection Dropdown */}
            <div className="mt-8">
              <label htmlFor="language" className="text-lg font-semibold text-gray-900">
                {translations.footer.selectLanguage}
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="w-full mt-2 p-2 bg-transparent border-b border-gray-800 text-lg text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="nl">Nederlands</option>
              </select>
            </div>
          </div>

          {/* Support Links Section */}
          <div>
            <h3 className="text-lg font-extrabold uppercase text-gray-900 tracking-wide mb-6">
              {translations.footer.support}
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/help-center" className="text-lg text-gray-800 hover:text-gray-900 font-semibold transition fade-underline">
                  {translations.footer.helpCenter}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-lg text-gray-800 hover:text-gray-900 font-semibold transition fade-underline">
                  {translations.footer.termsOfUse}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-lg text-gray-800 hover:text-gray-900 font-semibold transition fade-underline">
                  {translations.footer.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link href="/copyright" className="text-lg text-gray-800 hover:text-gray-900 font-semibold transition fade-underline">
                  {translations.footer.copyrightNotice}
                </Link>
              </li>
            </ul>
          </div>

          {/* Map Features Section */}
          <div>
            <h3 className="text-lg font-extrabold uppercase text-gray-900 tracking-wide mb-6">
              {translations.footer.map}
            </h3>
            <ul className="space-y-4">
              <li>
                <Link 
                  href="/map" 
                  className="text-lg text-gray-800 hover:text-gray-900 font-semibold transition fade-underline"
                >
                  {translations.footer.liveMap}
                </Link>
              </li>
              <li>
                <Link 
                  href="/map-info" 
                  className="text-lg text-gray-800 hover:text-gray-900 font-semibold transition fade-underline"
                >
                  {translations.footer.mapInfo}
                </Link>
              </li>
            </ul>
          </div>

          {/* About Section */}
          <div>
            <h3 className="text-lg font-extrabold uppercase text-gray-900 tracking-wide mb-6">
              {translations.footer.about}
            </h3>
            <ul className="space-y-4">
              <li>
                <Link href="/learn-more" className="text-lg text-gray-800 hover:text-gray-900 font-semibold transition fade-underline">
                  {translations.footer.aboutUs}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
