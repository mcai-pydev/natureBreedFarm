import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { 
  RouteRenderStatus, 
  ButtonBindingStatus, 
  CoverageApiResponse 
} from '@/types/health';

// Helper function to style route status
const getRouteStatusColor = (status: RouteRenderStatus): string => {
  switch (status) {
    case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'incomplete': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'not-tested': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// Helper function to style button status
const getButtonStatusColor = (status: ButtonBindingStatus): string => {
  switch (status) {
    case 'bound': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'unbound': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'not-tested': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

// Helper function to style role status
const getRoleStatusColor = (role: string): string => {
  switch (role) {
    case 'public': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'authenticated': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'admin': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

export default function CoverageDashboard() {
  const [activeTab, setActiveTab] = useState('routes');
  
  // Fetch the coverage data
  const { data: coverageData, isLoading, error, refetch } = useQuery<CoverageApiResponse>({
    queryKey: ['/api/health/coverage'],
  });
  
  // Calculate percentages for progress bars
  const routeTestedPercentage = coverageData ? 
    Math.round((coverageData.summary.routes.tested / coverageData.summary.routes.total) * 100) : 0;
  
  const routeSuccessPercentage = coverageData && coverageData.summary.routes.tested > 0 ? 
    Math.round((coverageData.summary.routes.successful / coverageData.summary.routes.tested) * 100) : 0;
  
  const buttonBoundPercentage = coverageData && coverageData.summary.buttons.total > 0 ? 
    Math.round((coverageData.summary.buttons.bound / coverageData.summary.buttons.total) * 100) : 0;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading coverage data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Coverage Data</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Developer Coverage Dashboard</h1>
      
      {coverageData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Routes Tested</CardTitle>
                <CardDescription>Progress of route testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="font-bold text-2xl">{coverageData.summary.routes.tested}</span>
                  <span className="text-muted-foreground">/{coverageData.summary.routes.total}</span>
                </div>
                <Progress value={routeTestedPercentage} className="h-2" />
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                {routeTestedPercentage}% of routes tested
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Route Success Rate</CardTitle>
                <CardDescription>Routes rendering correctly</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="font-bold text-2xl">{coverageData.summary.routes.successful}</span>
                  <span className="text-muted-foreground">/{coverageData.summary.routes.tested}</span>
                </div>
                <Progress value={routeSuccessPercentage} className="h-2" />
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                {routeSuccessPercentage}% success rate of tested routes
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Button Binding</CardTitle>
                <CardDescription>Buttons with handlers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="font-bold text-2xl">{coverageData.summary.buttons.bound}</span>
                  <span className="text-muted-foreground">/{coverageData.summary.buttons.total}</span>
                </div>
                <Progress value={buttonBoundPercentage} className="h-2" />
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                {buttonBoundPercentage}% of buttons have handlers
              </CardFooter>
            </Card>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="routes">Routes</TabsTrigger>
              <TabsTrigger value="buttons">Buttons</TabsTrigger>
              <TabsTrigger value="roles">Role Coverage</TabsTrigger>
            </TabsList>
            
            <TabsContent value="routes">
              <Card>
                <CardHeader>
                  <CardTitle>Route Coverage</CardTitle>
                  <CardDescription>Status of all routes in the application</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableCaption>Route render status as of {new Date(coverageData.timestamp).toLocaleString()}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Path</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Render Status</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Last Tested</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coverageData.routes.client.map(route => (
                        <TableRow key={route.path}>
                          <TableCell className="font-mono">{route.path}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Client</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRouteStatusColor(route.renders)}>
                              {route.renders}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleStatusColor(route.role)}>
                              {route.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{route.lastTested ? new Date(route.lastTested).toLocaleString() : 'Never'}</TableCell>
                        </TableRow>
                      ))}
                      {coverageData.routes.api.map(route => (
                        <TableRow key={route.path}>
                          <TableCell className="font-mono">{route.path}</TableCell>
                          <TableCell>
                            <Badge variant="outline">API</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRouteStatusColor(route.renders)}>
                              {route.renders}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleStatusColor(route.role)}>
                              {route.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{route.lastTested ? new Date(route.lastTested).toLocaleString() : 'Never'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="buttons">
              <Card>
                <CardHeader>
                  <CardTitle>Button Binding Status</CardTitle>
                  <CardDescription>Status of all interactive elements in the application</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableCaption>Button binding status as of {new Date(coverageData.timestamp).toLocaleString()}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Handler</TableHead>
                        <TableHead>Last Tested</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coverageData.buttons.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">No button data available yet</TableCell>
                        </TableRow>
                      ) : (
                        coverageData.buttons.map(button => (
                          <TableRow key={button.id}>
                            <TableCell className="font-mono">{button.id}</TableCell>
                            <TableCell>{button.route}</TableCell>
                            <TableCell>
                              <Badge className={getButtonStatusColor(button.status)}>
                                {button.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono">{button.handler || 'None'}</TableCell>
                            <TableCell>{button.lastTested ? new Date(button.lastTested).toLocaleString() : 'Never'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="roles">
              <Card>
                <CardHeader>
                  <CardTitle>Role-Based Access Control Coverage</CardTitle>
                  <CardDescription>Routes categorized by required authentication role</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Public Routes</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {coverageData.routes.client
                          .filter(route => route.role === 'public')
                          .map(route => (
                            <li key={route.path} className="font-mono text-sm">
                              {route.path}
                            </li>
                          ))}
                        {coverageData.routes.api
                          .filter(route => route.role === 'public')
                          .map(route => (
                            <li key={route.path} className="font-mono text-sm">
                              {route.path}
                            </li>
                          ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Authenticated Routes</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {coverageData.routes.client
                          .filter(route => route.role === 'authenticated')
                          .map(route => (
                            <li key={route.path} className="font-mono text-sm">
                              {route.path}
                            </li>
                          ))}
                        {coverageData.routes.api
                          .filter(route => route.role === 'authenticated')
                          .map(route => (
                            <li key={route.path} className="font-mono text-sm">
                              {route.path}
                            </li>
                          ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Admin Routes</h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {coverageData.routes.client
                          .filter(route => route.role === 'admin')
                          .map(route => (
                            <li key={route.path} className="font-mono text-sm">
                              {route.path}
                            </li>
                          ))}
                        {coverageData.routes.api
                          .filter(route => route.role === 'admin')
                          .map(route => (
                            <li key={route.path} className="font-mono text-sm">
                              {route.path}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 flex justify-between">
            <Button onClick={() => refetch()} variant="outline">
              Refresh Data
            </Button>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(coverageData.timestamp).toLocaleString()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}