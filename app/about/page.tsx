"use client";
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "../animations/variants";
import { useLanguage } from "../providers/LanguageProvider";
import { useEffect, useState } from "react";

// TypeScript interface defining the structure of translations for the About page
interface Translations {
  about: {
    title: string;
    subtitle: string;
    stats: {
      fuelPriceRise: {
        number: string;
        label: string;
      };
      activeDrivers: {
        number: string;
        label: string;
      };
      fuelStations: {
        number: string;
        label: string;
      };
      fuelVolume: {
        number: string;
        label: string;
      };
    };
    sections: {
      whoWeAre: {
        title: string;
        content: string;
      };
      ourValues: {
        title: string;
        transparency: {
          title: string;
          content: string;
        };
        community: {
          title: string;
          content: string;
        };
        innovation: {
          title: string;
          content: string;
        };
      };
    };
  };
}

// Main About page component
export default function About() {
  // Get current language from context
  const { language } = useLanguage();
  // State to store loaded translations
  const [translations, setTranslations] = useState<Translations | null>(null);

  // Load translations when language changes
  useEffect(() => {
    fetch(`/locales/${language}/common.json`)
      .then(res => res.json())
      .then(data => setTranslations(data))
      .catch(err => console.error('Error loading translations:', err));
  }, [language]);

  // Show nothing while translations are loading
  if (!translations) {
    return null;
  }

  // Prepare stats data for rendering
  const stats = [
    translations.about.stats.fuelPriceRise,
    translations.about.stats.activeDrivers,
    translations.about.stats.fuelStations,
    translations.about.stats.fuelVolume
  ];

  // Prepare values data for rendering
  const values = [
    {
      title: translations.about.sections.ourValues.transparency.title,
      description: translations.about.sections.ourValues.transparency.content
    },
    {
      title: translations.about.sections.ourValues.community.title,
      description: translations.about.sections.ourValues.community.content
    },
    {
      title: translations.about.sections.ourValues.innovation.title,
      description: translations.about.sections.ourValues.innovation.content
    }
  ];

  return (
    // Main container with gradient background
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section with animated title and subtitle */}
      <div className="w-full bg-green-700 py-12 sm:py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.h1
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 sm:mb-5 md:mb-6 text-white text-center"
          >
            {translations.about.title}
          </motion.h1>
          <motion.p
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="text-base sm:text-lg md:text-xl text-white/90 text-center max-w-3xl mx-auto"
          >
            {translations.about.subtitle}
          </motion.p>
        </div>
      </div>

      {/* Stats Section with animated cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 -mt-8 sm:-mt-10 md:-mt-12">
        <motion.div
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={fadeInFromBottom}
              custom={index * 0.1}
              className="text-center"
            >
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-700 mb-1 sm:mb-2">{stat.number}</div>
              <div className="text-sm sm:text-base md:text-lg text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Main Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-16">
        {/* Who We Are Section */}
        <motion.div
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="mb-10 sm:mb-12 md:mb-16"
        >
          <motion.h2
            variants={fadeInFromBottom}
            custom={0.8}
            className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-5 md:mb-6 text-center text-green-900"
          >
            {translations.about.sections.whoWeAre.title}
          </motion.h2>
          <motion.p
            variants={fadeInFromBottom}
            custom={1}
            className="text-base sm:text-lg md:text-xl text-gray-700 text-center max-w-4xl mx-auto"
          >
            {translations.about.sections.whoWeAre.content}
          </motion.p>
        </motion.div>

        {/* Values Section with animated cards */}
        <motion.div
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <motion.h2
            variants={fadeInFromBottom}
            custom={1.2}
            className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-7 md:mb-8 text-center text-green-900"
          >
            {translations.about.sections.ourValues.title}
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                variants={fadeInFromBottom}
                custom={1.4 + index * 0.2}
                className="bg-white rounded-xl p-4 sm:p-6 md:p-8 shadow-lg hover:shadow-xl transition duration-300"
              >
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 text-green-800">{value.title}</h3>
                <p className="text-base sm:text-lg text-gray-700">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
} 