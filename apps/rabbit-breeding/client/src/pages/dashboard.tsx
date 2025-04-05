import { Rabbit, User, Users, Heart, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { formatDate, getAgeString, cn } from '@/lib/utils';

// Helper function to get gender-specific color class
function getGenderColorClass(gender: string): string {
  switch(gender.toLowerCase()) {
    case 'male':
      return 'bg-blue-500';
    case 'female':
      return 'bg-pink-500';
    default:
      return 'bg-gray-500';
  }
}

// Mock data for the prototype
const mockAnimals = [
  { 
    id: 1, 
    animalId: 'RB-M-001', 
    name: 'Buck', 
    gender: 'male', 
    breed: 'New Zealand White', 
    dateOfBirth: '2024-01-15', 
    status: 'active',
    cageNumber: 'A-12'
  },
  { 
    id: 2, 
    animalId: 'RB-F-002', 
    name: 'Daisy', 
    gender: 'female', 
    breed: 'Californian', 
    dateOfBirth: '2023-11-20', 
    status: 'active',
    cageNumber: 'B-05'
  }
];

const mockBreedingSuggestions = [
  {
    maleId: 1,
    maleName: 'Buck',
    femaleId: 2,
    femaleName: 'Daisy',
    compatibilityScore: 92
  }
];

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

// Breeding suggestions component
interface BreedingSuggestion {
  maleId: number;
  maleName: string;
  femaleId: number;
  femaleName: string;
  compatibilityScore: number;
}

const BreedingSuggestions = () => {
  const suggestions = mockBreedingSuggestions;
  const isLoading = false;
  const error = null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 bg-muted/40 rounded-lg border">
        <AlertCircle className="h-6 w-6 text-destructive" />
        <p className="text-muted-foreground">Failed to load breeding suggestions</p>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 bg-muted/40 rounded-lg border">
        <Heart className="h-6 w-6 text-muted-foreground" />
        <p className="text-muted-foreground">No breeding suggestions available</p>
        <p className="text-xs text-muted-foreground">Add more rabbits to get pairing suggestions</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {suggestions.map((suggestion) => (
        <Card key={`${suggestion.maleId}-${suggestion.femaleId}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base font-medium">Suggested Pairing</CardTitle>
              <Badge className="bg-green-500">
                {suggestion.compatibilityScore}% Match
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col items-center text-center">
                <Badge className="bg-blue-500 mb-2">Male</Badge>
                <p className="font-medium">{suggestion.maleName} 🐇</p>
              </div>
              <Heart className="h-5 w-5 text-pink-500" />
              <div className="flex flex-col items-center text-center">
                <Badge className="bg-pink-500 mb-2">Female</Badge>
                <p className="font-medium">{suggestion.femaleName} 🐇</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Link href={`/breeding/new?maleId=${suggestion.maleId}&femaleId=${suggestion.femaleId}`}>
              <a className="text-primary text-sm hover:underline flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Create Breeding Event
              </a>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default function RabbitDashboard() {
  // Get animals data from mock
  const animals = mockAnimals;
  const isLoading = false;
  const error = null;
  
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
        <p className="text-muted-foreground">Error loading data</p>
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
          icon={User} 
        />
        <StatsCard 
          title="Does (Female)" 
          value={femaleRabbits} 
          description={`${Math.round((femaleRabbits / totalRabbits) * 100) || 0}% of total population`}
          icon={User} 
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
          {animals?.map(animal => (
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
                      <p>{animal.dateOfBirth ? formatDate(animal.dateOfBirth) : 'Unknown'}</p>
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
      
      {/* Breeding Suggestions Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Breeding Suggestions</h2>
        <BreedingSuggestions />
      </div>
      
      {/* Gender Distribution Chart would go here */}
      {/* <GenderDistributionChart animals={animals} /> */}
    </div>
  );
}