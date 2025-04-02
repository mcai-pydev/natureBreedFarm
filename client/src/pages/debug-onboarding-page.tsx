import React from 'react';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

// This is a debug component to directly view the onboarding tour without other logic
export default function DebugOnboardingPage() {
  const [, setLocation] = useLocation();
  
  const handleComplete = () => {
    console.log('Onboarding completed!');
    setLocation('/');
  };

  return (
    <div>
      <div className="fixed top-0 left-0 z-50 bg-white p-2 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setLocation('/')}
        >
          Back to Home
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            localStorage.removeItem('onboardingCompleted');
            localStorage.removeItem('hasVisitedBefore');
            alert('Onboarding state reset. Refresh the page to start over.');
          }}
        >
          Reset Onboarding State
        </Button>
      </div>
      <OnboardingTour onComplete={handleComplete} />
    </div>
  );
}