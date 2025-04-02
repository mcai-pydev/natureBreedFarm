import React from 'react';
import { Route, Switch } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ResponsiveProvider } from '@/contexts/responsive-context';
import { ToastProvider } from '@/hooks/use-toast.tsx';

// Pages
import HomePage from '@/pages/home-page';
import { ProtectedOrderHistoryPage } from '@/pages/order-history-page';
import { ProtectedOrderDetailPage } from '@/pages/order-detail-page';
import NotFoundPage from '@/pages/not-found-page';

// Main App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ResponsiveProvider>
        <ToastProvider>
          <Router />
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
      <ProtectedOrderHistoryPage />
      <ProtectedOrderDetailPage />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

export default App;