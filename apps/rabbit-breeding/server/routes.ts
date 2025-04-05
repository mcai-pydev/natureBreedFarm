import { Express } from 'express';
import { createServer, type Server } from 'http';
import { animalBreedingService } from './animal-breeding';
import { 
  insertAnimalSchema, 
  insertBreedingEventSchema,
  breedingRiskCheckSchema,
  potentialMatesSchema
} from '@shared/schema';
import { ZodError } from 'zod';
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

  app.post('/api/breeding-events', async (req, res) => {
    try {
      const eventData = insertBreedingEventSchema.parse(req.body);
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

  const httpServer = createServer(app);
  return httpServer;
}