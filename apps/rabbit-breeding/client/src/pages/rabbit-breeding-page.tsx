import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PawPrint, Info, AlertCircle, Check, X } from "lucide-react";
import { Animal } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { formatDate } from "../lib/utils";

// Helper function to handle potentially null date values
const safeGetAgeString = (date: string | Date | null | undefined): string => {
  if (!date) return 'Unknown';
  
  const birthDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  // Calculate difference in years
  let years = today.getFullYear() - birthDate.getFullYear();
  
  // Adjust for months and days
  if (
    today.getMonth() < birthDate.getMonth() || 
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  ) {
    years--;
  }
  
  // Calculate months for young animals
  const months = today.getMonth() - birthDate.getMonth();
  const adjustedMonths = months < 0 ? months + 12 : months;
  
  // Calculate days for very young animals
  const diffTime = Math.abs(today.getTime() - birthDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (years > 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (adjustedMonths > 0) {
    return `${adjustedMonths} ${adjustedMonths === 1 ? 'month' : 'months'}`;
  } else {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  }
};

export default function RabbitBreedingPage() {
  // Fetch animals data from API with proper queryFn
  const { 
    data: animals = [], 
    isLoading, 
    error 
  } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
    queryFn: async () => {
      const response = await fetch('/api/animals');
      if (!response.ok) throw new Error('Failed to fetch animals');
      return response.json();
    },
    select: (data) => data.filter(animal => animal.type === 'rabbit')
  });

  // Filter for rabbit type only
  const rabbits = animals.filter(animal => animal.type === 'rabbit');
  
  // Get stats
  const maleRabbits = rabbits.filter(a => a.gender === 'male');
  const femaleRabbits = rabbits.filter(a => a.gender === 'female');
  const activeRabbits = rabbits.filter(a => a.status === 'active');
  
  const getStatusBadgeClass = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'retired':
        return 'bg-orange-500';
      case 'sold':
        return 'bg-blue-500';
      case 'deceased':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Error Loading Rabbits</h1>
        <p className="text-muted-foreground">
          {(error as Error).message || "Failed to load rabbit data"}
        </p>
        <Link href="/">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-2 mb-6">
        <PawPrint className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Rabbit Breeding Management</h1>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Total Rabbits</p>
              <p className="text-3xl font-bold mt-1">{rabbits.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Males (Bucks)</p>
              <p className="text-3xl font-bold mt-1 text-blue-500">{maleRabbits.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Females (Does)</p>
              <p className="text-3xl font-bold mt-1 text-pink-500">{femaleRabbits.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Active</p>
              <p className="text-3xl font-bold mt-1 text-green-500">{activeRabbits.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for different views */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Rabbit Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Rabbits</TabsTrigger>
              <TabsTrigger value="males">Males</TabsTrigger>
              <TabsTrigger value="females">Females</TabsTrigger>
              <TabsTrigger value="breeding">Breeding Pairs</TabsTrigger>
            </TabsList>
            
            {/* All Rabbits Tab */}
            <TabsContent value="all">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-xs text-muted-foreground">ID</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Name</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Breed</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Gender</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Age</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Status</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rabbits.map((rabbit) => (
                      <tr key={rabbit.id} className="hover:bg-muted/50">
                        <td className="p-3 text-sm">{rabbit.animalId}</td>
                        <td className="p-3 text-sm font-medium">{rabbit.name}</td>
                        <td className="p-3 text-sm">{rabbit.breed}</td>
                        <td className="p-3 text-sm">
                          <Badge className={rabbit.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}>
                            {rabbit.gender === 'male' ? 'Buck' : 'Doe'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">{safeGetAgeString(rabbit.dateOfBirth)}</td>
                        <td className="p-3 text-sm">
                          <Badge className={getStatusBadgeClass(rabbit.status)}>
                            {rabbit.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Link href={`/rabbit/${rabbit.id}`}>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    
                    {rabbits.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No rabbits found in the system
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            {/* Males Tab */}
            <TabsContent value="males">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-xs text-muted-foreground">ID</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Name</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Breed</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Age</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Status</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {maleRabbits.map((rabbit) => (
                      <tr key={rabbit.id} className="hover:bg-muted/50">
                        <td className="p-3 text-sm">{rabbit.animalId}</td>
                        <td className="p-3 text-sm font-medium">{rabbit.name}</td>
                        <td className="p-3 text-sm">{rabbit.breed}</td>
                        <td className="p-3 text-sm">{safeGetAgeString(rabbit.dateOfBirth)}</td>
                        <td className="p-3 text-sm">
                          <Badge className={getStatusBadgeClass(rabbit.status)}>
                            {rabbit.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Link href={`/rabbit/${rabbit.id}`}>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    
                    {maleRabbits.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No male rabbits found in the system
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            {/* Females Tab */}
            <TabsContent value="females">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 text-xs text-muted-foreground">ID</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Name</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Breed</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Age</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Status</th>
                      <th className="text-left p-3 text-xs text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {femaleRabbits.map((rabbit) => (
                      <tr key={rabbit.id} className="hover:bg-muted/50">
                        <td className="p-3 text-sm">{rabbit.animalId}</td>
                        <td className="p-3 text-sm font-medium">{rabbit.name}</td>
                        <td className="p-3 text-sm">{rabbit.breed}</td>
                        <td className="p-3 text-sm">{safeGetAgeString(rabbit.dateOfBirth)}</td>
                        <td className="p-3 text-sm">
                          <Badge className={getStatusBadgeClass(rabbit.status)}>
                            {rabbit.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <Link href={`/rabbit/${rabbit.id}`}>
                            <Button size="sm" variant="outline">View</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                    
                    {femaleRabbits.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          No female rabbits found in the system
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
            
            {/* Breeding Pairs Tab */}
            <TabsContent value="breeding">
              <div className="p-4 bg-muted/30 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Breeding pairs and compatibility checking are available in the Breeding Events section.
                  </p>
                </div>
                <Link href="/breeding-events">
                  <Button className="mt-2">Go to Breeding Events</Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Quick actions */}
      <div className="flex flex-wrap gap-4 justify-end mt-6">
        <Link href="/breeding-events">
          <Button className="gap-2">
            <PawPrint className="h-4 w-4" />
            Manage Breeding Events
          </Button>
        </Link>
      </div>
    </div>
  );
}