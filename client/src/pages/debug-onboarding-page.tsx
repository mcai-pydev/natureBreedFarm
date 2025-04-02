import React, { useEffect, useState } from 'react';
import { OnboardingTour } from '@/components/onboarding/onboarding-tour';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Loader2, Check, AlertTriangle } from 'lucide-react';

// This is a debug component to directly view the onboarding tour without other logic
export default function DebugOnboardingPage() {
  const [, setLocation] = useLocation();
  const [isResetting, setIsResetting] = useState(true);
  const [resetStatus, setResetStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  // Force reset onboarding state when this page loads
  useEffect(() => {
    try {
      // Clear all localStorage items related to onboarding
      localStorage.removeItem('onboardingCompleted');
      localStorage.removeItem('hasVisitedBefore');
      localStorage.removeItem('onboardingStep');
      localStorage.removeItem('tourSeen');
      
      // Log the status
      console.log('Debug mode: Onboarding state has been reset successfully');
      
      // Update component state
      setResetStatus('success');
      setIsResetting(false);
    } catch (error) {
      console.error('Failed to reset onboarding state:', error);
      setResetStatus('error');
      setIsResetting(false);
    }
  }, []);
  
  const handleComplete = () => {
    console.log('Onboarding completed!');
    setLocation('/');
  };
  
  const forceResetAndReload = () => {
    try {
      setIsResetting(true);
      setResetStatus('loading');
      
      // Clear all localStorage items that might interfere
      localStorage.clear();
      
      // Add a timestamp to ensure we get a fresh reload
      window.location.href = '/debug-onboarding?t=' + Date.now();
    } catch (error) {
      console.error('Error during reset:', error);
      setResetStatus('error');
      setIsResetting(false);
    }
  };

  return (
    <div>
      <div className="fixed top-0 left-0 z-50 bg-white p-3 w-full flex items-center justify-between shadow-md">
        <div className="flex gap-2">
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
            onClick={forceResetAndReload}
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>Reset & Reload</>
            )}
          </Button>
        </div>
        
        <div className="flex items-center text-sm">
          {resetStatus === 'loading' && (
            <span className="flex items-center text-amber-500">
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              Resetting state...
            </span>
          )}
          {resetStatus === 'success' && (
            <span className="flex items-center text-green-500">
              <Check className="mr-1 h-4 w-4" />
              Onboarding reset success
            </span>
          )}
          {resetStatus === 'error' && (
            <span className="flex items-center text-red-500">
              <AlertTriangle className="mr-1 h-4 w-4" />
              Reset error! Try manual reload
            </span>
          )}
        </div>
      </div>
      
      {/* Show a loading state if we're still resetting */}
      {isResetting ? (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-gray-600">Preparing onboarding tour...</p>
        </div>
      ) : (
        /* Always show the tour in debug mode, regardless of localStorage state */
        <OnboardingTour onComplete={handleComplete} showSkip={true} />
      )}
    </div>
  );
}