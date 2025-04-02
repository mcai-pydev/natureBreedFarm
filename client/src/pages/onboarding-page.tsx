import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [showForceView, setShowForceView] = useState(false);

  useEffect(() => {
    // Check if this is a force view request from URL param
    const urlParams = new URLSearchParams(window.location.search);
    const forceView = urlParams.get('force') === 'true';
    
    if (forceView) {
      setShowForceView(true);
      setHasCompletedOnboarding(false);
      return;
    }
    
    // Check if user has already completed onboarding
    const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
    setHasCompletedOnboarding(onboardingCompleted);
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    // Don't save completion state if we're in force view mode
    if (!showForceView) {
      localStorage.setItem('onboardingCompleted', 'true');
    }
    setHasCompletedOnboarding(true);
    setLocation('/');
  };

  // Handle "Skip" action when already completed but viewing in force mode
  const handleSkipInForceMode = () => {
    setLocation('/');
  };

  // If user is still loading, show loading spinner
  if (isLoading || hasCompletedOnboarding === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user has completed onboarding and not in force view mode, redirect to home page
  if (hasCompletedOnboarding && !showForceView) {
    setLocation('/');
    return null;
  }

  // Show force view notice if we're forcing the tour to show
  if (showForceView) {
    return (
      <>
        <div className="fixed top-0 left-0 z-50 bg-amber-100 w-full p-2 text-center text-amber-800 text-sm">
          Viewing onboarding tour in preview mode
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-2" 
            onClick={handleSkipInForceMode}
          >
            Exit Preview
          </Button>
        </div>
        <OnboardingTour onComplete={handleOnboardingComplete} showSkip={true} />
      </>
    );
  }

  // Show normal onboarding tour
  return <OnboardingTour onComplete={handleOnboardingComplete} showSkip={true} />;
}