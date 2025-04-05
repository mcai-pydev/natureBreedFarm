import { Link, useLocation } from 'wouter';
import { Rabbit, BarChart3, ActivitySquare, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavItem = ({ 
  href, 
  icon: Icon, 
  children 
}: { 
  href: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
}) => {
  const [location] = useLocation();
  const isActive = location === href;
  
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-md hover:bg-primary/10 transition-colors",
        isActive && "bg-primary/10 text-primary font-medium"
      )}>
        <Icon className="h-5 w-5" />
        <span>{children}</span>
      </a>
    </Link>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-4 hidden md:block">
        <div className="flex items-center gap-2 mb-8">
          <Rabbit className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold">Rabbit Breeding</h1>
        </div>
        
        <nav className="space-y-1">
          <NavItem href="/" icon={BarChart3}>Dashboard</NavItem>
          <NavItem href="/breeding/rabbits" icon={Rabbit}>Rabbit Breeding</NavItem>
          <NavItem href="/breeding-events" icon={Calendar}>Breeding Events</NavItem>
          <NavItem href="/status" icon={ActivitySquare}>System Status</NavItem>
        </nav>
      </aside>
      
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 border-b bg-card p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rabbit className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-bold">Rabbit Breeding</h1>
          </div>
          
          {/* Mobile menu button would go here */}
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto md:pt-8 pt-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;