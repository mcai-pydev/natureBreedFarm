import { db } from './db';
import { animalBreedingService } from './animal-breeding';
import { animals, breedingEvents } from '@shared/schema';
import { sql } from 'drizzle-orm';

export interface HealthStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  details?: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'warning' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthStatus;
    models: {
      animals: HealthStatus;
      breedingEvents: HealthStatus;
    };
    api: {
      animals: HealthStatus;
      breedingEvents: HealthStatus;
      suggestions: HealthStatus;
    };
  };
}

export async function checkHealth(): Promise<HealthCheckResponse> {
  const startTime = process.uptime();
  const checks: HealthCheckResponse['checks'] = {
    database: { name: 'Database Connection', status: 'error' },
    models: {
      animals: { name: 'Animals Table', status: 'error' },
      breedingEvents: { name: 'Breeding Events Table', status: 'error' },
    },
    api: {
      animals: { name: 'Animals API', status: 'error' },
      breedingEvents: { name: 'Breeding Events API', status: 'error' },
      suggestions: { name: 'Breeding Suggestions API', status: 'error' },
    },
  };

  // Database connection check
  try {
    await db.execute(sql`SELECT 1`);
    checks.database.status = 'healthy';
  } catch (error) {
    checks.database.status = 'error';
    checks.database.details = error instanceof Error ? error.message : 'Unknown database error';
  }

  // Animals model check
  try {
    if (checks.database.status === 'healthy') {
      const animalCount = await db.select({ count: sql`count(*)` }).from(animals);
      const count = Number(animalCount[0].count);
      checks.models.animals.status = 'healthy';
      checks.models.animals.details = `${count} animals found`;
      
      // Only check the Animals API if database is connected
      try {
        const animalList = await animalBreedingService.getAnimals();
        checks.api.animals.status = 'healthy';
        checks.api.animals.details = `Retrieved ${animalList.length} animals`;
      } catch (error) {
        checks.api.animals.status = 'error';
        checks.api.animals.details = error instanceof Error ? error.message : 'Unknown API error';
      }
    }
  } catch (error) {
    checks.models.animals.status = 'error';
    checks.models.animals.details = error instanceof Error ? error.message : 'Unknown model error';
  }

  // Breeding events model check
  try {
    if (checks.database.status === 'healthy') {
      const eventCount = await db.select({ count: sql`count(*)` }).from(breedingEvents);
      const count = Number(eventCount[0].count);
      checks.models.breedingEvents.status = 'healthy';
      checks.models.breedingEvents.details = `${count} breeding events found`;
      
      // Only check the Breeding Events API if database is connected
      try {
        const eventsList = await animalBreedingService.getBreedingEvents();
        checks.api.breedingEvents.status = 'healthy';
        checks.api.breedingEvents.details = `Retrieved ${eventsList.length} breeding events`;
      } catch (error) {
        checks.api.breedingEvents.status = 'error';
        checks.api.breedingEvents.details = error instanceof Error ? error.message : 'Unknown API error';
      }
    }
  } catch (error) {
    checks.models.breedingEvents.status = 'error';
    checks.models.breedingEvents.details = error instanceof Error ? error.message : 'Unknown model error';
  }

  // Breeding suggestions API check - only if animals API is working
  try {
    if (checks.api.animals.status === 'healthy') {
      // Check if we have at least one male and one female for breeding suggestions
      const animals = await animalBreedingService.getAnimals();
      const males = animals.filter(a => a.gender === 'male' && a.status === 'active');
      const females = animals.filter(a => a.gender === 'female' && a.status === 'active');
      
      if (males.length > 0 && females.length > 0) {
        // Check inbreeding risk between first male and female
        const riskCheck = await animalBreedingService.checkInbreedingRisk(males[0].id, females[0].id);
        checks.api.suggestions.status = 'healthy';
        checks.api.suggestions.details = `Checked breeding compatibility between ${males.length} males and ${females.length} females`;
      } else {
        checks.api.suggestions.status = 'warning';
        checks.api.suggestions.details = 'Not enough active rabbits of both genders for breeding suggestions';
      }
    }
  } catch (error) {
    checks.api.suggestions.status = 'error';
    checks.api.suggestions.details = error instanceof Error ? error.message : 'Unknown API error';
  }

  // Calculate overall status
  const statuses = [
    checks.database.status,
    checks.models.animals.status,
    checks.models.breedingEvents.status,
    checks.api.animals.status,
    checks.api.breedingEvents.status,
    checks.api.suggestions.status,
  ];

  const overallStatus = statuses.includes('error')
    ? 'error'
    : statuses.includes('warning')
      ? 'warning'
      : 'healthy';

  return {
    status: overallStatus,
    service: 'rabbit-breeding-micro-app',
    timestamp: new Date().toISOString(),
    uptime: startTime,
    version: '0.1.0',
    checks,
  };
}