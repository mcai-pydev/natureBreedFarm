import { Express, Request } from 'express';
import { createServer, type Server } from 'http';
import { animalBreedingService } from './animal-breeding';
import { 
  insertAnimalSchema, 
  insertBreedingEventSchema,
  breedingRiskCheckSchema,
  potentialMatesSchema
} from '@shared/schema';
import { ZodError } from 'zod';
import { stringify } from 'csv-stringify/sync';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { checkHealth } from './health';

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
      const healthStatus = await checkHealth();
      res.status(healthStatus.status === 'healthy' ? 200 : 
                 healthStatus.status === 'warning' ? 200 : 503)
         .json(healthStatus);
    } catch (error) {
      console.error('Error checking health:', error);
      res.status(500).json({ 
        status: 'error', 
        service: 'rabbit-breeding-micro-app',
        error: error instanceof Error ? error.message : 'Unknown error during health check'
      });
    }
  });

  // Animal management API endpoints
  app.get('/api/animals', async (req, res) => {
    try {
      const animals = await animalBreedingService.getAnimals();
      res.json(animals);
    } catch (error) {
      console.error('Error fetching animals:', error);
      res.status(500).json({ error: 'Failed to fetch animals' });
    }
  });

  app.get('/api/animals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid animal ID' });
      }

      const animal = await animalBreedingService.getAnimal(id);
      if (!animal) {
        return res.status(404).json({ error: 'Animal not found' });
      }
      
      res.json(animal);
    } catch (error) {
      console.error('Error fetching animal:', error);
      res.status(500).json({ error: 'Failed to fetch animal' });
    }
  });

  app.post('/api/animals', async (req, res) => {
    try {
      const animalData = insertAnimalSchema.parse(req.body);
      const newAnimal = await animalBreedingService.createAnimal(animalData);
      res.status(201).json(newAnimal);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      console.error('Error creating animal:', error);
      res.status(500).json({ error: 'Failed to create animal' });
    }
  });

  app.put('/api/animals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid animal ID' });
      }

      const animalData = req.body;
      const updatedAnimal = await animalBreedingService.updateAnimal(id, animalData);
      
      if (!updatedAnimal) {
        return res.status(404).json({ error: 'Animal not found' });
      }
      
      res.json(updatedAnimal);
    } catch (error) {
      console.error('Error updating animal:', error);
      res.status(500).json({ error: 'Failed to update animal' });
    }
  });

  app.delete('/api/animals/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid animal ID' });
      }

      const deleted = await animalBreedingService.deleteAnimal(id);
      
      if (!deleted) {
        return res.status(400).json({ 
          error: 'Cannot delete this animal as it has offspring', 
          message: 'Animal status has been set to inactive instead'
        });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting animal:', error);
      res.status(500).json({ error: 'Failed to delete animal' });
    }
  });

  // Breeding match API endpoints
  app.get('/api/animals/:id/potential-mates', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid animal ID' });
      }

      const potentialMates = await animalBreedingService.getPotentialMates(id);
      res.json(potentialMates);
    } catch (error) {
      console.error('Error fetching potential mates:', error);
      res.status(500).json({ error: 'Failed to fetch potential mates' });
    }
  });
  
  // Breeding suggestions endpoint for dashboard display
  app.get('/api/breeding/suggestions', async (req, res) => {
    try {
      const animals = await animalBreedingService.getAnimals();
      
      // Filter active rabbits by gender
      const males = animals.filter(a => a.gender === 'male' && a.status === 'active');
      const females = animals.filter(a => a.gender === 'female' && a.status === 'active');
      
      // Find compatible pairs with low inbreeding risk
      const suggestions = [];
      
      for (const male of males) {
        for (const female of females) {
          const riskCheck = await animalBreedingService.checkInbreedingRisk(male.id, female.id);
          
          // Only suggest pairs with no inbreeding risk
          if (!riskCheck.isRisky) {
            suggestions.push({
              maleId: male.id,
              maleName: male.name,
              femaleId: female.id,
              femaleName: female.name,
              compatibilityScore: Math.round(Math.random() * 40) + 60, // Temporary placeholder for compatibility score
            });
            
            // Limit to top 5 suggestions
            if (suggestions.length >= 5) break;
          }
        }
        if (suggestions.length >= 5) break;
      }
      
      res.json(suggestions);
    } catch (error) {
      console.error('Error generating breeding suggestions:', error);
      res.status(500).json({ error: 'Failed to generate breeding suggestions' });
    }
  });

  app.post('/api/breeding/risk-check', async (req, res) => {
    try {
      const { maleId, femaleId } = breedingRiskCheckSchema.parse(req.body);
      const riskCheck = await animalBreedingService.checkInbreedingRisk(maleId, femaleId);
      res.json(riskCheck);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      console.error('Error checking inbreeding risk:', error);
      res.status(500).json({ error: 'Failed to check inbreeding risk' });
    }
  });

  // Breeding events API endpoints
  app.get('/api/breeding-events', async (req, res) => {
    try {
      // Check if animalId query parameter exists
      const animalId = req.query.animalId ? parseInt(req.query.animalId as string) : undefined;
      
      let events;
      if (animalId) {
        // Fetch all events and filter by animalId (either as male or female)
        const allEvents = await animalBreedingService.getBreedingEvents();
        events = allEvents.filter(event => 
          event.maleId === animalId || event.femaleId === animalId
        );
      } else {
        // Fetch all events
        events = await animalBreedingService.getBreedingEvents();
      }
      
      res.json(events);
    } catch (error) {
      console.error('Error fetching breeding events:', error);
      res.status(500).json({ error: 'Failed to fetch breeding events' });
    }
  });

  app.get('/api/breeding-events/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid breeding event ID' });
      }

      const event = await animalBreedingService.getBreedingEvent(id);
      if (!event) {
        return res.status(404).json({ error: 'Breeding event not found' });
      }
      
      res.json(event);
    } catch (error) {
      console.error('Error fetching breeding event:', error);
      res.status(500).json({ error: 'Failed to fetch breeding event' });
    }
  });

  // New endpoint for compatibility check with detailed results
  app.get('/api/breeding/compatibility-check', async (req, res) => {
    try {
      const maleId = parseInt(req.query.maleId as string);
      const femaleId = parseInt(req.query.femaleId as string);
      
      if (isNaN(maleId) || isNaN(femaleId)) {
        return res.status(400).json({ 
          compatible: false,
          reason: 'Invalid animal IDs',
          riskLevel: 'high'
        });
      }

      // Get the full animal objects to perform detailed checks
      const male = await animalBreedingService.getAnimal(maleId);
      const female = await animalBreedingService.getAnimal(femaleId);
      
      if (!male || !female) {
        return res.status(404).json({ 
          compatible: false,
          reason: 'One or both animals not found',
          riskLevel: 'high'
        });
      }

      // Check if they're different genders
      if (male.gender === female.gender) {
        return res.status(400).json({ 
          compatible: false,
          reason: 'Both animals are the same gender',
          riskLevel: 'high'
        });
      }

      // Basic check for same animal
      if (male.id === female.id) {
        return res.status(400).json({ 
          compatible: false,
          reason: 'Cannot breed an animal with itself',
          riskLevel: 'high'
        });
      }

      // Check for parent-child relationship
      if (male.id === female.parentMaleId || female.id === male.parentFemaleId) {
        return res.status(400).json({ 
          compatible: false,
          reason: 'Parent-child breeding is not allowed due to high inbreeding risk',
          riskLevel: 'high'
        });
      }

      // Check if they're siblings
      if (male.parentMaleId && female.parentMaleId && male.parentMaleId === female.parentMaleId) {
        // Full siblings
        if (male.parentFemaleId && female.parentFemaleId && male.parentFemaleId === female.parentFemaleId) {
          return res.status(400).json({ 
            compatible: false,
            reason: 'Siblings breeding is not allowed due to high inbreeding risk',
            riskLevel: 'high'
          });
        }
        
        // Half siblings (same father, different mother)
        return res.status(400).json({ 
          compatible: false,
          reason: 'Half-siblings breeding is not allowed due to moderate inbreeding risk',
          riskLevel: 'high'
        });
      }

      // Check if they're half-siblings from maternal side
      if (male.parentFemaleId && female.parentFemaleId && male.parentFemaleId === female.parentFemaleId) {
        return res.status(400).json({ 
          compatible: false,
          reason: 'Half-siblings breeding is not allowed due to moderate inbreeding risk',
          riskLevel: 'high'
        });
      }

      // Also check for shared ancestry if available
      if (male.ancestry && female.ancestry && 
          (male.ancestry.length > 0 && female.ancestry.length > 0)) {
        
        // Check for shared ancestors
        const sharedAncestors = male.ancestry.filter(maleAncestor => 
          female.ancestry?.includes(maleAncestor)
        );
        
        if (sharedAncestors.length > 0) {
          return res.status(400).json({ 
            compatible: false,
            reason: `Shared ancestry detected: ${sharedAncestors.join(', ')}. This increases inbreeding risk.`,
            riskLevel: 'medium'
          });
        }
      }

      // For complete protection, also run the service's inbreeding check
      const riskCheck = await animalBreedingService.checkInbreedingRisk(maleId, femaleId);
      
      if (riskCheck.isRisky) {
        return res.status(400).json({ 
          compatible: false,
          reason: `Inbreeding risk detected: ${riskCheck.relationshipType || 'unknown relationship'}`,
          riskLevel: 'high'
        });
      }
      
      // Passed all checks
      res.json({
        compatible: true,
        riskLevel: 'none'
      });
    } catch (error) {
      console.error('Error checking breeding compatibility:', error);
      res.status(500).json({ 
        compatible: false,
        reason: 'Failed to check breeding compatibility',
        riskLevel: 'high'
      });
    }
  });

  app.post('/api/breeding-events', async (req, res) => {
    try {
      const eventData = insertBreedingEventSchema.parse(req.body);
      
      // Validate the breeding pair before creating the event
      const male = await animalBreedingService.getAnimal(eventData.maleId);
      const female = await animalBreedingService.getAnimal(eventData.femaleId);
      
      if (!male || !female) {
        return res.status(404).json({ 
          error: 'One or both animals not found' 
        });
      }
      
      // Check for inbreeding risk
      const riskCheck = await animalBreedingService.checkInbreedingRisk(
        eventData.maleId, 
        eventData.femaleId
      );
      
      if (riskCheck.isRisky) {
        return res.status(400).json({ 
          error: 'Breeding pairing rejected due to inbreeding risk', 
          details: riskCheck 
        });
      }
      
      // Proceed with creating the breeding event
      const newEvent = await animalBreedingService.createBreedingEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: 'Validation error', 
          details: error.errors 
        });
      }
      console.error('Error creating breeding event:', error);
      res.status(500).json({ error: 'Failed to create breeding event' });
    }
  });

  app.put('/api/breeding-events/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid breeding event ID' });
      }

      const eventData = req.body;
      const updatedEvent = await animalBreedingService.updateBreedingEvent(id, eventData);
      
      if (!updatedEvent) {
        return res.status(404).json({ error: 'Breeding event not found' });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error('Error updating breeding event:', error);
      res.status(500).json({ error: 'Failed to update breeding event' });
    }
  });

  app.delete('/api/breeding-events/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid breeding event ID' });
      }

      const deleted = await animalBreedingService.deleteBreedingEvent(id);
      
      if (!deleted) {
        return res.status(400).json({ error: 'Failed to delete breeding event' });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting breeding event:', error);
      res.status(500).json({ error: 'Failed to delete breeding event' });
    }
  });

  // Data seeding endpoint (for dev/testing only)
  app.post('/api/seed-data', async (req, res) => {
    try {
      await animalBreedingService.seedSampleData();
      res.status(200).json({ message: 'Sample data seeded successfully' });
    } catch (error) {
      console.error('Error seeding data:', error);
      res.status(500).json({ error: 'Failed to seed data' });
    }
  });

  // Helper function to filter breeding events based on query parameters
  const filterBreedingEvents = async (req: Request) => {
    // Get filter parameters
    const animalId = req.query.animalId ? parseInt(req.query.animalId as string) : undefined;
    const status = req.query.status as string | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
    
    // Fetch events
    let events = await animalBreedingService.getBreedingEvents();
    
    // Apply filters
    if (animalId) {
      events = events.filter(event => 
        event.maleId === animalId || event.femaleId === animalId
      );
    }
    
    if (status) {
      events = events.filter(event => event.status === status);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      events = events.filter(event => new Date(event.breedingDate) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      events = events.filter(event => new Date(event.breedingDate) <= end);
    }
    
    // Enhance the data with animal names for better readability
    if (events.length > 0) {
      const enhancedEvents = await Promise.all(events.map(async (event) => {
        const male = await animalBreedingService.getAnimal(event.maleId);
        const female = await animalBreedingService.getAnimal(event.femaleId);
        
        return {
          ...event,
          maleName: male?.name || 'Unknown',
          femaleName: female?.name || 'Unknown',
        };
      }));
      
      return enhancedEvents;
    }
    
    return [];
  };
  
  // Export breeding events to CSV
  app.get('/api/breeding/export/csv', async (req, res) => {
    try {
      const enhancedEvents = await filterBreedingEvents(req);
      
      // If no events match the criteria
      if (enhancedEvents.length === 0) {
        return res.status(404).json({ error: 'No breeding events found matching the criteria' });
      }
      
      // Format date for file name
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `breeding-events-export-${dateStr}.csv`;
      
      // CSV column configuration
      const columns = [
        { key: 'id', header: 'ID' },
        { key: 'eventId', header: 'Event ID' },
        { key: 'maleId', header: 'Male ID' },
        { key: 'maleName', header: 'Male Name' },
        { key: 'femaleId', header: 'Female ID' },
        { key: 'femaleName', header: 'Female Name' },
        { key: 'breedingDate', header: 'Breeding Date' },
        { key: 'status', header: 'Status' },
        { key: 'expectedBirthDate', header: 'Expected Birth Date' },
        { key: 'actualBirthDate', header: 'Actual Birth Date' },
        { key: 'expectedOffspringCount', header: 'Expected Offspring Count' },
        { key: 'actualOffspringCount', header: 'Actual Offspring Count' },
        { key: 'offspringCount', header: 'Surviving Offspring Count' },
        { key: 'geneticCompatibilityScore', header: 'Genetic Compatibility Score' },
        { key: 'notes', header: 'Notes' },
      ];
      
      // Generate CSV
      const csvData = stringify(enhancedEvents, {
        header: true,
        columns: columns,
      });
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Send the CSV file
      res.send(csvData);
    } catch (error) {
      console.error('Error exporting breeding events to CSV:', error);
      res.status(500).json({ error: 'Failed to export breeding events to CSV' });
    }
  });
  
  // Export breeding events to PDF
  app.get('/api/breeding/export/pdf', async (req, res) => {
    try {
      const enhancedEvents = await filterBreedingEvents(req);
      
      // If no events match the criteria
      if (enhancedEvents.length === 0) {
        return res.status(404).json({ error: 'No breeding events found matching the criteria' });
      }
      
      // Format date for file name
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `breeding-events-export-${dateStr}.pdf`;
      
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Breeding Events Report', 14, 22);
      
      // Add report generation details
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);
      
      // Prepare table data
      const tableColumn = [
        'ID', 'Event ID', 'Male', 'Female', 'Breeding Date', 
        'Status', 'Expected Birth', 'Actual Birth', 'Offspring'
      ];
      
      const tableRows = enhancedEvents.map(event => [
        event.id.toString(),
        event.eventId,
        `${event.maleName} (${event.maleId})`,
        `${event.femaleName} (${event.femaleId})`,
        new Date(event.breedingDate).toLocaleDateString(),
        event.status,
        event.expectedBirthDate ? new Date(event.expectedBirthDate).toLocaleDateString() : 'N/A',
        event.actualBirthDate ? new Date(event.actualBirthDate).toLocaleDateString() : 'N/A',
        event.offspringCount?.toString() || '0',
      ]);
      
      // Add table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [89, 89, 89] },
      });
      
      // Add summary statistics
      const totalEvents = enhancedEvents.length;
      const successfulEvents = enhancedEvents.filter(e => e.status === 'successful').length;
      const pendingEvents = enhancedEvents.filter(e => e.status === 'pending').length;
      const totalOffspring = enhancedEvents.reduce((sum, event) => sum + (event.offspringCount || 0), 0);
      
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(12);
      doc.text('Summary Statistics', 14, finalY);
      doc.setFontSize(10);
      doc.text(`Total Events: ${totalEvents}`, 14, finalY + 7);
      doc.text(`Successful Events: ${successfulEvents}`, 14, finalY + 14);
      doc.text(`Pending Events: ${pendingEvents}`, 14, finalY + 21);
      doc.text(`Total Offspring: ${totalOffspring}`, 14, finalY + 28);
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Send the PDF file
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error exporting breeding events to PDF:', error);
      res.status(500).json({ error: 'Failed to export breeding events to PDF' });
    }
  });
  
  // Backward compatibility - redirect old export URL to CSV export
  app.get('/api/breeding/export', (req, res) => {
    res.redirect(`/api/breeding/export/csv${req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`);
  });

  const httpServer = createServer(app);
  return httpServer;
}