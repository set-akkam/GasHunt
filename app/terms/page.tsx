"use client";
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "../animations/variants";
import { useLanguage } from "../providers/LanguageProvider";
import { useEffect, useState } from "react";
import { useAuth } from "../providers/AuthProvider";

interface Translations {
  terms: {
    title: string;
    lastUpdated: string;
    sections: {
      acceptance: {
        title: string;
        content: string;
      };
      userAccounts: {
        title: string;
        content: string;
      };
      userContributions: {
        title: string;
        content: string;
      };
      privacy: {
        title: string;
        content: string;
      };
      modifications: {
        title: string;
        content: string;
      };
    };
    questions: {
      title: string;
      content: string;
      button: string;
    };
  };
}

export default function Terms() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [translations, setTranslations] = useState<Translations | null>(null);

  useEffect(() => {
    // Load translations
    fetch(`/locales/${language}/common.json`)
      .then(res => res.json())
      .then(data => setTranslations(data))
      .catch(err => console.error('Error loading translations:', err));
  }, [language]);

  if (!translations) {
    return null; // Or a loading spinner
  }

  const sections = [
    {
      title: translations.terms.sections.acceptance.title,
      content: translations.terms.sections.acceptance.content
    },
    {
      title: translations.terms.sections.userAccounts.title,
      content: translations.terms.sections.userAccounts.content
    },
    {
      title: translations.terms.sections.userContributions.title,
      content: translations.terms.sections.userContributions.content
    },
    {
      title: translations.terms.sections.privacy.title,
      content: translations.terms.sections.privacy.content
    },
    {
      title: translations.terms.sections.modifications.title,
      content: translations.terms.sections.modifications.content
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e6e6e6] to-white">
      {/* Hero Section */}
      <div className="w-full bg-[#1c7b47] py-12 sm:py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.h1
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-white text-center"
          >
            {translations.terms.title}
          </motion.h1>
          <motion.p
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="text-base sm:text-lg md:text-xl text-gray-300 text-center max-w-3xl mx-auto"
          >
            {translations.terms.lastUpdated}
          </motion.p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-16">
        <motion.div
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <motion.div
            variants={fadeInFromBottom}
            className="bg-white rounded-xl p-6 sm:p-7 md:p-8 shadow-lg space-y-6 sm:space-y-7 md:space-y-8"
          >
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 text-[#1c7b47]">{section.title}</h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </motion.div>

          {/* Contact Section */}
          <motion.div
            variants={fadeInFromBottom}
            className="bg-[#1c7b47] rounded-xl p-6 sm:p-7 md:p-8 text-center mt-8 sm:mt-10 md:mt-12"
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-white">{translations.terms.questions.title}</h2>
            <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-5 md:mb-6">
              {translations.terms.questions.content}
            </p>
            <button 
              onClick={() => {
                const mailtoLink = `mailto:legal@fuel-tracker.com?subject=Terms of Use Inquiry from ${user?.name || 'User'}&body=Hello Legal Team,%0D%0A%0D%0AMy name is ${user?.name || ''} and I have a question about the Terms of Use.%0D%0A%0D%0ASpecific Section (if applicable):%0D%0A-%20%0D%0A%0D%0AMy Question:%0D%0A-%20%0D%0A%0D%0AUser Information:%0D%0AName: ${user?.name || 'Not provided'}%0D%0AEmail: ${user?.email || 'Not provided'}%0D%0A%0D%0AThank you for your assistance.`;
                window.location.href = mailtoLink;
              }}
              className="bg-white text-[#1c7b47] px-6 sm:px-7 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg text-base sm:text-lg font-semibold hover:bg-[#e6e6e6] transition"
            >
              {translations.terms.questions.button}
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 