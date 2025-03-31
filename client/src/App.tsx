import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from 'react-helmet-async';
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page-fixed";
import DashboardPage from "@/pages/dashboard-page";
import ProductsPage from "@/pages/products-page";
import TransactionsPage from "@/pages/transactions-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import ShopPage from "@/pages/shop-page-updated";
import PolicyPage from "@/pages/policy-page-fixed";
import AIAssistantPage from "@/pages/ai-assistant-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { FloatingHeroNav, FloatingHeroNavMobile } from "@/components/layout/floating-hero-nav";
import { useLocation } from "wouter";

function Router() {
  const [location] = useLocation();
  const showFloatingNav = location !== "/auth";

  return (
    <>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/" component={DashboardPage} />
        <ProtectedRoute path="/products" component={ProductsPage} />
        <ProtectedRoute path="/transactions" component={TransactionsPage} />
        <ProtectedRoute path="/reports" component={ReportsPage} />
        <ProtectedRoute path="/shop" component={ShopPage} />
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <ProtectedRoute path="/ai-assistant" component={AIAssistantPage} />
        <Route path="/policies" component={PolicyPage} />
        <Route path="/policies/:policyType" component={PolicyPage} />
        <Route component={NotFound} />
      </Switch>
      
      {showFloatingNav && (
        <>
          <FloatingHeroNav />
          <FloatingHeroNavMobile />
        </>
      )}
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
