import { 
  animals, type Animal, type InsertAnimal,
  breedingEvents, type BreedingEvent, type InsertBreedingEvent
} from "@shared/schema";

export interface AnimalBreedingService {
  // Animal management
  getAnimals(): Promise<Animal[]>;
  getAnimalsByType(type: string): Promise<Animal[]>;
  getAnimal(id: number): Promise<Animal | undefined>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: number, animal: Partial<InsertAnimal>): Promise<Animal | undefined>;
  deleteAnimal(id: number): Promise<boolean>;
  
  // Breeding match suggestions and inbreeding prevention
  getPotentialMates(animalId: number): Promise<Animal[]>;
  checkInbreedingRisk(maleId: number, femaleId: number): Promise<{
    isRisky: boolean;
    relationshipType?: string; // e.g., "siblings", "parent-child", "half-siblings"
  }>;
  
  // Breeding events management
  getBreedingEvents(): Promise<BreedingEvent[]>;
  getBreedingEvent(id: number): Promise<BreedingEvent | undefined>;
  createBreedingEvent(event: InsertBreedingEvent & { breedingDate: Date }): Promise<BreedingEvent>;
  updateBreedingEvent(id: number, event: Partial<InsertBreedingEvent>): Promise<BreedingEvent | undefined>;
  deleteBreedingEvent(id: number): Promise<boolean>;
}

// In-memory implementation of the Animal Breeding Service
export class MemAnimalBreedingService implements AnimalBreedingService {
  private animals: Map<number, Animal>;
  private breedingEvents: Map<number, BreedingEvent>;
  
  private currentAnimalId: number;
  private currentBreedingEventId: number;
  
  constructor() {
    this.animals = new Map();
    this.breedingEvents = new Map();
    this.currentAnimalId = 1;
    this.currentBreedingEventId = 1;
    
    // Add some sample data for testing
    this.initSampleData();
  }
  
  async getAnimals(): Promise<Animal[]> {
    return Array.from(this.animals.values());
  }
  
  async getAnimalsByType(type: string): Promise<Animal[]> {
    return Array.from(this.animals.values())
      .filter(animal => animal.type.toLowerCase() === type.toLowerCase());
  }
  
  async getAnimal(id: number): Promise<Animal | undefined> {
    return this.animals.get(id);
  }
  
  async createAnimal(animal: InsertAnimal): Promise<Animal> {
    const id = this.currentAnimalId++;
    const newAnimal: Animal = {
      id,
      name: animal.name,
      type: animal.type,
      gender: animal.gender,
      status: animal.status || "active",
      breed: animal.breed || null,
      dateOfBirth: animal.dateOfBirth || null,
      fatherId: animal.fatherId || null,
      motherId: animal.motherId || null,
      notes: animal.notes || null,
      imageUrl: animal.imageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.animals.set(id, newAnimal);
    return newAnimal;
  }
  
  async updateAnimal(id: number, animalUpdate: Partial<InsertAnimal>): Promise<Animal | undefined> {
    const existingAnimal = this.animals.get(id);
    if (!existingAnimal) return undefined;
    
    const updatedAnimal: Animal = { 
      ...existingAnimal, 
      ...animalUpdate,
      updatedAt: new Date()
    };
    this.animals.set(id, updatedAnimal);
    return updatedAnimal;
  }
  
  async deleteAnimal(id: number): Promise<boolean> {
    // First check if this animal is used as a parent in other animals
    const hasOffspring = Array.from(this.animals.values()).some(
      animal => animal.fatherId === id || animal.motherId === id
    );
    
    if (hasOffspring) {
      // Don't delete animals with offspring, maybe mark as inactive instead
      const animal = this.animals.get(id);
      if (animal) {
        animal.status = "inactive";
        this.animals.set(id, animal);
      }
      return false;
    }
    
    return this.animals.delete(id);
  }
  
  async getPotentialMates(animalId: number): Promise<Animal[]> {
    const animal = await this.getAnimal(animalId);
    if (!animal) return [];
    
    // Get animals of the opposite gender and same type
    return Array.from(this.animals.values()).filter(potential => {
      // Must be active and the opposite gender
      if (potential.status !== "active" || potential.gender === animal.gender) {
        return false;
      }
      
      // Must be the same type (same species)
      if (potential.type !== animal.type) {
        return false;
      }
      
      // Check for inbreeding risk
      const { isRisky } = this.checkInbreedingRiskSync(
        animal.gender === "male" ? animal.id : potential.id,
        animal.gender === "female" ? animal.id : potential.id
      );
      
      // Only include animals without inbreeding risk
      return !isRisky;
    });
  }
  
  // Internal synchronous version for use in other methods
  private checkInbreedingRiskSync(maleId: number, femaleId: number): {
    isRisky: boolean;
    relationshipType?: string;
  } {
    const male = this.animals.get(maleId);
    const female = this.animals.get(femaleId);
    
    if (!male || !female) {
      return { isRisky: false };
    }
    
    // Check if they're siblings or half-siblings
    if ((male.fatherId && male.fatherId === female.fatherId) ||
        (male.motherId && male.motherId === female.motherId)) {
      return { 
        isRisky: true, 
        relationshipType: (male.fatherId === female.fatherId && male.motherId === female.motherId) 
          ? "siblings" 
          : "half-siblings" 
      };
    }
    
    // Check if one is the parent of the other
    if (male.id === female.fatherId || female.id === male.motherId) {
      return { isRisky: true, relationshipType: "parent-child" };
    }
    
    return { isRisky: false };
  }
  
  async checkInbreedingRisk(maleId: number, femaleId: number): Promise<{
    isRisky: boolean;
    relationshipType?: string;
  }> {
    return this.checkInbreedingRiskSync(maleId, femaleId);
  }
  
  async getBreedingEvents(): Promise<BreedingEvent[]> {
    return Array.from(this.breedingEvents.values());
  }
  
  async getBreedingEvent(id: number): Promise<BreedingEvent | undefined> {
    return this.breedingEvents.get(id);
  }
  
  async createBreedingEvent(event: InsertBreedingEvent): Promise<BreedingEvent> {
    const id = this.currentBreedingEventId++;
    
    // Calculate expected birth date based on animal type
    let expectedBirthDate = event.expectedBirthDate;
    if (!expectedBirthDate && event.breedingDate) {
      const male = await this.getAnimal(event.maleId);
      if (male) {
        // Set gestation period based on animal type
        let gestationDays = 30; // Default
        
        switch(male.type.toLowerCase()) {
          case 'rabbit':
            gestationDays = 31; // ~31 days for rabbits
            break;
          case 'goat':
            gestationDays = 150; // ~150 days for goats
            break;
          case 'chicken':
            gestationDays = 21; // ~21 days for chicken eggs
            break;
          case 'duck':
            gestationDays = 28; // ~28 days for duck eggs
            break;
        }
        
        // Calculate expected birth date
        const breedingDate = new Date(event.breedingDate);
        expectedBirthDate = new Date(breedingDate);
        expectedBirthDate.setDate(breedingDate.getDate() + gestationDays);
      }
    }
    
    const newEvent: BreedingEvent = {
      id,
      maleId: event.maleId,
      femaleId: event.femaleId,
      breedingDate: event.breedingDate!, // Assert breedingDate is required
      status: event.status || "pending",
      expectedBirthDate: expectedBirthDate || null,
      actualBirthDate: event.actualBirthDate || null,
      offspringCount: event.offspringCount || null,
      notes: event.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.breedingEvents.set(id, newEvent);
    return newEvent;
  }
  
  async updateBreedingEvent(id: number, eventUpdate: Partial<InsertBreedingEvent>): Promise<BreedingEvent | undefined> {
    const existingEvent = this.breedingEvents.get(id);
    if (!existingEvent) return undefined;
    
    // If we're recording birth (setting actualBirthDate), and we have offspring count
    // we could automatically create new animal records here
    if (eventUpdate.actualBirthDate && 
        eventUpdate.offspringCount && 
        eventUpdate.offspringCount > 0 && 
        !existingEvent.actualBirthDate) {
      
      // Get parent animals for reference
      const male = await this.getAnimal(existingEvent.maleId);
      const female = await this.getAnimal(existingEvent.femaleId);
      
      if (male && female) {
        // Create offspring based on count
        for (let i = 0; i < eventUpdate.offspringCount; i++) {
          await this.createAnimal({
            name: `Offspring ${i+1} of ${female.name}`,
            type: male.type, // Assuming offspring are same type as parents
            breed: male.breed === female.breed ? male.breed : `${male.breed}/${female.breed}`, // Mixed breed if parents differ
            gender: Math.random() > 0.5 ? 'male' : 'female', // Random gender assignment
            dateOfBirth: eventUpdate.actualBirthDate,
            fatherId: male.id,
            motherId: female.id,
            status: 'active',
            notes: `Offspring from breeding event #${id}`
          });
        }
      }
    }
    
    const updatedEvent: BreedingEvent = { 
      ...existingEvent, 
      ...eventUpdate,
      updatedAt: new Date()
    };
    this.breedingEvents.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteBreedingEvent(id: number): Promise<boolean> {
    const event = this.breedingEvents.get(id);
    // If the event already resulted in births, don't allow deletion
    if (event && event.actualBirthDate && event.offspringCount && event.offspringCount > 0) {
      return false;
    }
    return this.breedingEvents.delete(id);
  }
  
  // Initialize with sample data
  private async initSampleData() {
    // Create some sample animals for testing
    const rabbit1 = await this.createAnimal({
      name: "Fluffy",
      type: "rabbit",
      breed: "Dutch",
      gender: "female",
      status: "active",
      dateOfBirth: new Date("2024-09-15"),
      notes: "Healthy female rabbit"
    });
    
    const rabbit2 = await this.createAnimal({
      name: "Hopper",
      type: "rabbit",
      breed: "Dutch",
      gender: "male",
      status: "active",
      dateOfBirth: new Date("2024-08-10"),
      notes: "Active breeding male"
    });
    
    const rabbit3 = await this.createAnimal({
      name: "Cotton",
      type: "rabbit",
      breed: "Angora",
      gender: "female",
      status: "active",
      dateOfBirth: new Date("2024-07-20"),
      notes: "Purebred Angora, good for breeding"
    });
    
    const goat1 = await this.createAnimal({
      name: "Billy",
      type: "goat",
      breed: "Boer",
      gender: "male",
      status: "active",
      dateOfBirth: new Date("2023-05-10"),
      notes: "Healthy breeding male"
    });
    
    const goat2 = await this.createAnimal({
      name: "Nanny",
      type: "goat",
      breed: "Boer",
      gender: "female",
      status: "active",
      dateOfBirth: new Date("2023-06-15"),
      notes: "Good milk producer"
    });
    
    // Create some breeding events
    await this.createBreedingEvent({
      maleId: rabbit2.id,
      femaleId: rabbit3.id,
      breedingDate: new Date("2025-03-15"),
      status: "pending",
      notes: "First breeding attempt"
    });
    
    await this.createBreedingEvent({
      maleId: goat1.id,
      femaleId: goat2.id,
      breedingDate: new Date("2025-04-01"),
      status: "pending",
      notes: "Seasonal breeding"
    });
  }
}

// Export a singleton instance
export const animalBreedingService = new MemAnimalBreedingService();