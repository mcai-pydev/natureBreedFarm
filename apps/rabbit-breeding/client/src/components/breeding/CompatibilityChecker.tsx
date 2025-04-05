import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Animal } from '@shared/schema';
import { ParentCompatibilityResult } from '../../lib/breeding/validatePairing';

// Using simplified components to avoid import issues
function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow ${className}`}>{children}</div>;
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col space-y-1.5 p-6">{children}</div>;
}

function CardTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
}

function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="p-6 pt-0">{children}</div>;
}

function CardFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center p-6 pt-0">{children}</div>;
}

function Button({ 
  children, 
  onClick, 
  disabled = false, 
  className = "" 
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  disabled?: boolean, 
  className?: string 
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 ${className}`}
    >
      {children}
    </button>
  );
}

function Badge({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}

// Simplified Select components
function Select({ 
  value, 
  onValueChange, 
  disabled = false, 
  children 
}: { 
  value: string, 
  onValueChange: (value: string) => void, 
  disabled?: boolean, 
  children: React.ReactNode 
}) {
  return (
    <div className="relative">
      {children}
      <select 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)} 
        disabled={disabled}
        className="absolute opacity-0 w-full h-full cursor-pointer" 
      />
    </div>
  );
}

function SelectTrigger({ id, className = "", children }: { id?: string, className?: string, children: React.ReactNode }) {
  return (
    <div id={id} className={`flex h-10 w-full items-center justify-between rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>
      {children}
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 opacity-50"><path d="m6 9 6 6 6-6"/></svg>
    </div>
  );
}

function SelectValue({ placeholder }: { placeholder: string }) {
  return <span className="text-muted-foreground">{placeholder}</span>;
}

function SelectContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
      <div className="max-h-96 overflow-auto p-1">{children}</div>
    </div>
  );
}

function SelectItem({ children, value }: { children: React.ReactNode, value: string }) {
  return (
    <div className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
      {children}
    </div>
  );
}

interface CompatibilityCheckerProps {
  onCompatibilityResult?: (result: ParentCompatibilityResult) => void;
}

export function CompatibilityChecker({ onCompatibilityResult }: CompatibilityCheckerProps) {
  const [maleId, setMaleId] = useState<string>('');
  const [femaleId, setFemaleId] = useState<string>('');
  const [compatibilityResult, setCompatibilityResult] = useState<ParentCompatibilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Query to fetch all animals
  const { data: animals, isLoading } = useQuery<Animal[]>({
    queryKey: ['/api/animals'],
  });
  
  // Filter males and females
  const males = animals?.filter(animal => animal.gender === 'male' && animal.status === 'active') || [];
  const females = animals?.filter(animal => animal.gender === 'female' && animal.status === 'active') || [];
  
  const checkCompatibility = async () => {
    if (!maleId || !femaleId) return;
    
    setIsChecking(true);
    setCompatibilityResult(null);
    
    try {
      const response = await fetch(`/api/breeding/compatibility-check?maleId=${maleId}&femaleId=${femaleId}`);
      const result = await response.json();
      
      setCompatibilityResult(result);
      
      // Call the callback if provided
      if (onCompatibilityResult) {
        onCompatibilityResult(result);
      }
    } catch (error) {
      console.error('Error checking compatibility:', error);
      setCompatibilityResult({
        compatible: false,
        reason: 'Error checking compatibility. Please try again.',
        riskLevel: 'high'
      });
    } finally {
      setIsChecking(false);
    }
  };
  
  const getCompatibilityIcon = () => {
    if (!compatibilityResult) return <HelpCircle className="h-10 w-10 text-muted-foreground" />;
    
    if (compatibilityResult.compatible) {
      return <CheckCircle className="h-10 w-10 text-green-500" />;
    } else {
      return <XCircle className="h-10 w-10 text-red-500" />;
    }
  };
  
  const getCompatibilityBadge = () => {
    if (!compatibilityResult) return null;
    
    if (compatibilityResult.compatible) {
      return <Badge className="bg-green-500">Compatible</Badge>;
    }
    
    switch (compatibilityResult.riskLevel) {
      case 'low':
        return <Badge className="bg-yellow-500">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-500">High Risk</Badge>;
      default:
        return <Badge className="bg-red-500">Incompatible</Badge>;
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Breeding Compatibility Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="male-select" className="block text-sm font-medium">
              Male Rabbit
            </label>
            <Select
              value={maleId}
              onValueChange={(value) => setMaleId(value)}
              disabled={isLoading || isChecking}
            >
              <SelectTrigger id="male-select" className="w-full">
                <SelectValue placeholder="Select male rabbit" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : males.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No male rabbits available</div>
                ) : (
                  males.map((male) => (
                    <SelectItem key={male.id} value={male.id.toString()}>
                      {male.name} ({male.animalId})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="female-select" className="block text-sm font-medium">
              Female Rabbit
            </label>
            <Select
              value={femaleId}
              onValueChange={(value) => setFemaleId(value)}
              disabled={isLoading || isChecking}
            >
              <SelectTrigger id="female-select" className="w-full">
                <SelectValue placeholder="Select female rabbit" />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : females.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No female rabbits available</div>
                ) : (
                  females.map((female) => (
                    <SelectItem key={female.id} value={female.id.toString()}>
                      {female.name} ({female.animalId})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {compatibilityResult && (
          <div className="mt-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getCompatibilityIcon()}
                <div>
                  {getCompatibilityBadge()}
                  <p className="mt-1 text-sm">
                    {compatibilityResult.reason || 
                     (compatibilityResult.compatible 
                      ? 'These rabbits are safe to breed together.' 
                      : 'These rabbits should not be bred together.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={checkCompatibility} 
          disabled={!maleId || !femaleId || isChecking || isLoading}
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Compatibility...
            </>
          ) : (
            'Check Compatibility'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}