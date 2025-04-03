import React, { useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ResponsiveProvider } from '@/contexts/responsive-context';
import { ToastProvider } from '@/hooks/use-toast';
import { AuthProvider } from '@/hooks/use-auth';
import { MobileProvider } from '@/hooks/use-mobile';

// Pages
import HomePage from '@/pages/home-page';
import { ProtectedOrderHistoryPage } from '@/pages/order-history-page';
import { ProtectedOrderDetailPage } from '@/pages/order-detail-page';
import NotFoundPage from '@/pages/not-found-page';
import AuthPage from '@/pages/auth-page';
import ShopPage from '@/pages/shop-page';
import StatusPage from '@/pages/status-page';
import OnboardingPage from '@/pages/onboarding-page';
import DebugOnboardingPage from '@/pages/debug-onboarding-page';
import { Loader2 } from 'lucide-react';

// Main App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ResponsiveProvider>
        <MobileProvider>
          <ToastProvider>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </ToastProvider>
        </MobileProvider>
      </ResponsiveProvider>
    </QueryClientProvider>
  );
}

// Router component
function Router() {
  const [location, setLocation] = useLocation();
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Check if this is the user's first visit by checking localStorage
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore') === 'true';
    const onboardingCompleted = localStorage.getItem('onboardingCompleted') === 'true';
    
    // If user has never visited before or hasn't completed onboarding, mark as first visit
    setIsFirstVisit(!hasVisitedBefore && !onboardingCompleted);
    
    // Set the flag for future visits
    localStorage.setItem('hasVisitedBefore', 'true');
    
    setIsInitializing(false);
    
    // If it's the first visit and we're at the root path, redirect to onboarding
    if (!hasVisitedBefore && !onboardingCompleted && location === '/') {
      setLocation('/onboarding');
    }
  }, [location, setLocation]);

  // Show loading state while checking
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/shop" component={ShopPage} />
      <Route path="/status" component={StatusPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/debug-onboarding" component={DebugOnboardingPage} />
      <ProtectedOrderHistoryPage />
      <ProtectedOrderDetailPage />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;