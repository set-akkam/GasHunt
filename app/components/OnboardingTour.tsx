import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from '../providers/OnboardingProvider';
import toast from 'react-hot-toast';
import { FaTimes, FaChevronRight, FaChevronLeft } from 'react-icons/fa';

interface Step {
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  offset?: { x: number; y: number };
}

const steps: Step[] = [
  {
    target: '[data-tour="starred-stations"]',
    title: 'Starred Stations',
    content: 'Your favorite gas stations appear here with their latest prices. Star stations to keep track of them!',
    position: 'right',
    offset: { x: 20, y: -50 }
  },
  {
    target: '[data-tour="recent-updates"]',
    title: 'Your Price Updates',
    content: 'See all the fuel price updates you\'ve submitted to help the community.',
    position: 'top',
  },
  {
    target: '[data-tour="quick-actions"]',
    title: 'Quick Actions',
    content: 'Find stations on the map or view nearby stations in your area.',
    position: 'top',
  },
];

export default function OnboardingTour() {
  const { currentStep, setCurrentStep, completeOnboarding, isFirstVisit } = useOnboarding();

  if (!isFirstVisit) return null;

  const currentStepData = steps[currentStep];
  const targetElement = document.querySelector(currentStepData?.target);
  const targetRect = targetElement?.getBoundingClientRect();

  if (!targetRect) return null;

  const getTooltipPosition = () => {
    const padding = 12;
    const offset = currentStepData.offset || { x: 0, y: 0 };
    
    switch (currentStepData.position) {
      case 'top':
        return {
          top: targetRect.top - padding - 120 + offset.y,
          left: targetRect.left + (targetRect.width / 2) - 150 + offset.x,
        };
      case 'bottom':
        return {
          top: targetRect.bottom + padding + offset.y,
          left: targetRect.left + (targetRect.width / 2) - 150 + offset.x,
        };
      case 'left':
        return {
          top: targetRect.top + (targetRect.height / 2) - 60 + offset.y,
          left: targetRect.left - padding - 300 + offset.x,
        };
      case 'right':
        return {
          top: targetRect.top + (targetRect.height / 2) - 60 + offset.y,
          left: targetRect.right + padding + offset.x,
        };
    }
  };

  const position = getTooltipPosition();

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      completeOnboarding();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    toast('You can always find help in the menu', {
      icon: 'ℹ️',
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div className="absolute inset-0 bg-black/20" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20 }}
          style={{
            top: position.top,
            left: position.left,
          }}
          className="fixed w-[300px] bg-white rounded-xl shadow-xl pointer-events-auto"
        >
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentStepData.title}
              </h3>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              {currentStepData.content}
            </p>
            <div className="flex justify-between items-center">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === currentStep ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <FaChevronLeft />
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < steps.length - 1 && <FaChevronRight />}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 