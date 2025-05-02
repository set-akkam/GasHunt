/**
 * Landing Page Component
 * The main entry point for users visiting the Fuel Price Tracker application.
 * Features a responsive layout with animated sections highlighting key features.
 */
"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/app/providers/LanguageProvider";
import { fadeInFromBottom, landingStaggerContainer } from "../animations/variants";
import { useEffect, useState } from "react";

/**
 * Interface defining the structure of translation strings
 * Used for internationalization of landing page content
 */
interface Translations {
  brand: {
    name: string;
  };
  landing: {
    liveMapHeadingText: string;
    liveMapHeading: string;
    title: string;
    subtitle: string;
    signUp: string;
    learnMore: string;
    communityDriven: string;
    communityText: string;
    realTimePrices: string;
    realTimePricesText: string;
    cityTracker: string;
    cityTrackerText: string;
  };
  nav: {
    liveMap: string;
  };
}

export default function Landing() {
  const { data: session } = useSession();
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Translations | null>(null);

  // Load language-specific translations when language changes
  useEffect(() => {
    fetch(`/locales/${language}/common.json`)
      .then(res => res.json())
      .then(data => setTranslations(data))
      .catch(err => console.error('Error loading translations:', err));
  }, [language]);

  // Show nothing while translations are loading
  if (!translations) {
    return null; // Or a loading spinner
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6 sm:p-6 md:p-8 lg:p-12" role="main">
      {/* Grid layout with responsive columns */}
      <div className="grid grid-cols-12 gap-6 sm:gap-8 md:gap-10">
        {/* Left Column - Feature Cards */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-1 gap-6 sm:gap-8">
          {/* Main CTA Card - Primary feature highlight and sign-up */}
          <motion.div 
            className="bg-[#2ecf77] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden min-h-[360px] sm:min-h-[400px] lg:min-h-[460px] flex flex-col justify-between"
            variants={landingStaggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Brand and headline content with staggered animation */}
            <div className="max-w-[620px] space-y-6 sm:space-y-7 md:space-y-8">
              <motion.div 
                variants={fadeInFromBottom}
                custom={0}
                className="text-base sm:text-lg lg:text-xl font-medium tracking-wide"
                aria-label="Brand name"
              >
                {translations.brand.name}
              </motion.div>
              <motion.h1 
                variants={fadeInFromBottom}
                custom={0.2}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.5rem] leading-[1.4] sm:leading-[1.3] md:leading-[1.25] lg:leading-[1.2] font-bold text-black max-w-[580px] tracking-tight"
              >
                {translations.landing.title}
              </motion.h1>
              <motion.p 
                variants={fadeInFromBottom}
                custom={0.4}
                className="text-base sm:text-lg md:text-xl lg:text-[1.5rem] leading-[1.6] sm:leading-[1.5] md:leading-[1.4] lg:leading-relaxed text-black/80 max-w-[540px]"
              >
                {translations.landing.subtitle}
              </motion.p>
            </div>

            {/* Call-to-action buttons with conditional rendering based on auth state */}
            <motion.div 
              variants={fadeInFromBottom}
              custom={0.6}
              className="mt-8 sm:mt-10 lg:mt-12 flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5"
            >
              {session ? (
                <button 
                  className="btn-grad w-full sm:w-auto text-base lg:text-lg font-semibold px-6 py-3 lg:px-8 lg:py-3.5 rounded-lg sm:rounded-xl"
                  aria-label={`Welcome message for ${session.user.name}`}
                >
                  Welcome back, {session.user.name}!
                </button>
              ) : (
                <Link href="/auth/signup" className="w-full sm:w-auto">
                  <button 
                    className="btn-grad w-full sm:w-auto text-base lg:text-lg font-semibold px-6 py-3 lg:px-8 lg:py-3.5 rounded-lg sm:rounded-xl"
                    aria-label="Sign up for GasHunt"
                  >
                    {translations.landing.signUp}
                  </button>
                </Link>
              )}
              <Link 
                href="/learn-more" 
                className="text-base lg:text-lg font-semibold fade-underline hover:opacity-80 transition-opacity text-center w-full sm:w-auto py-2"
                aria-label="Learn more about GasHunt"
              >
                {translations.landing.learnMore}
              </Link>
            </motion.div>
          </motion.div>

          {/* Real-time Prices Feature Card with staggered animation */}
          <motion.div 
            className="bg-[#e6e6e6] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden min-h-[240px] sm:min-h-[280px] lg:min-h-[300px]"
            variants={landingStaggerContainer}
            initial="hidden"
            animate="visible"
            viewport={{ once: true }}
          >
            <div className="space-y-5 sm:space-y-6 md:space-y-7">
              <motion.h2 
                variants={fadeInFromBottom}
                custom={1.2}
                className="text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem] leading-[1.4] sm:leading-[1.3] md:leading-[1.25] lg:leading-[1.2] font-bold text-black max-w-[480px] tracking-tight"
              >
                {translations.landing.realTimePrices}
              </motion.h2>
              <motion.p 
                variants={fadeInFromBottom}
                custom={1.4}
                className="text-base sm:text-lg md:text-xl lg:text-[1.5rem] leading-[1.6] sm:leading-[1.5] md:leading-[1.4] lg:leading-relaxed text-black/80 max-w-[540px]"
              >
                {translations.landing.realTimePricesText}
              </motion.p>
            </div>
          </motion.div>
        </div>

        {/* Right Column - Community Feature Card with staggered animation */}
        <motion.div 
          className="col-span-12 lg:col-span-5 bg-[#57d992] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden min-h-[360px] sm:min-h-[400px] lg:min-h-[766px]"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <div className="space-y-5 sm:space-y-6 md:space-y-7">
            <motion.h2 
              variants={fadeInFromBottom}
              custom={0.8}
              className="text-xl sm:text-2xl md:text-3xl lg:text-[2.5rem] leading-[1.4] sm:leading-[1.3] md:leading-[1.25] lg:leading-[1.2] font-bold text-black max-w-[480px] tracking-tight"
            >
              {translations.landing.communityDriven}
            </motion.h2>
            <motion.p 
              variants={fadeInFromBottom}
              custom={1.0}
              className="text-base sm:text-lg md:text-xl lg:text-[1.5rem] leading-[1.6] sm:leading-[1.5] md:leading-[1.4] lg:leading-relaxed text-black/80 max-w-[540px]"
            >
              {translations.landing.communityText}
            </motion.p>

            <motion.div 
              variants={fadeInFromBottom}
              custom={1.2}
              className="pt-6 sm:pt-8"
            >
              <Link 
                href="/about" 
                className="text-base lg:text-lg font-semibold fade-underline hover:opacity-80 transition-opacity inline-block py-2"
                aria-label="Learn more about our community"
              >
                {translations.landing.learnMore}
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Full-width Live Map Section with staggered animation */}
        <motion.div 
          className="col-span-12 bg-[#1c7b47] rounded-xl sm:rounded-2xl overflow-hidden"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0">
            {/* Map Feature Description */}
            <div className="p-6 sm:p-8 md:p-10 lg:p-12 space-y-5 sm:space-y-6 md:space-y-7">
              <motion.h2 
                variants={fadeInFromBottom}
                custom={2}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.5rem] leading-[1.4] sm:leading-[1.3] md:leading-[1.25] lg:leading-[1.2] font-bold text-white max-w-[540px] tracking-tight"
              >
                {translations.landing.liveMapHeading}
              </motion.h2>
              <motion.p 
                variants={fadeInFromBottom}
                custom={2.2}
                className="text-base sm:text-lg md:text-xl lg:text-[1.5rem] leading-[1.6] sm:leading-[1.5] md:leading-[1.4] lg:leading-relaxed text-white/90 max-w-[480px]"
              >
                {translations.landing.liveMapHeadingText}
              </motion.p>
              <motion.div 
                variants={fadeInFromBottom}
                custom={2.4}
                className="pt-2"
              >
                <Link 
                  href="/map"
                  className="inline-block py-2"
                >
                  <button 
                    className="text-white text-base lg:text-lg font-semibold hover:text-white/80 transition-opacity fade-underline-white"
                    aria-label="View live fuel price map"
                  >
                    {translations.nav.liveMap}
                  </button>
                </Link>
              </motion.div>
            </div>

            {/* Map Image with border styling */}
            <motion.div 
              className="relative h-[300px] sm:h-[400px] lg:h-full p-4 sm:p-6 rounded-xl sm:rounded-2xl border-4 sm:border-6 border-[#1c7b47]"
              variants={fadeInFromBottom}
              custom={2.6}
            >
              <div className="absolute inset-2 rounded-lg sm:rounded-xl overflow-hidden">
                <Image
                  src="/map.png"
                  alt="Interactive map showing real-time fuel prices in your area"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg sm:rounded-xl"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Green Card - Cities/Statistics */}
        <motion.div 
          className="col-span-12 bg-[#2ecf77] rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 relative min-h-[300px] sm:min-h-[360px]"
          variants={landingStaggerContainer}
          initial="hidden"
          animate="visible"
          viewport={{ once: true }}
        >
          <div className="space-y-5 sm:space-y-6 md:space-y-7">
            <motion.h2 
              variants={fadeInFromBottom}
              custom={3}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.5rem] leading-[1.4] sm:leading-[1.3] md:leading-[1.25] lg:leading-[1.2] font-bold text-black max-w-[580px] tracking-tight"
            >
              {translations.landing.cityTracker}
            </motion.h2>
            <motion.p 
              variants={fadeInFromBottom}
              custom={3.2}
              className="text-base sm:text-lg md:text-xl lg:text-[1.5rem] leading-[1.6] sm:leading-[1.5] md:leading-[1.4] lg:leading-relaxed text-black/80 max-w-[540px]"
            >
              {translations.landing.cityTrackerText}
            </motion.p>
            <motion.div 
              variants={fadeInFromBottom}
              custom={3.4}
              className="pt-2"
            >
              <Link 
                href="/nearby"
                className="text-black text-base lg:text-lg font-semibold hover:text-black/70 transition fade-underline py-2"
              >
                {translations.landing.learnMore}
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
