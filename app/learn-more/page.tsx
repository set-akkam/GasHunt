"use client";
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "../animations/variants";
import { useLanguage } from "../providers/LanguageProvider";
import { useEffect, useState } from "react";
import { useAuth } from '../providers/AuthProvider';

interface Translations {
  learnMore: {
    title: string;
    subtitle: string;
    mission: {
      title: string;
      content: string;
    };
    howItWorks: {
      title: string;
      content: string;
    };
    features: {
      title: string;
      realTimeUpdates: {
        title: string;
        content: string;
      };
      interactiveMap: {
        title: string;
        content: string;
      };
      personalDashboard: {
        title: string;
        content: string;
      };
    };
    cta: {
      title: string;
      button: string;
    };
  };
}

export default function LearnMore() {
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

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Full width colored background */}
      <div className="w-full bg-[#2ecf77] py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.h1
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.5rem] font-bold mb-3 sm:mb-4 text-black"
          >
            {translations.learnMore.title}
          </motion.h1>
          <motion.p
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="text-base sm:text-lg md:text-xl lg:text-[1.5rem] text-black/80 max-w-3xl"
          >
            {translations.learnMore.subtitle}
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-16">
        {/* Mission Section - Clean text */}
        <motion.div
          className="mb-10 sm:mb-12 md:mb-16"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            variants={fadeInFromBottom}
            custom={0.4}
            className="text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem] font-bold mb-4 sm:mb-5 md:mb-6 text-black"
          >
            {translations.learnMore.mission.title}
          </motion.h2>
          <motion.p
            variants={fadeInFromBottom}
            custom={0.6}
            className="text-base sm:text-lg md:text-xl lg:text-[1.25rem] text-black/80 max-w-4xl leading-relaxed"
          >
            {translations.learnMore.mission.content}
          </motion.p>
        </motion.div>

        {/* How It Works - Boxed section */}
        <motion.div
          className="bg-[#e6e6e6] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 mb-10 sm:mb-12 md:mb-16"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            variants={fadeInFromBottom}
            custom={0.8}
            className="text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem] font-bold mb-3 sm:mb-4 text-black"
          >
            {translations.learnMore.howItWorks.title}
          </motion.h2>
          <motion.p
            variants={fadeInFromBottom}
            custom={1}
            className="text-base sm:text-lg md:text-xl lg:text-[1.25rem] text-black/80"
          >
            {translations.learnMore.howItWorks.content}
          </motion.p>
        </motion.div>

        {/* Features Section - Boxed with cards */}
        <motion.div
          className="bg-[#1c7b47] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 mb-10 sm:mb-12 md:mb-16"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            variants={fadeInFromBottom}
            custom={1.2}
            className="text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem] font-bold mb-4 sm:mb-5 md:mb-6 text-white"
          >
            {translations.learnMore.features.title}
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <motion.div
              variants={fadeInFromBottom}
              custom={1.4}
              className="bg-white/10 rounded-xl p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-[1.5rem] font-bold mb-2 text-white">
                {translations.learnMore.features.realTimeUpdates.title}
              </h3>
              <p className="text-white/90 text-sm sm:text-base md:text-lg">
                {translations.learnMore.features.realTimeUpdates.content}
              </p>
            </motion.div>
            <motion.div
              variants={fadeInFromBottom}
              custom={1.6}
              className="bg-white/10 rounded-xl p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-[1.5rem] font-bold mb-2 text-white">
                {translations.learnMore.features.interactiveMap.title}
              </h3>
              <p className="text-white/90 text-sm sm:text-base md:text-lg">
                {translations.learnMore.features.interactiveMap.content}
              </p>
            </motion.div>
            <motion.div
              variants={fadeInFromBottom}
              custom={1.8}
              className="bg-white/10 rounded-xl p-4 sm:p-6"
            >
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-[1.5rem] font-bold mb-2 text-white">
                {translations.learnMore.features.personalDashboard.title}
              </h3>
              <p className="text-white/90 text-sm sm:text-base md:text-lg">
                {translations.learnMore.features.personalDashboard.content}
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Community Impact - Clean text */}
        <motion.div
          className="bg-[#57d992] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 text-center"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            variants={fadeInFromBottom}
            custom={2.4}
            className="text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold mb-3 sm:mb-4 text-black"
          >
            {translations.learnMore.cta.title}
          </motion.h2>
          <motion.div
            variants={fadeInFromBottom}
            custom={2.6}
            className="button-container"
          >
            <div className="button">
              <a href="/auth/signup" className="button-link">
                {user ? 'Let\'s Get Started!' : `${translations.learnMore.cta.button}!`}
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 