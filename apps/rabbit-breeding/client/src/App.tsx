import { Switch, Route } from 'wouter';
import RabbitDashboard from '@/pages/dashboard';
import StatusPage from '@/pages/status';
import BreedingEventsPage from '@/pages/breeding-events';
import RabbitDetailPage from '@/pages/rabbit-detail';
import RabbitBreedingPage from './pages/rabbit-breeding-page';
import Layout from '@/components/layout';

export default function App() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={RabbitDashboard} />
        <Route path="/status" component={StatusPage} />
        <Route path="/breeding-events" component={BreedingEventsPage} />
        <Route path="/rabbit/:id" component={RabbitDetailPage} />
        <Route path="/breeding/rabbits" component={RabbitBreedingPage} />
        <Route>
          <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
            <h1 className="text-2xl font-bold">Page Not Found</h1>
            <p className="text-muted-foreground">The page you requested does not exist.</p>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}