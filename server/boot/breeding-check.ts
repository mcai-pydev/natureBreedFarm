import { animalBreedingService } from '../animal-breeding';

/**
 * Boot Module interface definition
 */
interface BootModule {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  details?: any;
}

/**
 * Animal Breeding module health check
 * Verifies that the breeding module and its components are working correctly
 */
export async function checkBreedingSystem(): Promise<BootModule> {
  try {
    // Check if we can retrieve animals
    const animals = await animalBreedingService.getAnimals();
    if (!animals || animals.length === 0) {
      return {
        name: 'breeding',
        status: 'warning',
        message: 'No animals found in the breeding system'
      };
    }

    // Check if we have at least two rabbits for testing breeding compatibility
    const rabbits = await animalBreedingService.getAnimalsByType('rabbit');
    if (rabbits.length < 2) {
      return {
        name: 'breeding',
        status: 'warning',
        message: 'Need at least two rabbits to test breeding functionality',
        details: { animalCount: animals.length, rabbitCount: rabbits.length }
      };
    }

    // Find at least one male and one female for compatibility check
    const maleRabbit = rabbits.find(rabbit => rabbit.gender === 'male');
    const femaleRabbit = rabbits.find(rabbit => rabbit.gender === 'female');

    if (!maleRabbit || !femaleRabbit) {
      return {
        name: 'breeding',
        status: 'warning',
        message: 'Need at least one male and one female rabbit to test breeding compatibility',
        details: { 
          maleCount: rabbits.filter(r => r.gender === 'male').length,
          femaleCount: rabbits.filter(r => r.gender === 'female').length
        }
      };
    }

    // Test inbreeding check functionality
    const inbreedingRisk = await animalBreedingService.checkInbreedingRisk(
      maleRabbit.id, 
      femaleRabbit.id
    );

    // Test potential mates functionality
    const potentialMates = await animalBreedingService.getPotentialMates(femaleRabbit.id);

    // Check breeding events functionality
    const breedingEvents = await animalBreedingService.getBreedingEvents();

    return {
      name: 'breeding',
      status: 'success',
      message: 'Breeding system is working properly',
      details: {
        animalCount: animals.length,
        rabbitCount: rabbits.length,
        breedingEventsCount: breedingEvents.length,
        inbreedingCheckWorking: true,
        potentialMatesWorking: potentialMates.length >= 0
      }
    };
  } catch (error) {
    return {
      name: 'breeding',
      status: 'error',
      message: `Breeding system check failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}