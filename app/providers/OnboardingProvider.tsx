import React, { createContext, useContext, useState, useEffect } from 'react';

interface OnboardingContextType {
  isFirstVisit: boolean;
  setFirstVisit: (value: boolean) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isFirstVisit, setFirstVisit] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding before
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete) {
      setFirstVisit(false);
      setIsOnboardingComplete(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('onboardingComplete', 'true');
    setIsOnboardingComplete(true);
    setFirstVisit(false);
  };

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