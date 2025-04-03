import { animalBreedingService } from '../animal-breeding';
import { BootCheckResult } from './types';

// Status object for rabbit breeding check
interface RabbitBreedingStatus {
  animalsCount: number;
  rabbitsCount: number;
  maleRabbits: number;
  femaleRabbits: number;
  breedingEvents: number;
  suggestionsAvailable: boolean;
  hasBreedingPairs?: boolean;
  hasBreedingEvents?: boolean;
}

/**
 * Performs a health check on the rabbit breeding system
 * Verifies database connectivity, breeding suggestions, and inbreeding prevention
 */
export async function checkRabbitBreeding(): Promise<BootCheckResult> {
  try {
    // Step 1: Check if we can retrieve animal data
    const animals = await animalBreedingService.getAnimals();
    
    if (!animals || !Array.isArray(animals)) {
      return {
        status: 'error',
        message: 'Rabbit breeding module failed: Could not retrieve animals',
        details: null
      };
    }
    
    // Step 2: Check rabbit-specific data
    const rabbits = await animalBreedingService.getAnimalsByType('rabbit');
    
    if (!rabbits || !Array.isArray(rabbits)) {
      return {
        status: 'error',
        message: 'Rabbit breeding module failed: Could not retrieve rabbits',
        details: null
      };
    }
    
    // Step 3: Check if we have enough rabbits for breeding operations
    if (rabbits.length < 2) {
      return {
        status: 'warning',
        message: 'Rabbit breeding system operational but has insufficient stock for breeding suggestions (need at least 2 rabbits)',
        details: {
          animalsCount: animals.length,
          rabbitsCount: rabbits.length,
          maleRabbits: 0,
          femaleRabbits: 0,
          breedingEvents: 0,
          suggestionsAvailable: false
        }
      };
    }
    
    // Step 4: Check gender distribution
    const maleRabbits = rabbits.filter(rabbit => rabbit.gender === 'male');
    const femaleRabbits = rabbits.filter(rabbit => rabbit.gender === 'female');
    
    // Step 5: Check if we have rabbits of both genders for breeding
    const hasBreedingPairs = maleRabbits.length > 0 && femaleRabbits.length > 0;
    
    // Step 6: Check potential mates functionality
    let suggestionsAvailable = false;
    if (hasBreedingPairs) {
      const maleSampleId = maleRabbits[0].id;
      const femaleSampleId = femaleRabbits[0].id;
      
      try {
        // Test getting potential mates
        const potentialMates = await animalBreedingService.getPotentialMates(maleSampleId);
        suggestionsAvailable = Array.isArray(potentialMates);
        
        // Test inbreeding prevention system
        const inbreedingCheck = await animalBreedingService.checkInbreedingRisk(maleSampleId, femaleSampleId);
        if (typeof inbreedingCheck !== 'object' || typeof inbreedingCheck.isRisky !== 'boolean') {
          return {
            status: 'error',
            message: 'Rabbit breeding module failed: Inbreeding prevention system not working properly',
            details: null
          };
        }
      } catch (error: any) {
        return {
          status: 'error',
          message: `Rabbit breeding module failed: Breeding suggestions system error - ${error.message}`,
          details: null
        };
      }
    }
    
    // Step 7: Check breeding events
    const breedingEvents = await animalBreedingService.getBreedingEvents();
    const hasBreedingEvents = Array.isArray(breedingEvents) && breedingEvents.length > 0;
    
    // Return success with status information
    const rabbitDetails: RabbitBreedingStatus = {
      animalsCount: animals.length,
      rabbitsCount: rabbits.length,
      maleRabbits: maleRabbits.length,
      femaleRabbits: femaleRabbits.length,
      breedingEvents: breedingEvents.length,
      suggestionsAvailable: suggestionsAvailable,
      hasBreedingPairs: hasBreedingPairs,
      hasBreedingEvents: hasBreedingEvents
    };
    
    return {
      status: 'success',
      message: `Rabbit breeding system operational with ${rabbits.length} rabbits available`,
      details: rabbitDetails
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: `Rabbit breeding module failed: ${error.message}`,
      details: null
    };
  }
}