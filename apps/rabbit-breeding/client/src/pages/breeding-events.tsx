import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  X, 
  Heart, 
  AlertCircle, 
  Info, 
  Loader2,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Check,
  XCircle,
  ShieldAlert,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { formatDate, cn } from '@/lib/utils';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { CompatibilityChecker } from '@/components/breeding/CompatibilityChecker';
import { ParentCompatibilityResult } from '@/lib/breeding/validatePairing';
import { Animal } from '@shared/schema';

// Interface for our event types
interface BreedingEvent {
  id: number;
  eventType: 'mating' | 'pregnancy-check' | 'nesting-box' | 'kindling' | 'weaning';
  maleId: number;
  maleName: string;
  femaleId: number;
  femaleName: string;
  date: string;
  notes: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'canceled';
  outcomeNotes: string;
}

// Empty initial state, we'll load from the API

// Modal for creating new breeding event
const NewBreedingEventModal = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  animals = [] 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (event: Omit<BreedingEvent, 'id'>) => void;
  animals: any[];
}) => {
  const [formData, setFormData] = useState({
    eventType: 'mating',
    maleId: '',
    femaleId: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'scheduled'
  });
  
  const [compatibility, setCompatibility] = useState<{
    isChecking: boolean;
    result: ParentCompatibilityResult | null;
  }>({
    isChecking: false,
    result: null
  });
  
  // Store references to selected animals for form submission
  const [selectedMale, setSelectedMale] = useState<Animal | null>(null);
  const [selectedFemale, setSelectedFemale] = useState<Animal | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset compatibility result when changing animals
    if (name === 'maleId' || name === 'femaleId') {
      setCompatibility({ isChecking: false, result: null });
      
      // Update selected animals
      if (name === 'maleId' && value) {
        const male = animals.find(a => a.id === parseInt(value));
        setSelectedMale(male || null);
      } else if (name === 'femaleId' && value) {
        const female = animals.find(a => a.id === parseInt(value));
        setSelectedFemale(female || null);
      }
    }
  };
  
  // Check compatibility when both animals are selected
  const checkCompatibility = async () => {
    if (!formData.maleId || !formData.femaleId) return;
    
    setCompatibility({ isChecking: true, result: null });
    
    try {
      const response = await fetch(`/api/breeding/compatibility-check?maleId=${formData.maleId}&femaleId=${formData.femaleId}`);
      const result = await response.json();
      setCompatibility({ isChecking: false, result });
    } catch (error) {
      console.error('Error checking compatibility:', error);
      setCompatibility({ 
        isChecking: false, 
        result: {
          compatible: false,
          reason: 'Error checking compatibility. Please try again.',
          riskLevel: 'high'
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find the selected animals
    const male = animals.find(a => a.id === parseInt(formData.maleId));
    const female = animals.find(a => a.id === parseInt(formData.femaleId));
    
    if (!male || !female) {
      alert('Please select both a male and female rabbit');
      return;
    }
    
    // Check compatibility first if not already checked
    if (!compatibility.result) {
      // Store the form data first
      const maleIdToCheck = formData.maleId;
      const femaleIdToCheck = formData.femaleId;
      
      try {
        // Manually make the request rather than using the checkCompatibility function
        const response = await fetch(`/api/breeding/compatibility-check?maleId=${maleIdToCheck}&femaleId=${femaleIdToCheck}`);
        const compatResult = await response.json();
        
        // Update the state with the result
        setCompatibility({
          isChecking: false,
          result: compatResult
        });
        
        // If incompatible, ask for confirmation
        if (!compatResult.compatible) {
          const proceedAnyway = window.confirm(
            `Warning: ${compatResult.reason || 'This breeding pair may be genetically incompatible.'} Proceed anyway?`
          );
          if (!proceedAnyway) return;
        }
      } catch (error) {
        console.error('Error checking compatibility:', error);
        // Continue without blocking
      }
    } else if (compatibility.result && !compatibility.result.compatible) {
      const proceedAnyway = window.confirm(
        `Warning: ${compatibility.result.reason || 'This breeding pair may be genetically incompatible.'}. Proceed anyway?`
      );
      
      if (!proceedAnyway) return;
    }
    
    onSubmit({
      eventType: formData.eventType as any,
      maleId: male.id,
      maleName: male.name,
      femaleId: female.id,
      femaleName: female.name,
      date: formData.date,
      notes: formData.notes,
      status: formData.status as any,
      outcomeNotes: ''
    });
    
    // Reset form
    setFormData({
      eventType: 'mating',
      maleId: '',
      femaleId: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'scheduled'
    });
    
    // Reset compatibility result
    setCompatibility({ isChecking: false, result: null });
    
    onClose();
  };

  if (!isOpen) return null;

  const maleRabbits = animals.filter(a => a.gender === 'male' && a.status === 'active');
  const femaleRabbits = animals.filter(a => a.gender === 'female' && a.status === 'active');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Log New Breeding Event</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Event Type</label>
              <select 
                name="eventType" 
                value={formData.eventType}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="mating">Mating</option>
                <option value="pregnancy-check">Pregnancy Check</option>
                <option value="nesting-box">Nesting Box Installation</option>
                <option value="kindling">Kindling (Birth)</option>
                <option value="weaning">Weaning</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Buck (Male)</label>
              <select 
                name="maleId" 
                value={formData.maleId}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select a male rabbit</option>
                {maleRabbits.map(rabbit => (
                  <option key={rabbit.id} value={rabbit.id}>
                    {rabbit.name} ({rabbit.animalId})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Doe (Female)</label>
              <select 
                name="femaleId" 
                value={formData.femaleId}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Select a female rabbit</option>
                {femaleRabbits.map(rabbit => (
                  <option key={rabbit.id} value={rabbit.id}>
                    {rabbit.name} ({rabbit.animalId})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input 
                type="date" 
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full p-2 border rounded-md h-20 resize-none"
                placeholder="Any observations or details about this event..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select 
                name="status" 
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            
            {/* Compatibility Check UI */}
            {formData.maleId && formData.femaleId && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Compatibility Check</span>
                  <button
                    type="button"
                    onClick={checkCompatibility}
                    className="text-xs text-primary hover:underline flex items-center"
                    disabled={compatibility.isChecking}
                  >
                    {compatibility.isChecking ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" /> 
                        Checking...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3 w-3 mr-1" /> 
                        {compatibility.result ? 'Recheck' : 'Check Compatibility'}
                      </>
                    )}
                  </button>
                </div>
                
                {compatibility.result && (
                  <div className={`mt-1 p-3 rounded-md text-sm ${
                    compatibility.result.compatible 
                      ? 'bg-green-100 border border-green-200' 
                      : 'bg-red-100 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {compatibility.result.compatible ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={compatibility.result.compatible ? 'text-green-700' : 'text-red-700'}>
                        {compatibility.result.compatible 
                          ? 'These rabbits are compatible for breeding.' 
                          : compatibility.result.reason || 'These rabbits are not compatible for breeding.'}
                      </span>
                    </div>
                    {!compatibility.result.compatible && compatibility.result.riskLevel && (
                      <div className="mt-1 pl-7">
                        <span className="text-xs font-medium">
                          Risk Level: {compatibility.result.riskLevel.charAt(0).toUpperCase() + compatibility.result.riskLevel.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className={`px-4 py-2 rounded-md transition-colors ${
                compatibility.result && !compatibility.result.compatible
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {compatibility.result && !compatibility.result.compatible ? 'Save Anyway (Not Recommended)' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Badge for event status
function EventStatusBadge({ status }: { status: BreedingEvent['status'] }) {
  let className;
  switch(status) {
    case 'scheduled':
      className = 'bg-blue-500';
      break;
    case 'in-progress':
      className = 'bg-amber-500';
      break;
    case 'completed':
      className = 'bg-green-500';
      break;
    case 'canceled':
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
function EventTypeBadge({ type }: { type: BreedingEvent['eventType'] }) {
  let className;
  let icon;
  
  switch(type) {
    case 'mating':
      className = 'bg-pink-500';
      icon = <Heart className="h-3 w-3 mr-1" />;
      break;
    case 'pregnancy-check':
      className = 'bg-purple-500';
      icon = <Info className="h-3 w-3 mr-1" />;
      break;
    case 'nesting-box':
      className = 'bg-orange-500';
      icon = <Info className="h-3 w-3 mr-1" />;
      break;
    case 'kindling':
      className = 'bg-green-500';
      icon = <Info className="h-3 w-3 mr-1" />;
      break;
    case 'weaning':
      className = 'bg-blue-500';
      icon = <Info className="h-3 w-3 mr-1" />;
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

export default function BreedingEventsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCompatibilityChecker, setShowCompatibilityChecker] = useState(false);
  
  // Add click outside handler to close export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isExportMenuOpen && !target.closest('#exportDropdownButton') && !target.closest('.export-menu')) {
        setIsExportMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportMenuOpen]);
  
  // Fetch animals for the form dropdown
  const { data: animals = [] } = useQuery({ 
    queryKey: ['/api/animals'],
    queryFn: async () => {
      const response = await fetch('/api/animals');
      if (!response.ok) throw new Error('Failed to fetch animals');
      return response.json();
    }
  });
  
  // Fetch breeding events from API
  const { 
    data: events = [], 
    isLoading,
    isError,
    refetch 
  } = useQuery({ 
    queryKey: ['/api/breeding-events'],
    queryFn: async () => {
      const response = await fetch('/api/breeding-events');
      if (!response.ok) throw new Error('Failed to fetch breeding events');
      
      // Map backend data format to our frontend format
      const data = await response.json();
      return data.map((event: any) => ({
        id: event.id,
        eventType: event.eventType || 'mating',
        maleId: event.maleId,
        maleName: event.maleName || 'Unknown Male',
        femaleId: event.femaleId,
        femaleName: event.femaleName || 'Unknown Female',
        date: event.breedingDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        notes: event.notes || '',
        status: event.status || 'scheduled',
        outcomeNotes: event.outcomeNotes || ''
      }));
    }
  });

  // Create a new breeding event
  const createEventMutation = useMutation({
    mutationFn: async (newEvent: Omit<BreedingEvent, 'id'>) => {
      // Map to the expected backend format
      const eventData = {
        eventId: `BE-${newEvent.maleId}_${newEvent.femaleId}-${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
        maleId: newEvent.maleId,
        femaleId: newEvent.femaleId,
        pairId: `${newEvent.maleId}_${newEvent.femaleId}`,
        breedingDate: newEvent.date,
        status: newEvent.status,
        notes: newEvent.notes
      };
      
      const response = await fetch('/api/breeding-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create breeding event');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ['/api/breeding-events'] });
    }
  });
  
  const handleCreateEvent = (newEvent: Omit<BreedingEvent, 'id'>) => {
    createEventMutation.mutate(newEvent);
  };
  
  const filteredEvents = events.filter((event: BreedingEvent) => 
    (event.maleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.femaleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.eventType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.notes || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Breeding Events</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage rabbit breeding activities
        </p>
      </div>
      
      {/* Action bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            className="w-full py-2 pl-8 pr-4 border rounded-md"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              id="exportDropdownButton"
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="shrink-0 inline-flex items-center gap-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-4 w-4 ml-1" />
            </button>
            
            {isExportMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border export-menu">
                <div className="py-1">
                  <a 
                    href="/api/breeding/export/csv" 
                    download
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsExportMenuOpen(false)}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export to CSV
                  </a>
                  <a 
                    href="/api/breeding/export/pdf" 
                    download
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsExportMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export to PDF
                  </a>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 inline-flex items-center gap-1 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Breeding Event
          </button>
        </div>
      </div>
      
      {/* Event list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid gap-4">
          {filteredEvents.map((event: BreedingEvent) => (
            <Card key={event.id}>
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex flex-wrap items-start gap-2 mb-3">
                    <EventTypeBadge type={event.eventType} />
                    <EventStatusBadge status={event.status} />
                    <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(event.date)}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Buck (Male)</h3>
                      <p className="font-semibold">{event.maleName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Doe (Female)</h3>
                      <p className="font-semibold">{event.femaleName}</p>
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                    <p className="text-sm">{event.notes || "No notes provided"}</p>
                  </div>
                  
                  {event.outcomeNotes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Outcome</h3>
                      <p className="text-sm">{event.outcomeNotes}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-4">
                    <Link href={`/breeding-events/${event.id}`} className="text-primary text-sm hover:underline">
                      View Details
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 gap-2 bg-muted/40 rounded-lg border">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No breeding events found</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-primary text-sm hover:underline"
          >
            Create your first breeding event
          </button>
        </div>
      )}
      
      {/* Compatibility Checker Section */}
      <div className="pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Breeding Compatibility Check</h2>
            <p className="text-muted-foreground text-sm">Verify genetic safety before breeding rabbits</p>
          </div>
          <button
            onClick={() => setShowCompatibilityChecker(!showCompatibilityChecker)}
            className="text-sm flex items-center gap-1 text-primary"
          >
            {showCompatibilityChecker ? 'Hide Checker' : 'Show Checker'}
            <ShieldAlert className="h-4 w-4" />
          </button>
        </div>
        
        {showCompatibilityChecker && (
          <CompatibilityChecker 
            onCompatibilityResult={(result) => {
              if (result.compatible) {
                // Could auto-populate the modal with these compatible rabbits
              }
            }}
          />
        )}
      </div>
      
      {/* Modal for creating new events */}
      <NewBreedingEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateEvent}
        animals={animals}
      />
    </div>
  );
}