/**
 * Sample data seeder for database
 * This will load the in-memory rabbit data into the PostgreSQL database
 */

import { db } from './db';
import { animals, breedingEvents, rabbitBreeds } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { animalBreedingService } from './animal-breeding';

// Function to seed the sample animal data into the database
export async function seedAnimalData() {
  try {
    console.log('🌱 Checking for existing animals in database...');
    
    // Get count of animals in database
    const dbAnimals = await db.select().from(animals);
    
    if (dbAnimals.length > 0) {
      console.log(`🌱 Database already has ${dbAnimals.length} animals, no seeding needed.`);
      return {
        success: true,
        message: `Database already has ${dbAnimals.length} animals, no seeding needed`,
        count: dbAnimals.length
      };
    }
    
    console.log('🌱 No animals found in database. Seeding from in-memory data...');
    
    // First check if we have any rabbit breeds in the database
    const breeds = await db.select().from(rabbitBreeds);
    const hasBreeds = breeds.length > 0;
    
    if (!hasBreeds) {
      console.log('⚠️ No rabbit breeds found in database. Animal breed IDs will be set to null.');
    }
    
    // Get animals from in-memory service
    const memAnimals = await animalBreedingService.getAnimals();
    
    if (memAnimals.length === 0) {
      console.log('🌱 No animals found in memory service to seed.');
      return {
        success: false,
        message: 'No animals found in memory service to seed',
        count: 0
      };
    }
    
    // Insert animals into database
    const insertedAnimals = [];
    for (const animal of memAnimals) {
      // First check if the animal already exists by animal_id
      const existingAnimal = await db
        .select()
        .from(animals)
        .where(eq(animals.animalId, animal.animalId));
      
      if (existingAnimal.length === 0) {
        // Create values object with proper handling of breed IDs
        const animalValues = {
          id: animal.id,
          animalId: animal.animalId,
          name: animal.name,
          type: animal.type,
          breed: animal.breed,
          breedId: hasBreeds ? animal.breedId : null,  // Set to null if no breeds exist
          secondaryBreedId: hasBreeds ? animal.secondaryBreedId : null,  // Set to null if no breeds exist
          isMixed: animal.isMixed,
          mixRatio: animal.mixRatio,
          gender: animal.gender,
          weight: animal.weight,
          color: animal.color,
          markings: animal.markings,
          parentMaleId: animal.parentMaleId,
          parentFemaleId: animal.parentFemaleId,
          generation: animal.generation,
          ancestry: animal.ancestry,
          pedigreeLevel: animal.pedigreeLevel,
          health: animal.health,
          fertility: animal.fertility,
          growthRate: animal.growthRate,
          litterSize: animal.litterSize,
          offspringCount: animal.offspringCount,
          survivabilityRate: animal.survivabilityRate,
          dateOfBirth: animal.dateOfBirth,
          weanDate: animal.weanDate,
          matureDate: animal.matureDate,
          retirementDate: animal.retirementDate,
          status: animal.status,
          cageNumber: animal.cageNumber,
          dietaryNotes: animal.dietaryNotes,
          healthNotes: animal.healthNotes,
          behaviorNotes: animal.behaviorNotes,
          imageUrl: animal.imageUrl,
          notes: animal.notes,
          tags: animal.tags,
          purchasePrice: animal.purchasePrice,
          currentValue: animal.currentValue,
          roi: animal.roi,
          createdBy: animal.createdBy,
          createdAt: animal.createdAt,
          traits: animal.traits
        };
        
        try {
          const [result] = await db.insert(animals).values(animalValues).returning();
          insertedAnimals.push(result);
          console.log(`✅ Inserted animal: ${animal.name} (${animal.animalId})`);
        } catch (insertError) {
          console.error(`❌ Error inserting animal ${animal.name} (${animal.animalId}):`, insertError);
          // Continue with the next animal rather than failing the whole process
        }
      }
    }
    
    console.log(`🌱 Successfully seeded ${insertedAnimals.length} animals to database.`);
    
    // Now seed breeding events
    const memEvents = await animalBreedingService.getBreedingEvents();
    
    if (memEvents.length > 0) {
      console.log(`🌱 Seeding ${memEvents.length} breeding events to database...`);
      
      const insertedEvents = [];
      for (const event of memEvents) {
        // Check if event already exists
        const existingEvent = await db
          .select()
          .from(breedingEvents)
          .where(eq(breedingEvents.eventId, event.eventId));
        
        if (existingEvent.length === 0) {
          // Create a values object with only the fields that exist in the schema
          const eventValues = {
            eventId: event.eventId,
            maleId: event.maleId,
            femaleId: event.femaleId,
            pairId: event.pairId,
            breedingDate: event.breedingDate,
            nestBoxDate: event.nestBoxDate,
            expectedBirthDate: event.expectedBirthDate,
            actualBirthDate: event.actualBirthDate,
            status: event.status,
            successRating: event.successRating,
            wasPlanned: event.wasPlanned,
            offspringCount: event.offspringCount,
            offspringIds: event.offspringIds,
            maleOffspringCount: event.maleOffspringCount,
            femaleOffspringCount: event.femaleOffspringCount,
            offspringWeightAvg: event.offspringWeightAvg,
            offspringHealthAvg: event.offspringHealthAvg,
            offspringMortality: event.offspringMortality,
            crossBreedType: event.crossBreedType,
            expectedTraitsMatched: event.expectedTraitsMatched,
            unexpectedTraitsObserved: event.unexpectedTraitsObserved,
            geneticAnomalies: event.geneticAnomalies,
            performanceRating: event.performanceRating,
            economicValue: event.economicValue,
            notes: event.notes,
            images: event.images,
            createdBy: event.createdBy,
            createdAt: event.createdAt
          };
          
          try {
            const [result] = await db.insert(breedingEvents).values(eventValues).returning();
            insertedEvents.push(result);
            console.log(`✅ Inserted breeding event: ${event.eventId}`);
          } catch (insertError) {
            console.error(`❌ Error inserting breeding event ${event.eventId}:`, insertError);
            // Continue with the next event rather than failing the whole process
          }
        }
      }
      
      console.log(`🌱 Successfully seeded ${insertedEvents.length} breeding events to database.`);
    } else {
      console.log('🌱 No breeding events found in memory to seed.');
    }
    
    return {
      success: true,
      message: `Successfully seeded ${insertedAnimals.length} animals and ${memEvents.length} breeding events to database`,
      animalCount: insertedAnimals.length,
      eventCount: memEvents.length
    };
  } catch (error) {
    console.error('❌ Error seeding animal data:', error);
    return {
      success: false,
      message: `Error seeding animal data: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
}