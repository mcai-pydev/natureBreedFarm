import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type ComponentStatus = {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  timestamp: string;
  details?: any;
};

type BootStatus = {
  components: ComponentStatus[];
  lastBootTimestamp: string;
  overallStatus: 'success' | 'warning' | 'error' | 'pending';
  environment: string;
};

export const BootStatusDashboard = ({ className }: { className?: string }) => {
  const { toast } = useToast();
  const { data, isLoading, error, refetch, isRefetching } = useQuery<BootStatus>({
    queryKey: ['/api/system/status'],
    refetchInterval: 0, // Manual refetch only
    refetchOnWindowFocus: false,
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing system status',
      description: 'Fetching the latest system status information',
    });
  };

  const handleRunBoot = async () => {
    try {
      toast({
        title: 'Running system boot check',
        description: 'This may take a moment...',
      });
      
      // Call the health endpoint with boot=true to trigger a full boot sequence
      await fetch('/api/health?boot=true');
      
      // Wait a moment for the boot process to complete
      setTimeout(() => {
        refetch();
        toast({
          title: 'Boot check complete',
          description: 'System status has been updated',
        });
      }, 3000);
    } catch (error) {
      toast({
        title: 'Boot check failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'pending':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'pending':
        return '🔄';
      default:
        return '❓';
    }
  };
  
  const getModuleGroup = (moduleName: string) => {
    if (['database', 'api-endpoints'].includes(moduleName)) {
      return { name: 'Core Infrastructure', emoji: '🏗️' };
    }
    
    if (['auth'].includes(moduleName)) {
      return { name: 'Security', emoji: '🔒' };
    }
    
    if (['shop', 'products'].includes(moduleName)) {
      return { name: 'Shopping', emoji: '🛒' };
    }
    
    if (['orders', 'checkout'].includes(moduleName)) {
      return { name: 'Order Management', emoji: '📦' };
    }
    
    if (['breeding', 'rabbit-breeding'].includes(moduleName)) {
      return { name: 'Farm Intelligence', emoji: '🐇' };
    }
    
    if (['pages'].includes(moduleName)) {
      return { name: 'Application Pages', emoji: '📱' };
    }
    
    if (['accessibility', 'a11y'].includes(moduleName)) {
      return { name: 'Accessibility', emoji: '♿' };
    }
    
    return { name: 'Other', emoji: '🧩' };
  };

  // Calculate health score percentage
  const calculateHealthScore = (status: BootStatus): number => {
    if (!status.components.length) return 0;
    
    const scores = {
      success: 1,
      warning: 0.5,
      error: 0,
      pending: 0.25,
    };
    
    const total = status.components.reduce(
      (sum, component) => sum + scores[component.status], 
      0
    );
    
    return Math.round((total / status.components.length) * 100);
  };

  const healthScore = data ? calculateHealthScore(data) : 0;

  const getHealingSuggestion = (component: ComponentStatus): string | null => {
    // Database issues
    if (component.name === 'database' && component.status !== 'success') {
      return 'Check database connection or restart the database service';
    }
    
    // API endpoints
    if (component.name === 'api-endpoints' && component.status !== 'success') {
      return 'Verify API server is running and accessible';
    }
    
    // Auth issues
    if (component.name === 'auth' && component.status !== 'success') {
      return 'Check auth configuration or try clearing authentication cache';
    }
    
    // Shop module
    if (component.name === 'shop' && component.status !== 'success') {
      return 'Verify product data is available in the database';
    }
    
    // Orders module
    if (component.name === 'orders' && component.status !== 'success') {
      return 'Ensure user authentication is working and orders API is accessible';
    }
    
    // Checkout module
    if (component.name === 'checkout' && component.status !== 'success') {
      return 'Check order creation process and verify product inventory';
    }
    
    // Breeding module
    if ((component.name === 'breeding' || component.name === 'rabbit-breeding') && component.status !== 'success') {
      if (component.message?.includes('No animals found') || component.message?.includes('Could not retrieve animals')) {
        return 'Add sample animals to the breeding system for testing';
      }
      if (component.message?.includes('Need at least two rabbits') || component.message?.includes('insufficient stock')) {
        return 'Add more rabbits to test breeding compatibility features';
      }
      if (component.message?.includes('Need at least one male and one female')) {
        return 'Ensure both male and female rabbits exist in the system';
      }
      if (component.name === 'rabbit-breeding' && component.status === 'warning') {
        return 'The rabbit breeding system is operational but may have limited functionality due to insufficient breeding pairs';
      }
      return 'Check animal breeding service initialization and data';
    }
    
    // Pages module
    if (component.name === 'pages' && component.status !== 'success') {
      return 'Check that all application routes and their corresponding API endpoints are accessible';
    }
    
    // Accessibility module
    if (component.name === 'accessibility' && component.status !== 'success') {
      if (component.message?.includes('Dialog')) {
        return 'Add DialogTitle components to Dialog components for screen reader accessibility';
      }
      if (component.message?.includes('alt text')) {
        return 'Ensure all images have appropriate alt text';
      }
      if (component.message?.includes('aria-label')) {
        return 'Add aria-label attributes to interactive elements without visible text';
      }
      return 'Review UI components for accessibility issues like missing labels, headings, or ARIA attributes';
    }
    
    return null;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading System Status
          </CardTitle>
          <CardDescription>Fetching the latest system health information...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-10">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            System Status Unavailable
          </CardTitle>
          <CardDescription>
            Could not fetch system status information. The monitoring service may be down.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Error: {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleRefresh} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            No Status Data
          </CardTitle>
          <CardDescription>No system status information is available.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={handleRefresh} disabled={isRefetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            Check Status
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(data.overallStatus)}
              Farm System Health
              <Badge
                variant={data.overallStatus === 'success' ? 'default' : 
                        data.overallStatus === 'warning' ? 'outline' : 'destructive'}
                className="ml-2"
              >
                {data.overallStatus.toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription>
              Last updated: {new Date(data.lastBootTimestamp).toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleRefresh} 
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              size="sm" 
              onClick={handleRunBoot}
            >
              Run Boot Check
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">System Health Score</span>
            <span className="text-sm font-medium">{healthScore}%</span>
          </div>
          <Progress value={healthScore} className="h-2" />
        </div>
        
        {/* System status overview */}
        <div className="mb-6 p-3 bg-muted/50 rounded-md">
          <h3 className="text-sm font-medium mb-2">System Overview</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              🩺 Health: {getStatusEmoji(data.overallStatus)} {data.overallStatus}
            </Badge>
            <Badge variant="outline" className="text-xs">
              🧪 Modules: {data.components.length}
            </Badge>
            <Badge variant="outline" className="text-xs">
              ✅ Passing: {data.components.filter(c => c.status === 'success').length}
            </Badge>
            <Badge variant="outline" className="text-xs">
              ⚠️ Warning: {data.components.filter(c => c.status === 'warning').length}
            </Badge>
            <Badge variant="outline" className="text-xs">
              ❌ Failed: {data.components.filter(c => c.status === 'error').length}
            </Badge>
          </div>
        </div>
        
        {/* Group modules by category */}
        {Object.entries(
          // Group components by their module group
          data.components.reduce((groups, component) => {
            const group = getModuleGroup(component.name);
            if (!groups[group.name]) {
              groups[group.name] = {
                components: [],
                emoji: group.emoji
              };
            }
            groups[group.name].components.push(component);
            return groups;
          }, {} as Record<string, { components: ComponentStatus[], emoji: string }>)
        ).map(([groupName, group]) => (
          <div key={groupName} className="mb-4">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <span className="mr-2">{group.emoji}</span>
              {groupName}
            </h3>
            
            <Accordion type="single" collapsible className="w-full">
              {group.components.map((component) => {
                const healingSuggestion = getHealingSuggestion(component);
                
                return (
                  <AccordionItem 
                    key={component.name} 
                    value={component.name}
                    className="border rounded-md mb-2 overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                      <div className="flex items-center gap-2 w-full">
                        <span className="mr-1">{getStatusEmoji(component.status)}</span>
                        <span className="font-medium">{component.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto mr-4">
                          {component.status.toUpperCase()}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-3 pt-0">
                      <div className="border-l-2 pl-4 border-muted">
                        <p className="text-sm mb-2">{component.message}</p>
                        
                        {healingSuggestion && (
                          <div className="bg-muted p-2 rounded-md mb-2">
                            <p className="text-xs font-medium">🔧 Auto-healing suggestion:</p>
                            <p className="text-sm">{healingSuggestion}</p>
                          </div>
                        )}
                        
                        {component.details && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">📋 Details:</p>
                            <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-36">
                              {JSON.stringify(component.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        ))}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <div className="flex justify-between w-full">
          <span>Environment: {data.environment}</span>
          <a href="/api/system/snapshots/latest" target="_blank" className="hover:underline">
            View latest health snapshot
          </a>
        </div>
      </CardFooter>
    </Card>
  );
};