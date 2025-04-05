import { Switch, Route } from 'wouter';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import RabbitDashboard from '@/pages/dashboard';
import AnimalsList from '@/pages/animals-list';
import AnimalDetails from '@/pages/animal-details';
import CreateAnimal from '@/pages/create-animal';
import BreedingEvents from '@/pages/breeding-events';
import BreedingCalculator from '@/pages/breeding-calculator';
import NotFound from '@/pages/not-found';
import Layout from '@/components/layout';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Switch>
          <Route path="/" component={RabbitDashboard} />
          <Route path="/animals" component={AnimalsList} />
          <Route path="/animals/:id" component={AnimalDetails} />
          <Route path="/animals/create" component={CreateAnimal} />
          <Route path="/breeding-events" component={BreedingEvents} />
          <Route path="/breeding-calculator" component={BreedingCalculator} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <Toaster />
    </QueryClientProvider>
  );
}