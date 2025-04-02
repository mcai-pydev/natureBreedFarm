import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ResponsiveProvider } from '@/contexts/responsive-context';
import { ToastProvider } from '@/hooks/use-toast';
import { AuthProvider } from '@/hooks/use-auth';

// Pages
import HomePage from '@/pages/home-page';
import { ProtectedOrderHistoryPage } from '@/pages/order-history-page';
import { ProtectedOrderDetailPage } from '@/pages/order-detail-page';
import NotFoundPage from '@/pages/not-found-page';
import AuthPage from '@/pages/auth-page';
import ShopPage from '@/pages/shop-page';

// Main App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ResponsiveProvider>
        <ToastProvider>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </ToastProvider>
      </ResponsiveProvider>
    </QueryClientProvider>
  );
}

// Router component
function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/shop" component={ShopPage} />
      <ProtectedOrderHistoryPage />
      <ProtectedOrderDetailPage />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;