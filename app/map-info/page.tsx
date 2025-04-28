"use client";
import { motion } from "framer-motion";
import { fadeInFromBottom, landingStaggerContainer } from "../animations/variants";
import Image from "next/image";
import { useLanguage } from "../providers/LanguageProvider";
import { useEffect, useState } from "react";

interface Translations {
  mapInfo: {
    title: string;
    subtitle: string;
    features: {
      realTimeUpdates: {
        title: string;
        description: string;
      };
      priceHistory: {
        title: string;
        description: string;
      };
      stationDetails: {
        title: string;
        description: string;
      };
      priceAlerts: {
        title: string;
        description: string;
      };
    };
    howToUse: {
      title: string;
      steps: {
        step1: {
          title: string;
          description: string;
        };
        step2: {
          title: string;
          description: string;
        };
        step3: {
          title: string;
          description: string;
        };
      };
    };
  };
}

export default function MapInfo() {
  const { language } = useLanguage();
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

  const features = [
    {
      title: translations.mapInfo.features.realTimeUpdates.title,
      description: translations.mapInfo.features.realTimeUpdates.description
    },
    {
      title: translations.mapInfo.features.priceHistory.title,
      description: translations.mapInfo.features.priceHistory.description
    },
    {
      title: translations.mapInfo.features.stationDetails.title,
      description: translations.mapInfo.features.stationDetails.description
    },
    {
      title: translations.mapInfo.features.priceAlerts.title,
      description: translations.mapInfo.features.priceAlerts.description
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e6e6e6] to-white">
      {/* Hero Section */}
      <div className="w-full bg-[#1c7b47] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h1
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0}
            className="text-4xl md:text-5xl font-bold mb-4 text-white text-center"
          >
            {translations.mapInfo.title}
          </motion.h1>
          <motion.p
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="text-xl text-white/90 text-center max-w-3xl mx-auto"
          >
            {translations.mapInfo.subtitle}
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Features Grid */}
        <motion.div
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={fadeInFromBottom}
              custom={index * 0.2}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition duration-300"
            >
              <h3 className="text-2xl font-bold mb-4 text-[#1c7b47]">{feature.title}</h3>
              <p className="text-gray-700 text-lg">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How to Use Section */}
        <motion.div
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <motion.h2
            variants={fadeInFromBottom}
            custom={1}
            className="text-3xl font-bold mb-8 text-center text-[#1c7b47]"
          >
            {translations.mapInfo.howToUse.title}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              variants={fadeInFromBottom}
              custom={1.2}
              className="text-center p-6"
            >
              <div className="text-4xl mb-4 text-[#2ecf77]">1</div>
              <h3 className="text-xl font-bold mb-2">{translations.mapInfo.howToUse.steps.step1.title}</h3>
              <p className="text-gray-700">{translations.mapInfo.howToUse.steps.step1.description}</p>
            </motion.div>
            <motion.div
              variants={fadeInFromBottom}
              custom={1.4}
              className="text-center p-6"
            >
              <div className="text-4xl mb-4 text-[#2ecf77]">2</div>
              <h3 className="text-xl font-bold mb-2">{translations.mapInfo.howToUse.steps.step2.title}</h3>
              <p className="text-gray-700">{translations.mapInfo.howToUse.steps.step2.description}</p>
            </motion.div>
            <motion.div
              variants={fadeInFromBottom}
              custom={1.6}
              className="text-center p-6"
            >
              <div className="text-4xl mb-4 text-[#2ecf77]">3</div>
              <h3 className="text-xl font-bold mb-2">{translations.mapInfo.howToUse.steps.step3.title}</h3>
              <p className="text-gray-700">{translations.mapInfo.howToUse.steps.step3.description}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 