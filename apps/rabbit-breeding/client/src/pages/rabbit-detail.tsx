import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { 
  Heart, 
  Calendar, 
  AlertCircle, 
  Info, 
  Loader2, 
  ArrowLeft,
  Calendar as CalendarIcon,
  Weight,
  Tag,
  Home,
  FileText,
  CheckSquare
} from 'lucide-react';
import { formatDate, cn } from '../lib/utils';

export default function RabbitDetailPage() {
  const { id } = useParams();
  const rabbitId = parseInt(id || '0');
  
  // Fetch rabbit details
  const { 
    data: rabbit, 
    isLoading: isLoadingRabbit,
    isError: isErrorRabbit 
  } = useQuery({ 
    queryKey: [`/api/animals/${rabbitId}`],
    queryFn: async () => {
      const response = await fetch(`/api/animals/${rabbitId}`);
      if (!response.ok) throw new Error('Failed to fetch rabbit details');
      return response.json();
    },
    enabled: !!rabbitId
  });
  
  // Fetch breeding events for this rabbit
  const { 
    data: breedingEvents = [], 
    isLoading: isLoadingEvents,
    isError: isErrorEvents 
  } = useQuery({ 
    queryKey: [`/api/breeding-events?animalId=${rabbitId}`],
    queryFn: async () => {
      const response = await fetch(`/api/breeding-events?animalId=${rabbitId}`);
      if (!response.ok) throw new Error('Failed to fetch breeding events');
      return response.json();
    },
    enabled: !!rabbitId
  });
  
  if (isLoadingRabbit || isLoadingEvents) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (isErrorRabbit || isErrorEvents || !rabbit) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-lg font-medium">Error loading data</p>
        <Link href="/dashboard" className="text-primary hover:underline">
          Return to dashboard
        </Link>
      </div>
    );
  }
  
  // Sort events by date descending (most recent first)
  const sortedEvents = [...breedingEvents].sort((a, b) => 
    new Date(b.breedingDate || b.date).getTime() - new Date(a.breedingDate || a.date).getTime()
  );
  
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{rabbit.name}</h1>
        <Badge className={rabbit.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'}>
          {rabbit.gender === 'male' ? 'Buck' : 'Doe'}
        </Badge>
        <Badge className={getStatusBadgeClass(rabbit.status)}>
          {rabbit.status}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main info card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">Rabbit Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="health">Health & Performance</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem icon={<Tag className="h-4 w-4" />} label="ID" value={rabbit.animalId} />
                  <InfoItem icon={<CalendarIcon className="h-4 w-4" />} label="Date of Birth" value={formatDate(rabbit.dateOfBirth)} />
                  <InfoItem icon={<Home className="h-4 w-4" />} label="Cage" value={rabbit.cageNumber || 'Not assigned'} />
                  <InfoItem icon={<Weight className="h-4 w-4" />} label="Weight" value={rabbit.weight ? `${rabbit.weight} kg` : 'Not recorded'} />
                  <InfoItem icon={<Tag className="h-4 w-4" />} label="Breed" value={rabbit.breed || 'Unknown'} />
                  <InfoItem icon={<Tag className="h-4 w-4" />} label="Color" value={rabbit.color || 'Not specified'} />
                </div>
              </TabsContent>
              
              <TabsContent value="health" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <MetricBar label="Health" value={rabbit.health || 0} />
                  <MetricBar label="Fertility" value={rabbit.fertility || 0} />
                  <MetricBar label="Growth Rate" value={rabbit.growthRate || 0} />
                  
                  {rabbit.gender === 'female' && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium mb-1">Litter Size</p>
                      <p className="text-lg font-medium">{rabbit.litterSize || 'No data'}</p>
                    </div>
                  )}
                  
                  <div className="col-span-2">
                    <p className="text-sm font-medium mb-1">Offspring Count</p>
                    <p className="text-lg font-medium">{rabbit.offspringCount || 0}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="notes" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">General Notes</p>
                    <p className="text-base">{rabbit.notes || 'No notes available'}</p>
                  </div>
                  
                  {rabbit.dietaryNotes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Dietary Notes</p>
                      <p className="text-base">{rabbit.dietaryNotes}</p>
                    </div>
                  )}
                  
                  {rabbit.healthNotes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Health Notes</p>
                      <p className="text-base">{rabbit.healthNotes}</p>
                    </div>
                  )}
                  
                  {rabbit.behaviorNotes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Behavior Notes</p>
                      <p className="text-base">{rabbit.behaviorNotes}</p>
                    </div>
                  )}
                  
                  {rabbit.tags && rabbit.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {rabbit.tags.map((tag: string, index: number) => (
                          <Badge key={index} className="bg-muted text-muted-foreground">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Breeding statistics card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Breeding Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">Total Breeding Events</p>
                <p className="text-3xl font-bold">{breedingEvents.length}</p>
              </div>
              
              {rabbit.gender === 'female' && (
                <div className="text-center p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Pregnancies</p>
                  <p className="text-3xl font-bold">
                    {breedingEvents.filter((e: any) => 
                      e.status === 'successful' || 
                      e.status === 'pregnant' || 
                      e.actualBirthDate
                    ).length}
                  </p>
                </div>
              )}
              
              <div className="text-center p-4 bg-muted rounded-md">
                <p className="text-sm font-medium mb-1">Success Rate</p>
                <p className="text-3xl font-bold">
                  {breedingEvents.length > 0 
                    ? `${Math.round((breedingEvents.filter((e: any) => e.status === 'successful').length / breedingEvents.length) * 100)}%` 
                    : 'N/A'}
                </p>
              </div>
              
              <Link 
                href={`/breeding-events/new?${rabbit.gender === 'male' ? 'maleId' : 'femaleId'}=${rabbit.id}`}
                className="mt-4 w-full text-center bg-primary text-primary-foreground rounded-md py-2 font-medium hover:bg-primary/90 transition-colors"
              >
                Create Breeding Event
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Breeding event timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Breeding Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedEvents.length > 0 ? (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-0 bottom-0 left-16 w-px bg-border" />
              
              {/* Timeline events */}
              <div className="space-y-8">
                {sortedEvents.map((event, index) => {
                  const eventDate = new Date(event.breedingDate || event.date);
                  const partnerRabbit = rabbit.gender === 'male' 
                    ? { name: event.femaleName || 'Unknown Female', id: event.femaleId }
                    : { name: event.maleName || 'Unknown Male', id: event.maleId };
                    
                  return (
                    <div key={event.id} className="relative flex items-start gap-4">
                      {/* Timeline marker */}
                      <div className="absolute left-14 w-5 h-5 rounded-full border-4 border-background z-10" style={{ 
                        backgroundColor: getEventTypeColor(event.eventType),
                        transform: 'translateX(-50%)' 
                      }} />
                      
                      {/* Date */}
                      <div className="w-32 text-right text-sm text-muted-foreground pt-1">
                        {formatDate(eventDate)}
                      </div>
                      
                      {/* Event content */}
                      <div className="flex-1 bg-muted/30 rounded-lg p-4 ml-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <EventTypeBadge type={event.eventType} />
                          <EventStatusBadge status={event.status} />
                        </div>
                        
                        <p className="font-medium">
                          {rabbit.gender === 'male' ? 'Mated with' : 'Mated by'}{' '}
                          <Link href={`/rabbit/${partnerRabbit.id}`} className="text-primary hover:underline">
                            {partnerRabbit.name}
                          </Link>
                        </p>
                        
                        {event.notes && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">{event.notes}</p>
                          </div>
                        )}
                        
                        {event.outcomeNotes && (
                          <div className="mt-2 p-2 bg-muted rounded">
                            <p className="text-sm font-medium">Outcome:</p>
                            <p className="text-sm">{event.outcomeNotes}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-end mt-2">
                          <Link href={`/breeding-events/${event.id}`} className="text-primary text-sm hover:underline">
                            View details
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No breeding events found for this rabbit</p>
              <Link
                href={`/breeding-events/new?${rabbit.gender === 'male' ? 'maleId' : 'femaleId'}=${rabbit.id}`}
                className="mt-4 text-primary hover:underline"
              >
                Create first breeding event
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper components
const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-center gap-2">
    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted">
      {icon}
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

const MetricBar = ({ label, value }: { label: string; value: number }) => (
  <div>
    <div className="flex justify-between mb-1">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm text-muted-foreground">{value}/100</p>
    </div>
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div 
        className={cn("h-full", 
          value >= 80 ? "bg-green-500" : 
          value >= 60 ? "bg-yellow-500" : 
          "bg-red-500"
        )} 
        style={{ width: `${value}%` }} 
      />
    </div>
  </div>
);

function getStatusBadgeClass(status: string): string {
  switch(status?.toLowerCase()) {
    case 'active': return 'bg-green-500';
    case 'breeding': return 'bg-blue-500';
    case 'pregnant': return 'bg-purple-500';
    case 'nursing': return 'bg-indigo-500';
    case 'retired': return 'bg-amber-500';
    case 'sold': return 'bg-gray-500';
    case 'deceased': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function getEventTypeColor(type: string): string {
  switch(type) {
    case 'mating': return '#ec4899'; // pink-500
    case 'pregnancy-check': return '#a855f7'; // purple-500
    case 'nesting-box': return '#f97316'; // orange-500
    case 'kindling': return '#22c55e'; // green-500
    case 'weaning': return '#3b82f6'; // blue-500
    default: return '#6b7280'; // gray-500
  }
}

// Badge for event status
function EventStatusBadge({ status }: { status: string }) {
  let className;
  switch(status) {
    case 'scheduled':
      className = 'bg-blue-500';
      break;
    case 'in-progress':
    case 'pending':
      className = 'bg-amber-500';
      break;
    case 'completed':
    case 'successful':
      className = 'bg-green-500';
      break;
    case 'canceled':
    case 'unsuccessful':
      className = 'bg-gray-500';
      break;
    default:
      className = 'bg-gray-500';
  }
  
  return (
    <Badge className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Badge for event type
function EventTypeBadge({ type }: { type: string }) {
  let className;
  let icon;
  
  switch(type) {
    case 'mating':
      className = 'bg-pink-500';
      icon = <Heart className="h-3 w-3 mr-1" />;
      break;
    case 'pregnancy-check':
      className = 'bg-purple-500';
      icon = <CheckSquare className="h-3 w-3 mr-1" />;
      break;
    case 'nesting-box':
      className = 'bg-orange-500';
      icon = <Home className="h-3 w-3 mr-1" />;
      break;
    case 'kindling':
      className = 'bg-green-500';
      icon = <Calendar className="h-3 w-3 mr-1" />;
      break;
    case 'weaning':
      className = 'bg-blue-500';
      icon = <FileText className="h-3 w-3 mr-1" />;
      break;
    default:
      className = 'bg-gray-500';
      icon = <Info className="h-3 w-3 mr-1" />;
  }
  
  return (
    <Badge className={className}>
      <div className="flex items-center">
        {icon}
        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
      </div>
    </Badge>
  );
}