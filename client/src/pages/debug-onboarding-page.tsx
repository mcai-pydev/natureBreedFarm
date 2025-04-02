import React, { useEffect } from 'react';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

// This is a debug component to directly view the onboarding tour without other logic
export default function DebugOnboardingPage() {
  const [, setLocation] = useLocation();
  
  // Force reset onboarding state when this page loads
  useEffect(() => {
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('hasVisitedBefore');
    console.log('Debug mode: Onboarding state has been reset');
  }, []);
  
  const handleComplete = () => {
    console.log('Onboarding completed!');
    setLocation('/');
  };

  return (
    <div>
      <div className="fixed top-0 left-0 z-50 bg-white p-2 flex gap-2 shadow-md">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLocation('/')}
        >
          Back to Home
        </Button>
        <Button
          size="sm" 
          variant="default"
          onClick={() => {
            localStorage.removeItem('onboardingCompleted');
            localStorage.removeItem('hasVisitedBefore');
            window.location.reload();
          }}
        >
          Reset & Reload
        </Button>
      </div>
      
      {/* Always show the tour in debug mode, regardless of localStorage state */}
      <OnboardingTour onComplete={handleComplete} showSkip={true} />
    </div>
  );
}