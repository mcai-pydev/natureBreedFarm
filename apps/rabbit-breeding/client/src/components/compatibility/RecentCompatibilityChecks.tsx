import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatDistanceToNow } from 'date-fns';

// Simplified Alert components since the shadcn/ui versions are not available
const Alert = ({ 
  children, 
  variant = 'default'
}: { 
  children: React.ReactNode, 
  variant?: 'default' | 'destructive' 
}) => (
  <div className={`p-4 rounded-md border ${
    variant === 'destructive' ? 'border-destructive/50 bg-destructive/10' : 'border-border bg-background'
  }`}>
    {children}
  </div>
);

const AlertTitle = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) => (
  <h5 className={`font-medium ${className || ''}`}>{children}</h5>
);

const AlertDescription = ({ 
  children, 
  className 
}: { 
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`text-sm ${className || ''}`}>{children}</div>
);

// Simplified Tooltip components
const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const Tooltip = ({ children }: { children: React.ReactNode }) => <>{children}</>;
const TooltipTrigger = ({ asChild, children }: { asChild?: boolean, children: React.ReactNode }) => <>{children}</>;
const TooltipContent = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute z-50 p-2 bg-popover text-popover-foreground rounded-md shadow-md text-xs -translate-x-1/2 -translate-y-full ml-6 mb-2 top-0 left-0 hidden group-hover:block">
    {children}
  </div>
);

// Interface for compatibility check entry
export interface CompatibilityCheck {
  timestamp: string;
  status: 'success' | 'warning';
  message: string;
  details: {
    maleId: number;
    maleAnimalId: string;
    maleName: string;
    femaleId: number;
    femaleAnimalId: string;
    femaleName: string;
    compatible: boolean;
    reason: string;
  };
}

export default function RecentCompatibilityChecks() {
  const [tab, setTab] = useState('all');
  
  // Fetch recent compatibility checks from the API
  const { data, isLoading, error } = useQuery<CompatibilityCheck[]>({
    queryKey: ['/api/breeding/compatibility-history'],
    // This endpoint is a placeholder - in a real implementation it would fetch from the server
    queryFn: async () => {
      // For now, let's use some mock data
      return [
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          status: 'success',
          message: 'Compatibility check passed for Buck and Daisy',
          details: {
            maleId: 1,
            maleAnimalId: 'RB-M-001',
            maleName: 'Buck',
            femaleId: 2,
            femaleAnimalId: 'RB-F-002',
            femaleName: 'Daisy',
            compatible: true,
            reason: 'No genetic concerns detected'
          }
        },
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          status: 'warning',
          message: 'Compatibility check failed for Thumper and Flower: Shared ancestry detected',
          details: {
            maleId: 3,
            maleAnimalId: 'RB-M-003',
            maleName: 'Thumper',
            femaleId: 4,
            femaleAnimalId: 'RB-F-004',
            femaleName: 'Flower',
            compatible: false,
            reason: 'Shared ancestry detected: RB-M-Ancestor-001. This increases inbreeding risk.'
          }
        }
      ];
    }
  });
  
  // Filter compatibility checks based on selected tab
  const filteredChecks = data?.filter(check => {
    if (tab === 'compatible') return check.details.compatible;
    if (tab === 'incompatible') return !check.details.compatible;
    return true; // 'all' tab
  });
  
  // Function to download compatibility history as CSV directly from server
  const downloadCSV = () => {
    // Use the server endpoint to generate and download the CSV
    window.open('/api/breeding/compatibility-history/export', '_blank');
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Compatibility Checks</CardTitle>
          <CardDescription>Loading compatibility history...</CardDescription>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Compatibility Checks</CardTitle>
          <CardDescription>History of recent rabbit compatibility checks</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load compatibility history. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Compatibility Checks</CardTitle>
          <CardDescription>No compatibility checks recorded yet</CardDescription>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center text-center">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Compatibility checks will appear here when you test rabbit pairings
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Recent Compatibility Checks</CardTitle>
            <CardDescription>History of recent rabbit compatibility checks</CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={downloadCSV}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download history as CSV</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="compatible">Compatible</TabsTrigger>
            <TabsTrigger value="incompatible">Incompatible</TabsTrigger>
          </TabsList>
          <div className="space-y-4">
            {filteredChecks?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No checks matching this filter
              </div>
            ) : (
              filteredChecks?.map((check, index) => (
                <Alert key={index} variant={check.details.compatible ? "default" : "destructive"}>
                  <div className="flex items-start gap-2">
                    {check.details.compatible ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-center font-medium">
                        <span>
                          {check.details.maleName} + {check.details.femaleName}
                        </span>
                        <Badge variant={check.details.compatible ? "outline" : "destructive"}>
                          {check.details.compatible ? "Compatible" : "Not Compatible"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm">
                        <div>{check.details.reason}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(check.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 text-xs text-muted-foreground">
        Showing {filteredChecks?.length || 0} of {data?.length || 0} compatibility checks
      </CardFooter>
    </Card>
  );
}