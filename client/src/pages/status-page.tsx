import React from 'react';
import { BootStatusDashboard } from '@/components/system/boot-status-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function StatusPage() {
  // Get health snapshots list
  type SnapshotsResponse = {
    snapshots: string[];
  };
  
  const { data: snapshotsData, isLoading: isLoadingSnapshots } = useQuery<SnapshotsResponse>({
    queryKey: ['/api/system/snapshots'],
    refetchInterval: 0,
    refetchOnWindowFocus: false,
  });

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
            ) : snapshotsData?.snapshots?.length > 0 ? (
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}