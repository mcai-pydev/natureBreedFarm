import { 
  animals, type Animal, type InsertAnimal,
  breedingEvents, type BreedingEvent, type InsertBreedingEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, not } from "drizzle-orm";

export interface AnimalBreedingService {
  // Animal management
  getAnimals(): Promise<Animal[]>;
  getAnimal(id: number): Promise<Animal | undefined>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: number, animal: Partial<InsertAnimal>): Promise<Animal | undefined>;
  deleteAnimal(id: number): Promise<boolean>;
  
  // Breeding match suggestions and inbreeding prevention
  getPotentialMates(animalId: number): Promise<Animal[]>;
  checkInbreedingRisk(maleId: number, femaleId: number): Promise<{
    isRisky: boolean;
    relationshipType?: string;
  }>;
  
  // Breeding events management
  getBreedingEvents(): Promise<BreedingEvent[]>;
  getBreedingEvent(id: number): Promise<BreedingEvent | undefined>;
  createBreedingEvent(event: InsertBreedingEvent): Promise<BreedingEvent>;
  updateBreedingEvent(id: number, event: Partial<InsertBreedingEvent>): Promise<BreedingEvent | undefined>;
  deleteBreedingEvent(id: number): Promise<boolean>;
}

// Database implementation of the Animal Breeding Service
export class DatabaseAnimalBreedingService implements AnimalBreedingService {
  
  async getAnimals(): Promise<Animal[]> {
    // Only fetch rabbits in this micro-app
    return db.select().from(animals).where(eq(animals.type, "rabbit"));
  }
  
  async getAnimal(id: number): Promise<Animal | undefined> {
    const [animal] = await db.select().from(animals).where(eq(animals.id, id));
    return animal;
  }
  
  async createAnimal(animal: InsertAnimal): Promise<Animal> {
    // Create animal with type set to "rabbit" for this micro-app
    const animalData = { ...animal };
    
    // Generate automatic unique animalId if not provided
    if (!animalData.animalId) {
      const prefix = animalData.gender === 'male' ? 'M' : 'F';
      const existingIds = await db
        .select({ count: animals.id })
        .from(animals)
        .where(eq(animals.type, "rabbit"));
      
      const count = existingIds.length + 1;
      animalData.animalId = `${prefix}${count}`;
    }
    
    const [newAnimal] = await db
      .insert(animals)
      .values({
        ...animalData,
        type: "rabbit" // Explicitly set type here
      })
      .returning();
      
    return newAnimal;
  }
  
  async updateAnimal(id: number, animalUpdate: Partial<InsertAnimal>): Promise<Animal | undefined> {
    const [updatedAnimal] = await db
      .update(animals)
      .set({
        ...animalUpdate,
        updatedAt: new Date()
      })
      .where(eq(animals.id, id))
      .returning();
      
    return updatedAnimal;
  }
  
  async deleteAnimal(id: number): Promise<boolean> {
    // Check if this animal is used as a parent in other animals
    const offspring = await db
      .select()
      .from(animals)
      .where(
        or(
          eq(animals.parentMaleId, id),
          eq(animals.parentFemaleId, id)
        )
      );
      
    if (offspring.length > 0) {
      // Don't delete animals with offspring, mark as inactive instead
      await db
        .update(animals)
        .set({ 
          status: "inactive",
          updatedAt: new Date()
        })
        .where(eq(animals.id, id));
        
      return false;
    }
    
    // Delete the animal if it has no offspring
    const result = await db
      .delete(animals)
      .where(eq(animals.id, id));
      
    return true;
  }
  
  async getPotentialMates(animalId: number): Promise<Animal[]> {
    const animal = await this.getAnimal(animalId);
    if (!animal) return [];
    
    // Get rabbits of the opposite gender that are active
    const oppositeGender = animal.gender === 'male' ? 'female' : 'male';
    
    const potentialMates = await db
      .select()
      .from(animals)
      .where(
        and(
          eq(animals.type, "rabbit"),
          eq(animals.gender, oppositeGender),
          eq(animals.status, "active"),
          not(eq(animals.id, animalId))
        )
      );
      
    // Filter out potential mates with inbreeding risk
    const safeMatches = [];
    
    for (const potential of potentialMates) {
      const maleId = animal.gender === 'male' ? animal.id : potential.id;
      const femaleId = animal.gender === 'female' ? animal.id : potential.id;
      
      const { isRisky } = await this.checkInbreedingRisk(maleId, femaleId);
      
      if (!isRisky) {
        safeMatches.push(potential);
      }
    }
    
    return safeMatches;
  }
  
  async checkInbreedingRisk(maleId: number, femaleId: number): Promise<{
    isRisky: boolean;
    relationshipType?: string;
  }> {
    const [male] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, maleId));
      
    const [female] = await db
      .select()
      .from(animals)
      .where(eq(animals.id, femaleId));
      
    if (!male || !female) {
      return { isRisky: false };
    }
    
    // Check if they're siblings or half-siblings
    if ((male.parentMaleId && male.parentMaleId === female.parentMaleId) ||
        (male.parentFemaleId && male.parentFemaleId === female.parentFemaleId)) {
      return { 
        isRisky: true, 
        relationshipType: (male.parentMaleId === female.parentMaleId && male.parentFemaleId === female.parentFemaleId) 
          ? "siblings" 
          : "half-siblings" 
      };
    }
    
    // Check if one is the parent of the other
    if (male.id === female.parentMaleId || female.id === male.parentFemaleId) {
      return { isRisky: true, relationshipType: "parent-child" };
    }
    
    // Advanced check for grandparents or cousins using ancestry array
    if (male.ancestry && female.ancestry && 
        (male.ancestry.length > 0 && female.ancestry.length > 0)) {
      
      // Check for shared ancestors
      const sharedAncestors = male.ancestry.filter(maleAncestor => 
        female.ancestry && female.ancestry.includes(maleAncestor)
      );
      
      if (sharedAncestors.length > 0) {
        return { 
          isRisky: true, 
          relationshipType: "shared ancestry" 
        };
      }
    }
    
    return { isRisky: false };
  }
  
  async getBreedingEvents(): Promise<BreedingEvent[]> {
    return db.select().from(breedingEvents);
  }
  
  async getBreedingEvent(id: number): Promise<BreedingEvent | undefined> {
    const [event] = await db
      .select()
      .from(breedingEvents)
      .where(eq(breedingEvents.id, id));
      
    return event;
  }
  
  async createBreedingEvent(event: InsertBreedingEvent): Promise<BreedingEvent> {
    // Generate event ID if not provided
    if (!event.eventId) {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      event.eventId = `BE-${event.maleId}-${event.femaleId}-${today}`;
    }
    
    // Generate pair ID if not provided
    if (!event.pairId) {
      event.pairId = `PAIR-${event.maleId}-${event.femaleId}`;
    }
    
    // Calculate expected birth date based on breeding date (31 days for rabbits)
    if (!event.expectedBirthDate && event.breedingDate) {
      const breedingDate = new Date(event.breedingDate);
      const expectedBirthDate = new Date(breedingDate);
      expectedBirthDate.setDate(breedingDate.getDate() + 31); // 31 days for rabbits
      event.expectedBirthDate = expectedBirthDate;
    }
    
    // Generate nestbox date (typically 3 days before expected birth for rabbits)
    if (!event.nestBoxDate && event.expectedBirthDate) {
      const expectedBirthDate = new Date(event.expectedBirthDate);
      const nestBoxDate = new Date(expectedBirthDate);
      nestBoxDate.setDate(expectedBirthDate.getDate() - 3);
      event.nestBoxDate = nestBoxDate;
    }
    
    // Calculate genetic compatibility and predicted outcomes if not provided
    if (!event.geneticCompatibilityScore) {
      event.geneticCompatibilityScore = 
        await this.calculateGeneticCompatibility(event.maleId, event.femaleId);
    }
    
    if (!event.predictedLitterSize) {
      event.predictedLitterSize = 
        await this.predictLitterSize(event.maleId, event.femaleId);
    }
    
    if (!event.predictedOffspringHealth) {
      event.predictedOffspringHealth = 
        await this.predictOffspringHealth(event.maleId, event.femaleId);
    }
    
    if (!event.predictedROI) {
      event.predictedROI = 
        await this.calculatePredictedROI(event.maleId, event.femaleId);
    }
    
    // Create the breeding event
    const [newEvent] = await db
      .insert(breedingEvents)
      .values(event)
      .returning();
      
    return newEvent;
  }
  
  // Helper methods for breeding predictions
  private async calculateGeneticCompatibility(maleId: number, femaleId: number): Promise<number> {
    // Default high compatibility if no issues
    let score = 90;
    
    // Check for inbreeding risk
    const { isRisky } = await this.checkInbreedingRisk(maleId, femaleId);
    if (isRisky) {
      score -= 30; // Major penalty for inbreeding risk
    }
    
    // Return a score between 30-100
    return Math.max(30, Math.min(100, score));
  }
  
  private async predictLitterSize(maleId: number, femaleId: number): Promise<number> {
    const male = await this.getAnimal(maleId);
    const female = await this.getAnimal(femaleId);
    
    if (!male || !female) return 0;
    
    // Start with a base litter size for rabbits
    let baseSize = 6; // Default for rabbits
    
    // Female fertility impacts litter size
    const fertilityFactor = (female.fertility || 85) / 85;
    
    // Adjust for female's known litter size, if available
    if (female.litterSize) {
      baseSize = female.litterSize;
    }
    
    return Math.round(baseSize * fertilityFactor);
  }
  
  private async predictOffspringHealth(maleId: number, femaleId: number): Promise<number> {
    const male = await this.getAnimal(maleId);
    const female = await this.getAnimal(femaleId);
    
    if (!male || !female) return 85; // Default health score
    
    // Parent health scores influence offspring health
    const maleHealth = male.health || 85;
    const femaleHealth = female.health || 85;
    
    // Calculate baseline health prediction (average of parents)
    let baseHealth = (maleHealth + femaleHealth) / 2;
    
    // Check for inbreeding risk which reduces health
    const { isRisky } = await this.checkInbreedingRisk(maleId, femaleId);
    if (isRisky) {
      baseHealth *= 0.85; // 15% reduction in health for inbreeding
    }
    
    // Hybrid vigor bonus for mixed breeds
    if (male.breed !== female.breed) {
      baseHealth *= 1.05; // 5% health bonus for hybrid vigor
    }
    
    return Math.round(Math.max(60, Math.min(100, baseHealth)));
  }
  
  private async calculatePredictedROI(maleId: number, femaleId: number): Promise<number> {
    const male = await this.getAnimal(maleId);
    const female = await this.getAnimal(femaleId);
    
    if (!male || !female) return 0;
    
    // Predict litter size
    const litterSize = await this.predictLitterSize(maleId, femaleId);
    
    // Baseline value per offspring (for rabbits)
    const valuePerOffspring = 30; // $30 per rabbit
    
    // Adjust value based on breed purity and health
    const healthScore = await this.predictOffspringHealth(maleId, femaleId);
    const healthMultiplier = healthScore / 85; // Relative to baseline health
    
    // Calculate total projected revenue
    const projectedRevenue = litterSize * valuePerOffspring * healthMultiplier;
    
    // Estimated costs (feed, care, etc.)
    const costPerOffspring = valuePerOffspring * 0.4; // 40% of value as cost
    const totalCost = litterSize * costPerOffspring;
    
    // ROI calculation
    return Math.round(projectedRevenue - totalCost);
  }
  
  async updateBreedingEvent(id: number, eventUpdate: Partial<InsertBreedingEvent>): Promise<BreedingEvent | undefined> {
    const [updatedEvent] = await db
      .update(breedingEvents)
      .set({
        ...eventUpdate,
        updatedAt: new Date()
      })
      .where(eq(breedingEvents.id, id))
      .returning();
      
    return updatedEvent;
  }
  
  async deleteBreedingEvent(id: number): Promise<boolean> {
    await db
      .delete(breedingEvents)
      .where(eq(breedingEvents.id, id));
      
    return true;
  }
  
  // Seed data method for testing
  async seedSampleData(): Promise<void> {
    // Check if we already have data
    const existingAnimals = await this.getAnimals();
    if (existingAnimals.length > 0) {
      console.log("Sample data already exists, skipping seeding");
      return;
    }
    
    // Create sample rabbits
    const rabbit1 = await this.createAnimal({
      animalId: "M1",
      name: "Buck Rogers",
      breed: "New Zealand White",
      gender: "male",
      weight: 4.2,
      color: "white",
      dateOfBirth: new Date("2024-01-15"),
      status: "active",
      health: 95,
      fertility: 90,
      cageNumber: "A-1",
      notes: "Foundation buck with excellent genetic traits",
      tags: ["breeding", "show-quality"]
    });
    
    const rabbit2 = await this.createAnimal({
      animalId: "F1",
      name: "Daisy",
      breed: "New Zealand White",
      gender: "female",
      weight: 4.8,
      color: "white",
      dateOfBirth: new Date("2024-01-20"),
      status: "active",
      health: 92,
      fertility: 95,
      litterSize: 8,
      cageNumber: "A-2",
      notes: "Foundation doe with high fertility",
      tags: ["breeding", "show-quality"]
    });
    
    const rabbit3 = await this.createAnimal({
      animalId: "M2",
      name: "Thumper",
      breed: "Californian",
      gender: "male",
      weight: 3.9,
      color: "white with black points",
      dateOfBirth: new Date("2024-02-05"),
      status: "active",
      health: 88,
      fertility: 85,
      cageNumber: "B-1",
      notes: "Good meat production genetics",
      tags: ["breeding", "meat"]
    });
    
    const rabbit4 = await this.createAnimal({
      animalId: "F2",
      name: "Flopsy",
      breed: "Californian",
      gender: "female",
      weight: 4.3,
      color: "white with black points",
      dateOfBirth: new Date("2024-02-10"),
      status: "active",
      health: 90,
      fertility: 92,
      litterSize: 7,
      cageNumber: "B-2",
      notes: "Good mothering instincts",
      tags: ["breeding", "meat"]
    });
    
    // Create a breeding event
    await this.createBreedingEvent({
      eventId: "BE-001",
      maleId: rabbit1.id,
      femaleId: rabbit2.id,
      pairId: "PAIR-M1-F1",
      breedingDate: new Date("2025-03-01"),
      status: "pending",
      breedingPurpose: "commercial",
      notes: "First breeding trial with foundation stock"
    });
    
    console.log("Sample data has been seeded successfully");
  }
}

export const animalBreedingService = new DatabaseAnimalBreedingService();