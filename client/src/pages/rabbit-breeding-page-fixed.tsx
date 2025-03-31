import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CircleAlert, CheckCircle, Info, X, ChevronDown, ChevronUp, Search, Plus, Calendar, ArrowRight, CalendarDays } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { insertAnimalSchema } from "@shared/schema";
import * as z from "zod";
import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type Animal = {
  id: number;
  name: string;
  type: string;
  breed: string;
  gender: "male" | "female";
  status: "active" | "inactive" | "sold" | "deceased";
  dateOfBirth: Date;
  fatherId?: number | null;
  motherId?: number | null;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type BreedingEvent = {
  id: number;
  maleId: number;
  femaleId: number;
  breedingDate: Date;
  expectedBirthDate?: Date;
  actualBirthDate?: Date;
  offspringCount?: number;
  status: "pending" | "successful" | "unsuccessful";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type InbreedingRiskResult = {
  isRisky: boolean;
  relationshipType?: string;
  message?: string;
};

// Extended zod schema for validation with date conversion
const animalFormSchema = insertAnimalSchema.extend({
  dateOfBirth: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  fatherId: z.number().nullable().optional(),
  motherId: z.number().nullable().optional(),
  notes: z.string().optional(),
});

// Extended schema for breeding events
const breedingEventSchema = z.object({
  maleId: z.number({
    required_error: "Please select a male rabbit",
  }),
  femaleId: z.number({
    required_error: "Please select a female rabbit",
  }),
  breedingDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  expectedBirthDate: z.string().optional(),
  actualBirthDate: z.string().optional(),
  offspringCount: z.number().optional(),
  status: z.enum(["pending", "successful", "unsuccessful"]),
  notes: z.string().optional(),
});

// Component to display family tree node
const FamilyTreeNode = ({ animal, animals, level = 0, expanded = {}, toggleExpand }: {
  animal: Animal;
  animals: Animal[];
  level?: number;
  expanded: Record<number, boolean>;
  toggleExpand: (id: number) => void;
}) => {
  const father = animal.fatherId ? animals.find(a => a.id === animal.fatherId) : null;
  const mother = animal.motherId ? animals.find(a => a.id === animal.motherId) : null;
  const hasParents = father || mother;
  
  const indentSize = level * 20;
  
  return (
    <div className="family-tree-node">
      <div 
        className={`flex items-center p-2 my-1 rounded-md border ${
          animal.gender === 'male' ? 'border-blue-200 bg-blue-50' : 'border-pink-200 bg-pink-50'
        }`}
        style={{ marginLeft: `${indentSize}px` }}
      >
        <div className="flex-1">
          <div className="font-medium">
            {animal.name} {animal.fatherId || animal.motherId ? '' : '(Founder)'}
          </div>
          <div className="text-sm text-muted-foreground">
            {animal.breed} • Born: {format(new Date(animal.dateOfBirth), 'MMM dd, yyyy')}
          </div>
        </div>
        {hasParents && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleExpand(animal.id)}
            className="ml-auto"
          >
            {expanded[animal.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        )}
      </div>
      
      {expanded[animal.id] && hasParents && (
        <div className="parents">
          {father && (
            <FamilyTreeNode 
              animal={father} 
              animals={animals} 
              level={level + 1} 
              expanded={expanded}
              toggleExpand={toggleExpand}
            />
          )}
          {mother && (
            <FamilyTreeNode 
              animal={mother} 
              animals={animals} 
              level={level + 1}
              expanded={expanded}
              toggleExpand={toggleExpand}
            />
          )}
        </div>
      )}
    </div>
  );
};

// Component to display breeding pair compatibility
const BreedingPairCompatibility = ({ maleId, femaleId }: { maleId?: number; femaleId?: number }) => {
  const { data: riskResult, isLoading } = useQuery<InbreedingRiskResult>({
    queryKey: ['/api/breeding-risk', maleId, femaleId],
    queryFn: async () => {
      if (!maleId || !femaleId) return { isRisky: false };
      const res = await fetch(`/api/breeding-risk?maleId=${maleId}&femaleId=${femaleId}`);
      return res.json();
    },
    enabled: Boolean(maleId && femaleId),
  });

  if (!maleId || !femaleId || isLoading) {
    return null;
  }

  return (
    <Alert variant={riskResult?.isRisky ? "destructive" : "default"} className="mt-4">
      {riskResult?.isRisky ? (
        <>
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Inbreeding Risk Detected</AlertTitle>
          <AlertDescription>
            {riskResult?.message || `These rabbits are ${riskResult?.relationshipType}. Breeding is not recommended.`}
          </AlertDescription>
        </>
      ) : (
        <>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Compatible Pair</AlertTitle>
          <AlertDescription>
            {riskResult?.message || 'These rabbits are compatible for breeding with no inbreeding risk.'}
          </AlertDescription>
        </>
      )}
    </Alert>
  );
};

// Navigation bar component for our page
function NavigationBar() {
  const [location] = useLocation();
  
  const navItems = [
    { title: "Dashboard", path: "/" },
    { title: "Shop", path: "/shop" },
    { title: "Products", path: "/products" },
    { title: "Transactions", path: "/transactions" },
    { title: "Reports", path: "/reports" },
    { title: "AI Assistant", path: "/ai-assistant" },
    { title: "Rabbit Breeding", path: "/rabbit-breeding" },
    { title: "Settings", path: "/settings" },
  ];
  
  return (
    <header className="bg-background border-b">
      <div className="container mx-auto px-4 py-3">
        <nav className="flex justify-center space-x-1">
          {navItems.map((item) => (
            <Link href={item.path} key={item.path}>
              <Button
                variant={location === item.path ? "default" : "ghost"}
                className={cn(
                  "text-sm",
                  location === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.title}
              </Button>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

// Simple PageShell component
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <main className="flex-1 pt-16 pb-8">
        {children}
      </main>
    </div>
  );
}

// ROI prediction type
type ROIPrediction = {
  maleId: number;
  femaleId: number;
  healthFactor: number;
  expectedOffspring: number;
  investment: number;
  expectedReturn: number;
  netProfit: number;
  roiMultiplier: number;
  compatibilityScore: number;
  geneticRisk: boolean;
  rating: "Excellent" | "Good" | "Average" | "Poor";
  recommendation: string;
};

// Function to calculate breeding ROI from existing breeding events
function calculateBreedingROI(event: BreedingEvent, male?: Animal, female?: Animal): number {
  if (!event.offspringCount || event.offspringCount <= 0) return 0;
  
  // Basic ROI calculation based on offspring count
  // Assuming each offspring is worth about $30 on average
  const offspringValue = event.offspringCount * 30;
  
  // Estimated investment per breeding
  const investmentCost = 80; // Feed, medical, time, etc.
  
  // ROI = (Return - Investment) / Investment
  return offspringValue / investmentCost;
}

export default function RabbitBreedingPage() {
  const [activeTab, setActiveTab] = useState("family-tree");
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaleId, setSelectedMaleId] = useState<number | undefined>();
  const [selectedFemaleId, setSelectedFemaleId] = useState<number | undefined>();
  const [addAnimalOpen, setAddAnimalOpen] = useState(false);
  const [addBreedingEventOpen, setAddBreedingEventOpen] = useState(false);
  const [roiPrediction, setRoiPrediction] = useState<ROIPrediction | null>(null);
  
  // Form for ROI calculator
  const form = useForm({
    defaultValues: {
      maleId: undefined as number | undefined,
      femaleId: undefined as number | undefined,
      healthFactor: 8,
      expectedOffspring: 6,
      investmentAmount: 100,
    }
  });

  // Fetch all animals, filtering to rabbits only
  const { data: animals = [], isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ['/api/animals', { type: 'rabbit' }],
    queryFn: async () => {
      const res = await fetch('/api/animals?type=rabbit');
      if (!res.ok) throw new Error('Failed to fetch rabbits');
      return res.json();
    },
  });
  
  // Fetch breeding events
  const { data: breedingEvents = [], isLoading: breedingEventsLoading } = useQuery<BreedingEvent[]>({
    queryKey: ['/api/breeding-events'],
    queryFn: async () => {
      const res = await fetch('/api/breeding-events');
      if (!res.ok) throw new Error('Failed to fetch breeding events');
      return res.json();
    },
  });

  // Form for adding new animal
  const animalForm = useForm<z.infer<typeof animalFormSchema>>({
    resolver: zodResolver(animalFormSchema),
    defaultValues: {
      name: "",
      type: "rabbit", // We focus on rabbits in this page
      breed: "",
      gender: "female",
      status: "active",
      dateOfBirth: format(new Date(), 'yyyy-MM-dd'),
      notes: "",
    },
  });

  // Form for creating breeding event
  const breedingEventForm = useForm<z.infer<typeof breedingEventSchema>>({
    resolver: zodResolver(breedingEventSchema),
    defaultValues: {
      breedingDate: format(new Date(), 'yyyy-MM-dd'),
      status: "pending",
      notes: "",
    },
  });

  // Add animal mutation
  const addAnimalMutation = useMutation({
    mutationFn: async (values: z.infer<typeof animalFormSchema>) => {
      const animalData = {
        ...values,
        dateOfBirth: new Date(values.dateOfBirth),
        fatherId: values.fatherId || null,
        motherId: values.motherId || null,
      };
      
      const res = await apiRequest(
        'POST',
        '/api/animals',
        animalData
      );
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Animal added",
        description: "The animal has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/animals'] });
      setAddAnimalOpen(false);
      animalForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to add animal",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add breeding event mutation
  const addBreedingEventMutation = useMutation({
    mutationFn: async (values: z.infer<typeof breedingEventSchema>) => {
      const eventData = {
        ...values,
        breedingDate: new Date(values.breedingDate),
        expectedBirthDate: values.expectedBirthDate ? new Date(values.expectedBirthDate) : undefined,
        actualBirthDate: values.actualBirthDate ? new Date(values.actualBirthDate) : undefined,
      };
      
      const res = await apiRequest(
        'POST',
        '/api/breeding-events',
        eventData
      );
      
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Breeding event created",
        description: "The breeding event has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/breeding-events'] });
      setAddBreedingEventOpen(false);
      breedingEventForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create breeding event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle expanded state for family tree nodes
  const toggleExpand = (animalId: number) => {
    setExpandedNodes(prev => ({
      ...prev,
      [animalId]: !prev[animalId]
    }));
  };

  // Filter animals for search
  const filteredAnimals = searchTerm
    ? animals.filter(animal => 
        animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        animal.breed.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : animals;

  // Get males and females for breeding pair selection
  const maleRabbits = animals.filter(animal => animal.gender === 'male' && animal.status === 'active');
  const femaleRabbits = animals.filter(animal => animal.gender === 'female' && animal.status === 'active');

  // Handle form submissions
  const onAddAnimalSubmit = (values: z.infer<typeof animalFormSchema>) => {
    addAnimalMutation.mutate(values);
  };

  const onAddBreedingEventSubmit = (values: z.infer<typeof breedingEventSchema>) => {
    addBreedingEventMutation.mutate(values);
  };

  // Predict ROI for breeding pair
  const predictROI = async (
    maleId: number | undefined, 
    femaleId: number | undefined,
    healthFactor: number = 8,
    expectedOffspring: number = 6,
    investmentAmount: number = 100
  ) => {
    if (!maleId || !femaleId) {
      toast({
        title: "Incomplete selection",
        description: "Please select both a male and female rabbit for prediction.",
        variant: "destructive",
      });
      return;
    }

    // Check for genetic compatibility
    const riskResponse = await fetch(`/api/breeding-risk?maleId=${maleId}&femaleId=${femaleId}`);
    const riskResult: InbreedingRiskResult = await riskResponse.json();
    
    // Calculate expected return based on health and offspring factors
    const valuePerOffspring = 30; // Average value of a rabbit offspring
    const expectedReturn = expectedOffspring * valuePerOffspring * (healthFactor / 10);
    const netProfit = expectedReturn - investmentAmount;
    const roiMultiplier = expectedReturn / investmentAmount;
    
    // Calculate compatibility score (0-100)
    const compatibilityScore = riskResult.isRisky ? 30 : 80 + (healthFactor * 2);
    
    // Determine rating based on ROI and compatibility
    let rating: "Excellent" | "Good" | "Average" | "Poor" = "Average";
    let recommendation = "";
    
    if (riskResult.isRisky) {
      rating = "Poor";
      recommendation = `Not recommended for breeding. Genetic risk detected: ${riskResult.relationshipType}.`;
    } else if (roiMultiplier >= 3) {
      rating = "Excellent";
      recommendation = "Highly recommended breeding pair. Expect excellent ROI and healthy offspring.";
    } else if (roiMultiplier >= 2) {
      rating = "Good";
      recommendation = "Good potential for profitable breeding with healthy offspring.";
    } else {
      rating = "Average";
      recommendation = "Average ROI potential. Consider alternatives for better profitability.";
    }
    
    const prediction: ROIPrediction = {
      maleId,
      femaleId,
      healthFactor,
      expectedOffspring,
      investment: investmentAmount,
      expectedReturn,
      netProfit,
      roiMultiplier,
      compatibilityScore,
      geneticRisk: riskResult.isRisky,
      rating,
      recommendation
    };
    
    setRoiPrediction(prediction);
  };

  // Effect to watch for male/female selection in breeding event form
  useEffect(() => {
    const maleId = breedingEventForm.watch('maleId');
    const femaleId = breedingEventForm.watch('femaleId');
    
    setSelectedMaleId(maleId);
    setSelectedFemaleId(femaleId);
  }, [breedingEventForm.watch]);

  return (
    <PageShell>
      <Helmet>
        <title>Rabbit Breeding Management | Nature Breed Farm</title>
      </Helmet>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Rabbit Breeding Management</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="family-tree">Family Tree</TabsTrigger>
            <TabsTrigger value="breeding-pairs">Breeding Pairs</TabsTrigger>
            <TabsTrigger value="breeding-events">Breeding Events</TabsTrigger>
            <TabsTrigger value="roi-metrics">ROI Metrics</TabsTrigger>
          </TabsList>
          
          {/* Family Tree Tab */}
          <TabsContent value="family-tree" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rabbit Family Tree</CardTitle>
                <CardDescription>
                  Visualize rabbit lineage and family relationships to prevent inbreeding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rabbits by name or breed..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={addAnimalOpen} onOpenChange={setAddAnimalOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Rabbit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Rabbit</DialogTitle>
                        <DialogDescription>
                          Enter the details for the new rabbit. All fields are required unless marked as optional.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...animalForm}>
                        <form onSubmit={animalForm.handleSubmit(onAddAnimalSubmit)} className="space-y-4">
                          <FormField
                            control={animalForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={animalForm.control}
                            name="breed"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Breed</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={animalForm.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Gender</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="male">Male</SelectItem>
                                      <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={animalForm.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="active">Active</SelectItem>
                                      <SelectItem value="inactive">Inactive</SelectItem>
                                      <SelectItem value="sold">Sold</SelectItem>
                                      <SelectItem value="deceased">Deceased</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={animalForm.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={animalForm.control}
                              name="fatherId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Father (optional)</FormLabel>
                                  <Select 
                                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                                    value={field.value?.toString() || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select father" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="">None (unknown)</SelectItem>
                                      {maleRabbits.map(male => (
                                        <SelectItem key={male.id} value={male.id.toString()}>
                                          {male.name} ({male.breed})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={animalForm.control}
                              name="motherId"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Mother (optional)</FormLabel>
                                  <Select 
                                    onValueChange={(value) => field.onChange(value ? parseInt(value) : null)} 
                                    value={field.value?.toString() || ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select mother" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="">None (unknown)</SelectItem>
                                      {femaleRabbits.map(female => (
                                        <SelectItem key={female.id} value={female.id.toString()}>
                                          {female.name} ({female.breed})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={animalForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes (optional)</FormLabel>
                                <FormControl>
                                  <Textarea {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button type="submit" disabled={addAnimalMutation.isPending}>
                              {addAnimalMutation.isPending ? "Adding..." : "Add Rabbit"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="family-tree mt-4 border rounded-md p-4 max-h-[600px] overflow-auto">
                  {animalsLoading ? (
                    <div className="text-center p-4">Loading family tree...</div>
                  ) : filteredAnimals.length === 0 ? (
                    <div className="text-center p-4">
                      No rabbits found. Add some rabbits to get started with breeding management.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredAnimals.map(animal => (
                        <FamilyTreeNode 
                          key={animal.id} 
                          animal={animal} 
                          animals={animals} 
                          expanded={expandedNodes}
                          toggleExpand={toggleExpand}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Breeding Pairs Tab */}
          <TabsContent value="breeding-pairs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Breeding Compatibility Checker</CardTitle>
                <CardDescription>
                  Check if two rabbits are compatible for breeding without risk of inbreeding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Select Male Rabbit</h3>
                    <Select onValueChange={(value) => setSelectedMaleId(parseInt(value))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a male rabbit" />
                      </SelectTrigger>
                      <SelectContent>
                        {maleRabbits.map(male => (
                          <SelectItem key={male.id} value={male.id.toString()}>
                            {male.name} ({male.breed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Select Female Rabbit</h3>
                    <Select onValueChange={(value) => setSelectedFemaleId(parseInt(value))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a female rabbit" />
                      </SelectTrigger>
                      <SelectContent>
                        {femaleRabbits.map(female => (
                          <SelectItem key={female.id} value={female.id.toString()}>
                            {female.name} ({female.breed})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <BreedingPairCompatibility 
                  maleId={selectedMaleId} 
                  femaleId={selectedFemaleId} 
                />
                
                {selectedMaleId && selectedFemaleId && (
                  <div className="mt-4 flex justify-end">
                    <Dialog open={addBreedingEventOpen} onOpenChange={setAddBreedingEventOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Calendar className="mr-2 h-4 w-4" />
                          Record Breeding Event
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Record Breeding Event</DialogTitle>
                          <DialogDescription>
                            Record a breeding event between the selected rabbits.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <Form {...breedingEventForm}>
                          <form onSubmit={breedingEventForm.handleSubmit(onAddBreedingEventSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={breedingEventForm.control}
                                name="maleId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Male Rabbit</FormLabel>
                                    <Select 
                                      onValueChange={(value) => field.onChange(parseInt(value))} 
                                      defaultValue={selectedMaleId?.toString()}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select male" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {maleRabbits.map(male => (
                                          <SelectItem key={male.id} value={male.id.toString()}>
                                            {male.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={breedingEventForm.control}
                                name="femaleId"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Female Rabbit</FormLabel>
                                    <Select 
                                      onValueChange={(value) => field.onChange(parseInt(value))} 
                                      defaultValue={selectedFemaleId?.toString()}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select female" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {femaleRabbits.map(female => (
                                          <SelectItem key={female.id} value={female.id.toString()}>
                                            {female.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={breedingEventForm.control}
                              name="breedingDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Breeding Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    The date when the rabbits were bred
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={breedingEventForm.control}
                              name="status"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Status</FormLabel>
                                  <Select 
                                    onValueChange={field.onChange} 
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="successful">Successful</SelectItem>
                                      <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={breedingEventForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes (optional)</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} value={field.value || ''} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <DialogFooter>
                              <Button type="submit" disabled={addBreedingEventMutation.isPending}>
                                {addBreedingEventMutation.isPending ? "Saving..." : "Save Breeding Event"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Compatible Breeding Pairs</CardTitle>
                <CardDescription>
                  Recommended breeding pairs with no inbreeding risk
                </CardDescription>
              </CardHeader>
              <CardContent>
                {animalsLoading ? (
                  <div className="text-center p-4">Loading potential pairs...</div>
                ) : maleRabbits.length === 0 || femaleRabbits.length === 0 ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Breeding Pairs Available</AlertTitle>
                    <AlertDescription>
                      You need at least one active male rabbit and one active female rabbit to view compatible breeding pairs.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-4">
                    {/* We'll load this dynamically based on compatibility checks in a real implementation */}
                    <div className="text-sm text-muted-foreground mb-2">
                      Select a male and female rabbit above to check their compatibility.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Breeding Events Tab */}
          <TabsContent value="breeding-events" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Breeding Events</CardTitle>
                  <CardDescription>
                    History of breeding events and their outcomes
                  </CardDescription>
                </div>
                <Dialog open={addBreedingEventOpen} onOpenChange={setAddBreedingEventOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Breeding Event</DialogTitle>
                      <DialogDescription>
                        Record a new breeding event between two rabbits.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Form {...breedingEventForm}>
                      <form onSubmit={breedingEventForm.handleSubmit(onAddBreedingEventSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={breedingEventForm.control}
                            name="maleId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Male Rabbit</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select male" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {maleRabbits.map(male => (
                                      <SelectItem key={male.id} value={male.id.toString()}>
                                        {male.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={breedingEventForm.control}
                            name="femaleId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Female Rabbit</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select female" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {femaleRabbits.map(female => (
                                      <SelectItem key={female.id} value={female.id.toString()}>
                                        {female.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={breedingEventForm.control}
                          name="breedingDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Breeding Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={breedingEventForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="successful">Successful</SelectItem>
                                  <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={breedingEventForm.control}
                          name="expectedBirthDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Birth Date (optional)</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={breedingEventForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (optional)</FormLabel>
                              <FormControl>
                                <Textarea {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button type="submit" disabled={addBreedingEventMutation.isPending}>
                            {addBreedingEventMutation.isPending ? "Saving..." : "Save Breeding Event"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="text-center p-4">Loading breeding events...</div>
                ) : breedingEvents.length === 0 ? (
                  <div className="text-center p-8">
                    <CalendarDays className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                    <h3 className="mt-2 text-lg font-medium">No breeding events yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add your first breeding event to start tracking rabbit breeding history.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {breedingEvents.map(event => {
                      const male = animals.find(a => a.id === event.maleId);
                      const female = animals.find(a => a.id === event.femaleId);
                      
                      return (
                        <div key={event.id} className="flex flex-col space-y-2 rounded-md border p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">
                              {male?.name} ♂️ × {female?.name} ♀️
                            </h3>
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                              event.status === 'successful' ? 'bg-green-100 text-green-800' :
                              event.status === 'unsuccessful' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4" />
                              Breeding Date: {format(new Date(event.breedingDate), 'MMM dd, yyyy')}
                            </div>
                            
                            {event.expectedBirthDate && (
                              <div className="flex items-center mt-1">
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Expected Birth: {format(new Date(event.expectedBirthDate), 'MMM dd, yyyy')}
                              </div>
                            )}
                            
                            {event.actualBirthDate && (
                              <div className="flex items-center mt-1">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Actual Birth: {format(new Date(event.actualBirthDate), 'MMM dd, yyyy')}
                                {event.offspringCount && ` (${event.offspringCount} kits)`}
                              </div>
                            )}
                          </div>
                          
                          {event.notes && (
                            <div className="mt-2 text-sm">
                              <p className="font-medium">Notes:</p>
                              <p>{event.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI Metrics Tab */}
          <TabsContent value="roi-metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Rabbit Breeding ROI Metrics</CardTitle>
                <CardDescription>
                  Calculate and predict return on investment for breeding pairs based on health factors and offspring count
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Breeding Performance Metrics</h3>
                    <Card className="border-2 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Top-Performing Breeding Pairs</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {breedingEventsLoading ? (
                          <div className="text-center p-4">Loading data...</div>
                        ) : breedingEvents.length === 0 ? (
                          <div className="text-center p-4">No breeding events recorded yet.</div>
                        ) : (
                          <div className="space-y-3">
                            {breedingEvents
                              .filter(event => event.status === "successful" && event.offspringCount)
                              .sort((a, b) => (b.offspringCount || 0) - (a.offspringCount || 0))
                              .slice(0, 3)
                              .map(event => {
                                const male = animals.find(a => a.id === event.maleId);
                                const female = animals.find(a => a.id === event.femaleId);
                                
                                return (
                                  <div key={event.id} className="flex items-center justify-between border-b pb-2">
                                    <div>
                                      <p className="font-medium">{male?.name} + {female?.name}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(event.breedingDate).toLocaleDateString()} • 
                                        {event.offspringCount} offspring
                                      </p>
                                    </div>
                                    <div className="flex items-center">
                                      <Badge variant="secondary" className="bg-primary/10">
                                        ROI: {calculateBreedingROI(event, male, female).toFixed(1)}x
                                      </Badge>
                                    </div>
                                  </div>
                                );
                              })
                            }
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Breed-specific Performance</h3>
                    <Card className="border-2 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Breed Performance Ranking</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {animals.length === 0 ? (
                          <div className="text-center p-4">No rabbits registered yet.</div>
                        ) : (
                          <div className="space-y-3">
                            {Array.from(new Set(animals.map(a => a.breed)))
                              .filter(breed => breed)
                              .map(breed => {
                                const breedAnimals = animals.filter(a => a.breed === breed);
                                const breedEvents = breedingEvents.filter(
                                  e => 
                                    (breedAnimals.some(a => a.id === e.maleId) || 
                                    breedAnimals.some(a => a.id === e.femaleId)) &&
                                    e.status === "successful" && 
                                    e.offspringCount
                                );
                                
                                const avgOffspring = breedEvents.length > 0 
                                  ? breedEvents.reduce((sum, e) => sum + (e.offspringCount || 0), 0) / breedEvents.length
                                  : 0;
                                
                                return {
                                  breed,
                                  avgOffspring,
                                  eventCount: breedEvents.length
                                };
                              })
                              .sort((a, b) => b.avgOffspring - a.avgOffspring)
                              .map(({ breed, avgOffspring, eventCount }) => (
                                <div key={breed} className="flex items-center justify-between border-b pb-2">
                                  <div>
                                    <p className="font-medium">{breed}</p>
                                    <p className="text-sm text-muted-foreground">
                                      Based on {eventCount} breeding events
                                    </p>
                                  </div>
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="bg-primary/5">
                                      Avg: {avgOffspring.toFixed(1)} offspring
                                    </Badge>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">ROI Prediction Tool</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <FormField
                          control={form.control}
                          name="maleId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Male Rabbit</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select male rabbit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {maleRabbits.map(male => (
                                    <SelectItem key={male.id} value={male.id.toString()}>
                                      {male.name} ({male.breed})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="femaleId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Female Rabbit</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(parseInt(value))} 
                                value={field.value?.toString() || ""}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select female rabbit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {femaleRabbits.map(female => (
                                    <SelectItem key={female.id} value={female.id.toString()}>
                                      {female.name} ({female.breed})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <FormField
                          control={form.control}
                          name="healthFactor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Health Factor (1-10)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  max="10" 
                                  {...field} 
                                  value={field.value || "8"} 
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormDescription>
                                Higher values indicate better health
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="expectedOffspring"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Offspring</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  {...field} 
                                  value={field.value || "6"} 
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="investmentAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Investment ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  step="0.01" 
                                  {...field} 
                                  value={field.value || "100"} 
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button 
                        onClick={() => predictROI(
                          form.getValues("maleId"), 
                          form.getValues("femaleId"),
                          form.getValues("healthFactor") || 8,
                          form.getValues("expectedOffspring") || 6,
                          form.getValues("investmentAmount") || 100
                        )}
                        className="w-full"
                      >
                        Calculate Predicted ROI
                      </Button>

                      {roiPrediction && (
                        <Card className="mt-6 border-primary/20 border-2">
                          <CardHeader className="pb-2">
                            <CardTitle>ROI Prediction Results</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Financial Metrics</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Investment:</span>
                                    <span className="font-medium">${roiPrediction.investment.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Expected Return:</span>
                                    <span className="font-medium">${roiPrediction.expectedReturn.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Net Profit:</span>
                                    <span className="font-medium text-green-600">${roiPrediction.netProfit.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>ROI Multiplier:</span>
                                    <span className="font-medium text-primary">{roiPrediction.roiMultiplier.toFixed(2)}x</span>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Breeding Metrics</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Expected Offspring:</span>
                                    <span className="font-medium">{roiPrediction.expectedOffspring}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Health Factor:</span>
                                    <span className="font-medium">{roiPrediction.healthFactor}/10</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Compatibility Score:</span>
                                    <span className="font-medium">{roiPrediction.compatibilityScore}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Genetic Risk:</span>
                                    <span className={`font-medium ${roiPrediction.geneticRisk ? "text-red-500" : "text-green-500"}`}>
                                      {roiPrediction.geneticRisk ? "Present" : "None"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <Alert className={`mt-4 ${roiPrediction.rating === "Excellent" ? "bg-green-100" : roiPrediction.rating === "Good" ? "bg-blue-100" : "bg-amber-100"}`}>
                              <AlertTitle>Overall Rating: {roiPrediction.rating}</AlertTitle>
                              <AlertDescription>{roiPrediction.recommendation}</AlertDescription>
                            </Alert>
                          </CardContent>
                        </Card>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}