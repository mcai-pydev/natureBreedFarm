import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { Loader2 } from 'lucide-react';

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user has already completed onboarding
    const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
    setHasCompletedOnboarding(onboardingCompleted);
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setHasCompletedOnboarding(true);
  };

  // If user is still loading, show loading spinner
  if (isLoading || hasCompletedOnboarding === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user has completed onboarding, redirect to home page
  if (hasCompletedOnboarding) {
    setLocation('/');
    return null;
  }

  // Show onboarding tour
  return <OnboardingTour onComplete={handleOnboardingComplete} />;
}