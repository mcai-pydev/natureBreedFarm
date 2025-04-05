import { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Server, Database, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatDate } from '../lib/utils';

interface HealthStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  details?: string;
}

interface HealthCheckResponse {
  status: 'healthy' | 'warning' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthStatus;
    models: {
      animals: HealthStatus;
      breedingEvents: HealthStatus;
    };
    api: {
      animals: HealthStatus;
      breedingEvents: HealthStatus;
      suggestions: HealthStatus;
    };
  };
}

// Sample health data for the prototype
const mockHealthData: HealthCheckResponse = {
  status: 'healthy',
  service: 'Rabbit Breeding System',
  timestamp: new Date().toISOString(),
  uptime: 3600, // seconds
  version: '1.0.0',
  checks: {
    database: {
      name: 'Database Connection',
      status: 'healthy'
    },
    models: {
      animals: {
        name: 'Animals Model',
        status: 'healthy'
      },
      breedingEvents: {
        name: 'Breeding Events Model',
        status: 'healthy'
      }
    },
    api: {
      animals: {
        name: 'Animals API',
        status: 'healthy'
      },
      breedingEvents: {
        name: 'Breeding Events API',
        status: 'healthy'
      },
      suggestions: {
        name: 'Breeding Suggestions API',
        status: 'healthy'
      }
    }
  }
};

function StatusIndicator({ status }: { status: 'healthy' | 'warning' | 'error' }) {
  if (status === 'healthy') {
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  } else if (status === 'warning') {
    return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  } else {
    return <XCircle className="h-5 w-5 text-red-500" />;
  }
}

function StatusBadge({ children, variant }: { children: string; variant: string }) {
  const bgColor = 
    variant === 'healthy' ? 'bg-green-500' : 
    variant === 'warning' ? 'bg-amber-500' : 
    'bg-red-500';
  
  return (
    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${bgColor}`}>
      {children}
    </div>
  );
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  useEffect(() => {
    fetchHealthData();
  }, []);

  const fetchHealthData = async () => {
    setIsLoading(true);
    try {
      // In a real app, this would be an API fetch
      // const response = await fetch('/api/health');
      // const data = await response.json();
      // For prototype, use mock data
      setTimeout(() => {
        setHealth(mockHealthData);
        setIsLoading(false);
        setLastRefreshed(new Date());
      }, 500);
    } catch (err: any) {
      setError(err);
      setIsLoading(false);
    }
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load health data</h2>
        <p className="text-muted-foreground">{error.message}</p>
        <button 
          onClick={fetchHealthData}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  if (!health) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-muted-foreground">
            Last refreshed: {lastRefreshed.toLocaleTimeString()}
          </p>
          <button 
            onClick={fetchHealthData} 
            className="inline-flex items-center text-sm text-primary gap-1"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      {/* Overall health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              {health.service} Status: 
              <StatusBadge variant={health.status}>
                {health.status === 'healthy' 
                  ? 'All Systems Operational' 
                  : health.status === 'warning' 
                    ? 'Partial System Degradation' 
                    : 'System Outage'
                }
              </StatusBadge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Version:</span>
              <span>{health.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Uptime:</span>
              <span>{formatUptime(health.uptime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Last Check:</span>
              <span>{formatDate(health.timestamp)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Status
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2 border-b">
            <span>{health.checks.database.name}</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status={health.checks.database.status} />
              <span className={
                health.checks.database.status === 'healthy' ? 'text-green-500' :
                health.checks.database.status === 'warning' ? 'text-amber-500' : 
                'text-red-500'
              }>
                {health.checks.database.status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Models health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Data Models
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2 border-b">
            <span>{health.checks.models.animals.name}</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status={health.checks.models.animals.status} />
              <span className={
                health.checks.models.animals.status === 'healthy' ? 'text-green-500' :
                health.checks.models.animals.status === 'warning' ? 'text-amber-500' : 
                'text-red-500'
              }>
                {health.checks.models.animals.status}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span>{health.checks.models.breedingEvents.name}</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status={health.checks.models.breedingEvents.status} />
              <span className={
                health.checks.models.breedingEvents.status === 'healthy' ? 'text-green-500' :
                health.checks.models.breedingEvents.status === 'warning' ? 'text-amber-500' : 
                'text-red-500'
              }>
                {health.checks.models.breedingEvents.status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Endpoints
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-2 border-b">
            <span>{health.checks.api.animals.name}</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status={health.checks.api.animals.status} />
              <span className={
                health.checks.api.animals.status === 'healthy' ? 'text-green-500' :
                health.checks.api.animals.status === 'warning' ? 'text-amber-500' : 
                'text-red-500'
              }>
                {health.checks.api.animals.status}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span>{health.checks.api.breedingEvents.name}</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status={health.checks.api.breedingEvents.status} />
              <span className={
                health.checks.api.breedingEvents.status === 'healthy' ? 'text-green-500' :
                health.checks.api.breedingEvents.status === 'warning' ? 'text-amber-500' : 
                'text-red-500'
              }>
                {health.checks.api.breedingEvents.status}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span>{health.checks.api.suggestions.name}</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status={health.checks.api.suggestions.status} />
              <span className={
                health.checks.api.suggestions.status === 'healthy' ? 'text-green-500' :
                health.checks.api.suggestions.status === 'warning' ? 'text-amber-500' : 
                'text-red-500'
              }>
                {health.checks.api.suggestions.status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}