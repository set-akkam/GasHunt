/**
 * OnboardingProvider manages the user's first-time experience in the application.
 * It tracks whether a user is new, their progress through onboarding steps,
 * and persists this information in localStorage to maintain state across sessions.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the shape of the onboarding context
interface OnboardingContextType {
  isFirstVisit: boolean;          // Whether this is the user's first visit
  setFirstVisit: (value: boolean) => void;  // Update first visit status
  currentStep: number;            // Current step in the onboarding process
  setCurrentStep: (step: number) => void;   // Update current step
  isOnboardingComplete: boolean;  // Whether onboarding has been completed
  completeOnboarding: () => void; // Function to mark onboarding as complete
}

// Create the context with undefined as default value
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

/**
 * Custom hook to access the onboarding context
 * @throws Error if used outside of OnboardingProvider
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

/**
 * Provider component that manages onboarding state and provides it to child components
 * @param children - React nodes that will have access to the onboarding context
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  // Initialize state for onboarding management
  const [isFirstVisit, setFirstVisit] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  // Check localStorage on mount to determine if user has completed onboarding before
  useEffect(() => {
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete) {
      setFirstVisit(false);
      setIsOnboardingComplete(true);
    }
  }, []);

  /**
   * Marks onboarding as complete and updates both state and localStorage
   * This ensures the onboarding experience won't show again on future visits
   */
  const completeOnboarding = () => {
    localStorage.setItem('onboardingComplete', 'true');
    setIsOnboardingComplete(true);
    setFirstVisit(false);
  };

  // Provide the onboarding context to all child components
  return (
    <OnboardingContext.Provider
      value={{
        isFirstVisit,
        setFirstVisit,
        currentStep,
        setCurrentStep,
        isOnboardingComplete,
        completeOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
} 