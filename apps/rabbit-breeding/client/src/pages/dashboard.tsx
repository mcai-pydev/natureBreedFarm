import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { getQueryFn } from '@/lib/queryClient';
import { Animal } from '@shared/schema';
import { Loader2, Rabbit, Male, Female, Users, Calendar, AlertCircle } from 'lucide-react';
import { getGenderColorClass, formatDate } from '@/lib/utils';

// Simple stats card component
const StatsCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon 
}: { 
  title: string; 
  value: string | number; 
  description?: string; 
  icon: React.ElementType;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </CardContent>
  </Card>
);

export default function RabbitDashboard() {
  // Fetch rabbits data
  const { data: animals, isLoading, error } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
    queryFn: getQueryFn(),
  });
  
  // If loading, show a loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If error, show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load data</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }
  
  // Calculate basic stats
  const totalRabbits = animals?.length || 0;
  const maleRabbits = animals?.filter(a => a.gender === 'male').length || 0;
  const femaleRabbits = animals?.filter(a => a.gender === 'female').length || 0;
  const activeRabbits = animals?.filter(a => a.status === 'active').length || 0;
  const breeds = Array.from(new Set(animals?.map(a => a.breed).filter(Boolean) || []));
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Rabbit Breeding Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your rabbit breeding operation and track key metrics
        </p>
      </div>
      
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Rabbits" 
          value={totalRabbits} 
          description="Total count of all rabbits in inventory"
          icon={Rabbit} 
        />
        <StatsCard 
          title="Bucks (Male)" 
          value={maleRabbits} 
          description={`${Math.round((maleRabbits / totalRabbits) * 100) || 0}% of total population`}
          icon={Male} 
        />
        <StatsCard 
          title="Does (Female)" 
          value={femaleRabbits} 
          description={`${Math.round((femaleRabbits / totalRabbits) * 100) || 0}% of total population`}
          icon={Female} 
        />
        <StatsCard 
          title="Rabbit Breeds" 
          value={breeds.length} 
          description="Number of unique breeds in your collection"
          icon={Users} 
        />
      </div>
      
      {/* Recent animals section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Animals</h2>
          <Link href="/animals">
            <a className="text-primary text-sm hover:underline">View all rabbits</a>
          </Link>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {animals?.slice(0, 6).map(animal => (
            <Card key={animal.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{animal.name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {animal.animalId}</p>
                    </div>
                    <Badge className={getGenderColorClass(animal.gender)}>
                      {animal.gender}
                    </Badge>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Breed</p>
                      <p>{animal.breed || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p>{formatDate(animal.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Cage</p>
                      <p>{animal.cageNumber || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="capitalize">{animal.status}</p>
                    </div>
                  </div>
                  
                  <Link href={`/animals/${animal.id}`}>
                    <a className="absolute inset-0 rounded-md border border-transparent hover:border-primary/10 transition-colors">
                      <span className="sr-only">View details for {animal.name}</span>
                    </a>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {(!animals || animals.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center h-40 gap-2 bg-muted/40 rounded-lg border">
              <Rabbit className="h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No rabbits found</p>
              <Link href="/animals/create">
                <a className="text-primary text-sm hover:underline">Add your first rabbit</a>
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Gender Distribution Chart would go here */}
      {/* <GenderDistributionChart animals={animals} /> */}
      
      {/* Breeding Events section would go here */}
      {/* <RecentBreedingEvents /> */}
    </div>
  );
}