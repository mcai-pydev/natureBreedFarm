import React, { useState } from 'react';
import { BootStatusDashboard } from '@/components/system/boot-status-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function StatusPage() {
  // Get health snapshots list
  type SnapshotsResponse = {
    snapshots: string[];
  };
  
  type AccessibilityCheckResult = {
    status: 'success' | 'warning' | 'error' | 'pending';
    message: string;
    timestamp: string;
    details?: Array<{
      component: string;
      issue: string;
      suggestion: string;
      path?: string;
      severity: 'high' | 'medium' | 'low';
    }>;
  };
  
  const { toast } = useToast();
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  
  const { data: snapshotsData, isLoading: isLoadingSnapshots } = useQuery<SnapshotsResponse>({
    queryKey: ['/api/system/snapshots'],
    refetchInterval: 0,
    refetchOnWindowFocus: false,
  });
  
  const { 
    data: a11yData, 
    isLoading: isLoadingA11y, 
    error: a11yError,
    refetch: refetchA11y
  } = useQuery<AccessibilityCheckResult>({
    queryKey: ['/api/health/a11y'],
    refetchInterval: 0,
    refetchOnWindowFocus: false,
  });
  
  const handleRunA11yCheck = async () => {
    setIsRunningCheck(true);
    try {
      await refetchA11y();
      toast({
        title: "Accessibility check complete",
        description: "The accessibility scan has been completed",
      });
    } catch (error) {
      toast({
        title: "Accessibility check failed",
        description: "Failed to complete the accessibility scan",
        variant: "destructive",
      });
    } finally {
      setIsRunningCheck(false);
    }
  };

  return (
    <div className="container py-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">System Status</h1>
        <p className="text-muted-foreground">
          Monitor the health and status of all farm system components
        </p>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="current">Current Status</TabsTrigger>
          <TabsTrigger value="snapshots">Health Snapshots</TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
          <TabsTrigger value="tools">Diagnostic Tools</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="space-y-4">
          <BootStatusDashboard />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Common Issues</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Authentication Required (401)</strong>: Log in or make sure your session hasn't expired.
                </li>
                <li>
                  <strong>API Connectivity</strong>: Ensure the server is running and network is accessible.
                </li>
                <li>
                  <strong>Database Connection</strong>: Verify database credentials and connection string.
                </li>
                <li>
                  <strong>Missing Products</strong>: Check if products have been properly added to the database.
                </li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">How to Use This Dashboard</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>View Component Status</strong>: Check the status of individual system components.
                </li>
                <li>
                  <strong>Run Boot Check</strong>: Manually trigger a full system health check.
                </li>
                <li>
                  <strong>Healing Suggestions</strong>: Get automated suggestions for fixing issues.
                </li>
                <li>
                  <strong>View Snapshots</strong>: Compare system health over time using saved snapshots.
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="snapshots">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Health Snapshots History</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Health snapshots are point-in-time records of system status that help track system health over time.
              Snapshots are automatically created after successful boots or can be manually exported.
            </p>
            
            {isLoadingSnapshots ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : snapshotsData && snapshotsData.snapshots && snapshotsData.snapshots.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left">Snapshot</th>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshotsData?.snapshots.map((snapshot: string, index: number) => (
                      <tr key={snapshot} className="border-t">
                        <td className="px-4 py-2">
                          Snapshot #{snapshotsData?.snapshots.length - index}
                        </td>
                        <td className="px-4 py-2">
                          {snapshot.replace('health-snapshot-', '').replace('.json', '')}
                        </td>
                        <td className="px-4 py-2">
                          <a 
                            href={`/api/system/snapshots/${snapshot}`} 
                            target="_blank"
                            className="text-blue-500 hover:underline text-sm"
                          >
                            View Details
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No health snapshots available. Snapshots are created after successful system boots.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="accessibility">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-semibold">Accessibility Check</CardTitle>
                  <CardDescription>
                    Analyze the application for common accessibility issues and WCAG compliance
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleRunA11yCheck} 
                  disabled={isRunningCheck || isLoadingA11y}
                >
                  {(isRunningCheck || isLoadingA11y) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    'Run Accessibility Check'
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingA11y && !a11yData ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : a11yError ? (
                <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-destructive">Failed to run accessibility check</h3>
                    <p className="text-sm mt-1">{a11yError instanceof Error ? a11yError.message : 'Unknown error'}</p>
                  </div>
                </div>
              ) : a11yData ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-md bg-muted/50">
                    {a11yData.status === 'success' ? (
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    ) : a11yData.status === 'warning' ? (
                      <AlertCircle className="h-8 w-8 text-amber-500" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    )}
                    
                    <div>
                      <h3 className="font-medium text-lg">
                        {a11yData.status === 'success' ? 'No issues detected' : 
                         a11yData.status === 'warning' ? 'Minor issues detected' : 
                         'Critical issues detected'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {a11yData.message}
                      </p>
                      <div className="mt-1">
                        <Badge variant={
                          a11yData.status === 'success' ? 'default' :
                          a11yData.status === 'warning' ? 'outline' : 'destructive'
                        }>
                          {a11yData.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-2">
                          Last checked: {new Date(a11yData.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {a11yData.details && a11yData.details.length > 0 && (
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left">Component</th>
                            <th className="px-4 py-2 text-left">Issue</th>
                            <th className="px-4 py-2 text-left">Severity</th>
                            <th className="px-4 py-2 text-left">Suggestion</th>
                          </tr>
                        </thead>
                        <tbody>
                          {a11yData.details.map((issue, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-4 py-3">
                                <div className="font-medium">{issue.component}</div>
                                {issue.path && (
                                  <div className="text-xs text-muted-foreground mt-1">{issue.path}</div>
                                )}
                              </td>
                              <td className="px-4 py-3">{issue.issue}</td>
                              <td className="px-4 py-3">
                                <Badge variant={
                                  issue.severity === 'high' ? 'destructive' :
                                  issue.severity === 'medium' ? 'outline' : 'secondary'
                                }>
                                  {issue.severity}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">{issue.suggestion}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">WCAG Compliance Guidelines</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Ensure all images have alt text (WCAG 1.1.1)</li>
                        <li>Provide labels for all form elements (WCAG 3.3.2)</li>
                        <li>Use sufficient color contrast (WCAG 1.4.3)</li>
                        <li>Ensure content is keyboard accessible (WCAG 2.1.1)</li>
                        <li>Provide proper heading structure (WCAG 1.3.1)</li>
                        <li>Add ARIA labels to interactive elements (WCAG 4.1.2)</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-md p-4">
                      <h3 className="font-medium mb-2">Common Fixes</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Add DialogTitle components to Dialog components</li>
                        <li>Add alt attributes to all images</li>
                        <li>Use VisuallyHidden component for screen reader text</li>
                        <li>Ensure proper focus management in modals</li>
                        <li>Use semantic HTML elements (button, nav, main)</li>
                        <li>Add aria-label to buttons with only icons</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <h3 className="font-medium text-lg mb-2">No accessibility check data</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run an accessibility check to scan the application for issues and get recommendations.
                  </p>
                  <Button 
                    onClick={handleRunA11yCheck} 
                    variant="outline"
                    className="mx-auto"
                  >
                    Run Accessibility Check
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 flex flex-col items-start">
              <h4 className="text-sm font-medium mb-2">Resources</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm w-full">
                <li>
                  <a 
                    href="https://www.w3.org/WAI/standards-guidelines/wcag/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    WCAG Guidelines
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.a11yproject.com/checklist/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    A11y Project Checklist
                  </a>
                </li>
                <li>
                  <a 
                    href="https://reactjs.org/docs/accessibility.html" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    React Accessibility Guide
                  </a>
                </li>
              </ul>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="tools">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Diagnostic Tools</h2>
            <p className="text-sm text-muted-foreground mb-4">
              These tools help diagnose and fix common system issues.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Database Check</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test database connectivity and verify table integrity.
                </p>
                <a 
                  href="/api/health?check=database"
                  target="_blank"
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 inline-block"
                >
                  Run Database Check
                </a>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">API Endpoints Check</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test API endpoints accessibility and response times.
                </p>
                <a 
                  href="/api/health?check=api"
                  target="_blank"
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 inline-block"
                >
                  Run API Check
                </a>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Authentication Check</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Test authentication system and session management.
                </p>
                <a 
                  href="/api/health?check=auth"
                  target="_blank"
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 inline-block"
                >
                  Run Auth Check
                </a>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Accessibility Check</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Scan the application for accessibility issues and ARIA compliance.
                </p>
                <a 
                  href="/api/health/a11y"
                  target="_blank"
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 inline-block"
                >
                  Run Accessibility Check
                </a>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Export Health Snapshot</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Create a new health snapshot of the current system state.
                </p>
                <a 
                  href="/api/system/snapshot?create=true"
                  target="_blank"
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 inline-block"
                >
                  Export Snapshot
                </a>
              </div>
            </div>
            
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium mb-3">Status Badge</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use this badge in your GitHub README or other documentation to show system status.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">Markdown Badge</h4>
                  <div className="bg-muted p-3 rounded-md mb-3 overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      ```markdown{"\n"}
                      ![System Status](https://your-app-url.com/api/system/badge){"\n"}
                      ```
                    </pre>
                  </div>
                  <div className="flex justify-between">
                    <a 
                      href="/api/system/badge"
                      target="_blank"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      View Badge
                    </a>
                    <button
                      className="text-xs text-blue-500 hover:underline"
                      onClick={() => {
                        navigator.clipboard.writeText("![System Status](https://your-app-url.com/api/system/badge)");
                      }}
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h4 className="text-sm font-medium mb-2">HTML Badge</h4>
                  <div className="bg-muted p-3 rounded-md mb-3 overflow-x-auto">
                    <pre className="text-xs whitespace-pre-wrap">
                      ```html{"\n"}
                      <iframe src="https://your-app-url.com/api/system/badge.html" width="100%" height="120" frameBorder="0"></iframe>{"\n"}
                      ```
                    </pre>
                  </div>
                  <div className="flex justify-between">
                    <a 
                      href="/api/system/badge.html"
                      target="_blank"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      View Badge
                    </a>
                    <button
                      className="text-xs text-blue-500 hover:underline"
                      onClick={() => {
                        navigator.clipboard.writeText('<iframe src="https://your-app-url.com/api/system/badge.html" width="100%" height="120" frameBorder="0"></iframe>');
                      }}
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 border rounded-md">
                <h4 className="text-sm font-medium mb-2">Live Preview</h4>
                <iframe src="/api/system/badge.html" width="100%" height="120" frameBorder="0"></iframe>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}