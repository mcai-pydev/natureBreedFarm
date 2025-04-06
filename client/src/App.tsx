import RabbitBreedingPage from "@/pages/rabbit-breeding-page";
import React, { useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ResponsiveProvider } from '@/contexts/responsive-context';
import { ToastProvider } from '@/hooks/use-toast';
import { AuthProvider } from '@/hooks/use-auth';
import { MobileProvider } from '@/hooks/use-mobile';
import { ProtectedRoute } from '@/lib/protected-route';

// Pages
import HomePage from '@/pages/home-page';
import { ProtectedOrderHistoryPage } from '@/pages/order-history-page';
import { ProtectedOrderDetailPage } from '@/pages/order-detail-page';
import NotFoundPage from '@/pages/not-found-page';
import AuthPage from '@/pages/auth-page';
import ShopPage from '@/pages/shop-page';
import ProductsPage from '@/pages/products-page';
import TransactionsPage from '@/pages/transactions-page';
import ReportsPage from '@/pages/reports-page';
import PolicyPage from '@/pages/policy-page';
import AIAssistantPage from '@/pages/ai-assistant-page';
import SettingsPage from '@/pages/settings-page';
import StatusPage from '@/pages/status-page';
import OnboardingPage from '@/pages/onboarding-page';
import DebugOnboardingPage from '@/pages/debug-onboarding-page';
import DashboardPage from '@/pages/dashboard-page';
import CoverageDashboard from '@/pages/dev/coverage-dashboard';
import { Loader2 } from 'lucide-react';

// Import UnderConstruction component for placeholder pages
import UnderConstruction from '@/components/under-construction';

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
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/shop" component={ShopPage} />
      <Route path="/policies" component={PolicyPage} />
      <Route path="/onboarding" component={OnboardingPage} />
      <Route path="/debug-onboarding" component={DebugOnboardingPage} />
      
      {/* Protected routes - require login */}
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} requiredRole={['Admin', 'admin', 'ADMIN', 'Manager', 'manager']} />
      <ProtectedRoute path="/products" component={ProductsPage} />
      <ProtectedRoute path="/products/new" component={() => (
        <UnderConstruction 
          title="Add New Product" 
          message="The product creation feature is coming soon."
          returnPath="/products" 
          returnLabel="Back to Products"
        />
      )} />
      <ProtectedRoute path="/transactions" component={TransactionsPage} />
      <ProtectedRoute path="/transactions/new" component={() => (
        <UnderConstruction 
          title="Record New Transaction" 
          message="The transaction recording feature is coming soon."
          returnPath="/transactions" 
          returnLabel="Back to Transactions"
        />
      )} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <ProtectedRoute path="/rabbit-breeding" component={RabbitBreedingPage} />
      <ProtectedRoute path="/animals/new" component={() => (
        <UnderConstruction 
          title="Register New Animal" 
          message="The animal registration feature is coming soon."
          returnPath="/rabbit-breeding" 
          returnLabel="Back to Breeding"
        />
      )} />
      <ProtectedRoute path="/ai-assistant" component={AIAssistantPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/status" component={StatusPage} />
      <ProtectedRoute path="/profile" component={() => (
        <UnderConstruction 
          title="User Profile" 
          message="The user profile page is coming soon."
          returnPath="/" 
          returnLabel="Back to Dashboard"
        />
      )} />
      <ProtectedRoute path="/orders" component={() => (
        <UnderConstruction 
          title="Orders" 
          message="The standalone orders page is coming soon. Please use the order history feature."
          returnPath="/" 
          returnLabel="Back to Dashboard"
        />
      )} />
      <ProtectedRoute path="/orders/new" component={() => (
        <UnderConstruction 
          title="Create New Order" 
          message="The order creation feature is coming soon."
          returnPath="/" 
          returnLabel="Back to Dashboard"
        />
      )} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={() => (
        <UnderConstruction 
          title="Admin Dashboard" 
          message="The admin dashboard is under development."
          returnPath="/" 
          returnLabel="Back to Main Dashboard"
        />
      )} requiredRole={['Admin', 'admin', 'ADMIN']} />
      <ProtectedRoute path="/admin/products" component={() => (
        <UnderConstruction 
          title="Admin Products" 
          message="The admin products management is under development."
          returnPath="/admin" 
          returnLabel="Back to Admin Dashboard"
        />
      )} requiredRole={['Admin', 'admin', 'ADMIN']} />
      <ProtectedRoute path="/admin/transactions" component={() => (
        <UnderConstruction 
          title="Admin Transactions" 
          message="The admin transactions management is under development."
          returnPath="/admin" 
          returnLabel="Back to Admin Dashboard"
        />
      )} requiredRole={['Admin', 'admin', 'ADMIN']} />
      <ProtectedRoute path="/admin/reports" component={() => (
        <UnderConstruction 
          title="Admin Reports" 
          message="The admin reports section is under development."
          returnPath="/admin" 
          returnLabel="Back to Admin Dashboard"
        />
      )} requiredRole={['Admin', 'admin', 'ADMIN']} />
      <ProtectedRoute path="/admin/customers" component={() => (
        <UnderConstruction 
          title="Customer Management" 
          message="The customer management section is under development."
          returnPath="/admin" 
          returnLabel="Back to Admin Dashboard"
        />
      )} requiredRole={['Admin', 'admin', 'ADMIN']} />
      <ProtectedRoute path="/admin/breeding" component={() => (
        <UnderConstruction 
          title="Admin Breeding Management" 
          message="The admin breeding management section is under development."
          returnPath="/admin" 
          returnLabel="Back to Admin Dashboard"
        />
      )} requiredRole={['Admin', 'admin', 'ADMIN']} />
      <ProtectedRoute path="/admin/messages" component={() => (
        <UnderConstruction 
          title="Admin Messages" 
          message="The admin messages section is under development."
          returnPath="/admin" 
          returnLabel="Back to Admin Dashboard"
        />
      )} requiredRole={['Admin', 'admin', 'ADMIN']} />
      <ProtectedRoute path="/admin/settings" component={() => (
        <UnderConstruction 
          title="Admin Settings" 
          message="The admin settings section is under development."
          returnPath="/admin" 
          returnLabel="Back to Admin Dashboard"
        />
      )} requiredRole={['Admin', 'admin', 'ADMIN']} />
      <ProtectedRoute path="/admin/logs" component={() => (
        <UnderConstruction 
          title="System Logs" 
          message="The system logs section is under development."
          returnPath="/admin" 
          returnLabel="Back to Admin Dashboard"
        />
      )} requiredRole={['Admin', 'admin', 'ADMIN']} />
      <ProtectedRoute path="/admin/users" component={() => (
        <UnderConstruction 
          title="User Management" 
          message="The user management section is under development."
          returnPath="/admin" 
          returnLabel="Back to Admin Dashboard"
        />
      )} requiredRole={['Admin', 'admin', 'ADMIN']} />
      
      {/* Developer Tools Section */}
      <ProtectedRoute path="/dev/coverage" component={CoverageDashboard} requiredRole={['Admin', 'admin', 'ADMIN']} />
      
      {/* Already protected using custom components */}
      <ProtectedOrderHistoryPage />
      <ProtectedOrderDetailPage />
      
      {/* Fallback for unknown routes */}
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;
