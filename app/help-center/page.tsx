"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { fadeInFromBottom, landingStaggerContainer } from "../animations/variants";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useLanguage } from "../providers/LanguageProvider";
import { useAuth } from "../providers/AuthProvider";

interface Translations {
  helpCenter: {
    title: string;
    subtitle: string;
    faqs: {
      submitPrice: {
        question: string;
        answer: string;
      };
      updateFrequency: {
        question: string;
        answer: string;
      };
      incorrectPrice: {
        question: string;
        answer: string;
      };
      earnPoints: {
        question: string;
        answer: string;
      };
    };
    support: {
      title: string;
      content: string;
      button: string;
    };
  };
}

export default function HelpCenter() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
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

  const faqs = [
    translations.helpCenter.faqs.submitPrice,
    translations.helpCenter.faqs.updateFrequency,
    translations.helpCenter.faqs.incorrectPrice,
    translations.helpCenter.faqs.earnPoints
  ];

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

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
            {translations.helpCenter.title}
          </motion.h1> 
          <motion.p
            variants={fadeInFromBottom}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="text-base sm:text-lg md:text-xl text-white/90 text-center max-w-3xl mx-auto"
          >
            {translations.helpCenter.subtitle}
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-16">
        {/* FAQ Section */}
        <motion.div
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-3 sm:gap-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={fadeInFromBottom}
              custom={index * 0.1}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300"
            >
              <button
                onClick={() => toggleExpand(index)}
                className="w-full p-4 sm:p-5 md:p-6 flex justify-between items-center text-left"
              >
                <h3 className="text-lg sm:text-xl font-bold text-[#1c7b47]">{faq.question}</h3>
                <motion.div
                  animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDownIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[#1c7b47]" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 md:p-6 pt-0 text-gray-700 text-sm sm:text-base">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact Support Section */}
        <motion.div
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
          className="mt-10 sm:mt-12 md:mt-16 bg-white rounded-xl sm:rounded-2xl p-6 sm:p-7 md:p-8 shadow-lg"
        >
          <motion.h2
            variants={fadeInFromBottom}
            custom={0.5}
            className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-5 md:mb-6 text-center text-[#1c7b47]"
          >
            {translations.helpCenter.support.title}
          </motion.h2>
          <motion.div
            variants={fadeInFromBottom}
            custom={0.6}
            className="text-center"
          >
            <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-5 md:mb-6">
              {translations.helpCenter.support.content}
            </p>
            <div className="button-container">
              <div className="button">
                <a 
                  href={`mailto:support@fuel-tracker.com?subject=Support Request from ${user?.name || 'User'}&body=Hello Support Team,%0D%0A%0D%0AMy name is ${user?.name || ''} and I need assistance with the following:%0D%0A%0D%0A%0D%0ADetails:%0D%0A-%20%0D%0A-%20%0D%0A%0D%0AUser Information:%0D%0AName: ${user?.name || 'Not provided'}%0D%0AEmail: ${user?.email || 'Not provided'}%0D%0A%0D%0AThank you for your help!`}
                  className="button-link"
                >
                  {translations.helpCenter.support.button}
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 