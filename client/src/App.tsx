import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { ResponsiveProvider } from './contexts/responsive-context';
import NotFound from "@/pages/not-found";

// Legacy pages (to be migrated)
import DashboardPage from "@/pages/dashboard-page";
import ProductsPage from "@/pages/products-page";
import TransactionsPage from "@/pages/transactions-page";
import ReportsPage from "@/pages/reports-page";
import SettingsPage from "@/pages/settings-page";
import PolicyPage from "@/pages/policy-page-fixed";
import AIAssistantPage from "@/pages/ai-assistant-page";
import RabbitBreedingPage from "@/pages/rabbit-breeding-page-fixed";

// New modular pages
import LandingPage from "@/pages/landing-page";
import AdminDashboard from "@/modules/admin/pages/admin-dashboard";
import ShopPage from "@/modules/customer/pages/shop-page";
import CheckoutPage from "@/modules/customer/pages/checkout-page";
import AuthPage from "@/modules/common/pages/auth-page";

import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { FloatingHeroNav, FloatingHeroNavMobile } from "@/components/layout/floating-hero-nav";
import { useLocation } from "wouter";

function Router() {
  const [location] = useLocation();
  const showFloatingNav = !location.includes("/admin") && 
                          !location.includes("/auth") && 
                          location !== "/";

  // Determine if we should show legacy navigation or use the new modular layouts
  const isLegacyRoute = location.includes("/transactions") || 
                        location.includes("/reports") || 
                        location.includes("/settings") || 
                        location.includes("/policy") || 
                        location.includes("/policies") || 
                        location.includes("/ai-assistant") || 
                        location.includes("/rabbit-breeding");

  return (
    <>
      <Switch>
        {/* Landing page (new) */}
        <Route path="/" component={LandingPage} />
        
        {/* Auth page (improved) */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Customer routes (new) */}
        <Route path="/shop" component={ShopPage} />
        <Route path="/checkout" component={CheckoutPage} />
        
        {/* Admin routes (new) */}
        <ProtectedRoute path="/admin" component={AdminDashboard} />
        
        {/* Legacy routes (to be migrated) */}
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
        <Route path="/products" component={ProductsPage} />
        <ProtectedRoute path="/transactions" component={TransactionsPage} />
        <ProtectedRoute path="/reports" component={ReportsPage} />
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <ProtectedRoute path="/ai-assistant" component={AIAssistantPage} />
        <Route path="/rabbit-breeding" component={RabbitBreedingPage} />
        <Route path="/policies" component={PolicyPage} />
        <Route path="/policies/:policyType" component={PolicyPage} />
        <Route path="/policy" component={PolicyPage} />
        <Route path="/policy/:policyType" component={PolicyPage} />
        
        {/* Not Found */}
        <Route component={NotFound} />
      </Switch>
      
      {/* Only show floating nav on legacy routes */}
      {showFloatingNav && isLegacyRoute && (
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
      <ThemeProvider defaultTheme="system" storageKey="nature-breed-theme">
        <ResponsiveProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <Router />
              <Toaster />
            </AuthProvider>
          </QueryClientProvider>
        </ResponsiveProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
