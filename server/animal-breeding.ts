import { 
  animals, type Animal, type InsertAnimal,
  breedingEvents, type BreedingEvent, type InsertBreedingEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, not } from "drizzle-orm";

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
  createBreedingEvent(event: InsertBreedingEvent): Promise<BreedingEvent>;
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
    
    // Generate automatic unique animalId if not provided
    const animalId = animal.animalId || this.generateAnimalId(animal.type, animal.gender, id);
    
    const newAnimal: Animal = {
      id,
      name: animal.name,
      type: animal.type,
      status: animal.status || "active",
      animalId: animalId,
      gender: animal.gender,
      
      // Breed information
      breed: animal.breed || null,
      breedId: animal.breedId || null,
      secondaryBreedId: animal.secondaryBreedId || null,
      isMixed: animal.isMixed || false,
      mixRatio: animal.mixRatio || null,
      
      // Physical traits
      weight: animal.weight || null,
      color: animal.color || null,
      markings: animal.markings || null,
      
      // Lineage data
      parentMaleId: animal.parentMaleId || null,
      parentFemaleId: animal.parentFemaleId || null,
      generation: animal.generation || 0,
      ancestry: animal.ancestry || [],
      pedigreeLevel: animal.pedigreeLevel || 0,
      
      // Performance metrics
      health: animal.health || 85,
      fertility: animal.fertility || 85, 
      growthRate: animal.growthRate || 85,
      litterSize: animal.litterSize || null,
      offspringCount: animal.offspringCount || 0,
      survivabilityRate: animal.survivabilityRate || null,
      
      // Dates
      dateOfBirth: animal.dateOfBirth || null,
      weanDate: animal.weanDate || null, 
      matureDate: animal.matureDate || null,
      retirementDate: animal.retirementDate || null,
      
      // Management data
      cageNumber: animal.cageNumber || null,
      dietaryNotes: animal.dietaryNotes || null,
      healthNotes: animal.healthNotes || null,
      behaviorNotes: animal.behaviorNotes || null,
      
      // Media and notes
      imageUrl: animal.imageUrl || null,
      notes: animal.notes || null,
      tags: animal.tags || [],
      
      // Economic data
      purchasePrice: animal.purchasePrice || null,
      currentValue: animal.currentValue || null,
      roi: animal.roi || null,
      
      // Metadata
      createdBy: animal.createdBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Custom traits
      traits: animal.traits || {}
    };
    
    this.animals.set(id, newAnimal);
    return newAnimal;
  }
  
  // Helper to generate animal IDs in the format required
  private generateAnimalId(type: string, gender: string, id: number): string {
    const prefix = gender === 'male' ? 'M' : 'F';
    return `${prefix}${id}`;
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
      animal => animal.parentMaleId === id || animal.parentFemaleId === id
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
        female.ancestry.includes(maleAncestor)
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
    
    // Generate event ID if not provided
    const eventId = event.eventId || `BE-${id}`;
    
    // Generate pair ID if not provided
    const pairId = event.pairId || `PAIR-${event.maleId}-${event.femaleId}`;
    
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
    
    // Generate nestbox date (typically 3 days before expected birth for rabbits)
    let nestBoxDate = null;
    if (expectedBirthDate) {
      nestBoxDate = new Date(expectedBirthDate);
      nestBoxDate.setDate(expectedBirthDate.getDate() - 3);
    }
    
    // Calculate genetic compatibility and predicted outcomes
    const geneticCompatibilityScore = event.geneticCompatibilityScore || this.calculateGeneticCompatibility(event.maleId, event.femaleId);
    const predictedLitterSize = event.predictedLitterSize || this.predictLitterSize(event.maleId, event.femaleId);
    const predictedOffspringHealth = event.predictedOffspringHealth || this.predictOffspringHealth(event.maleId, event.femaleId);
    const predictedROI = event.predictedROI || this.calculatePredictedROI(event.maleId, event.femaleId);
    
    const newEvent: BreedingEvent = {
      id,
      eventId,
      maleId: event.maleId,
      femaleId: event.femaleId,
      pairId,
      breedingDate: event.breedingDate!, // Assert breedingDate is required
      status: event.status || "pending",
      nestBoxDate,
      expectedBirthDate: expectedBirthDate || null,
      actualBirthDate: event.actualBirthDate || null,
      weanDate: event.weanDate || null,
      expectedOffspringCount: event.expectedOffspringCount || predictedLitterSize,
      actualOffspringCount: event.actualOffspringCount || null,
      offspringCount: event.offspringCount || null,
      offspringIds: event.offspringIds || [],
      maleWeight: event.maleWeight || null,
      femaleWeight: event.femaleWeight || null,
      expectedWeightGain: event.expectedWeightGain || null,
      actualWeightGain: event.actualWeightGain || null,
      
      // Predictive metrics
      geneticCompatibilityScore,
      predictedLitterSize,
      predictedOffspringHealth,
      predictedROI,
      actualROI: event.actualROI || null,
      
      // Additional metadata
      notes: event.notes || null,
      tags: event.tags || [],
      breedingPurpose: event.breedingPurpose || "commercial",
      images: event.images || null,
      createdBy: event.createdBy || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.breedingEvents.set(id, newEvent);
    return newEvent;
  }
  
  // Helper methods for breeding predictions
  private calculateGeneticCompatibility(maleId: number, femaleId: number): number {
    // Default high compatibility if no issues
    let score = 90;
    
    // Check for inbreeding risk
    const { isRisky } = this.checkInbreedingRiskSync(maleId, femaleId);
    if (isRisky) {
      score -= 30; // Major penalty for inbreeding risk
    }
    
    // Return a score between
    return Math.max(30, Math.min(100, score));
  }
  
  private predictLitterSize(maleId: number, femaleId: number): number {
    const male = this.animals.get(maleId);
    const female = this.animals.get(femaleId);
    
    if (!male || !female) return 0;
    
    // Start with a base litter size by type
    let baseSize = 6; // Default for rabbits
    
    if (male.type === 'goat') baseSize = 2;
    if (male.type === 'chicken') baseSize = 8;
    if (male.type === 'duck') baseSize = 10;
    
    // Female fertility impacts litter size
    const fertilityFactor = (female.fertility || 85) / 85;
    
    // Adjust for female's known litter size, if available
    if (female.litterSize) {
      baseSize = female.litterSize;
    }
    
    return Math.round(baseSize * fertilityFactor);
  }
  
  private predictOffspringHealth(maleId: number, femaleId: number): number {
    const male = this.animals.get(maleId);
    const female = this.animals.get(femaleId);
    
    if (!male || !female) return 85; // Default health score
    
    // Parent health scores influence offspring health
    const maleHealth = male.health || 85;
    const femaleHealth = female.health || 85;
    
    // Calculate baseline health prediction (average of parents)
    let baseHealth = (maleHealth + femaleHealth) / 2;
    
    // Check for inbreeding risk which reduces health
    const { isRisky } = this.checkInbreedingRiskSync(maleId, femaleId);
    if (isRisky) {
      baseHealth *= 0.85; // 15% reduction in health for inbreeding
    }
    
    // Hybrid vigor bonus for mixed breeds
    if (male.breed !== female.breed) {
      baseHealth *= 1.05; // 5% health bonus for hybrid vigor
    }
    
    return Math.round(Math.max(60, Math.min(100, baseHealth)));
  }
  
  private calculatePredictedROI(maleId: number, femaleId: number): number {
    const male = this.animals.get(maleId);
    const female = this.animals.get(femaleId);
    
    if (!male || !female) return 0;
    
    // Predict litter size
    const litterSize = this.predictLitterSize(maleId, femaleId);
    
    // Baseline value per offspring
    let valuePerOffspring = 0;
    
    switch(male.type.toLowerCase()) {
      case 'rabbit':
        valuePerOffspring = 30; // $30 per rabbit
        break;
      case 'goat':
        valuePerOffspring = 200; // $200 per kid
        break;
      case 'chicken':
        valuePerOffspring = 5; // $5 per chick
        break;
      case 'duck':
        valuePerOffspring = 7; // $7 per duckling
        break;
      default:
        valuePerOffspring = 25;
    }
    
    // Adjust value based on breed purity and health
    const healthScore = this.predictOffspringHealth(maleId, femaleId);
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
    const existingEvent = this.breedingEvents.get(id);
    if (!existingEvent) return undefined;
    
    // If status changed to "birthed", calculate actual performance metrics
    if (eventUpdate.status === "birthed" && existingEvent.status !== "birthed") {
      // Calculate actual ROI based on actual offspring count vs predicted
      if (eventUpdate.actualOffspringCount && existingEvent.predictedLitterSize) {
        const performanceRatio = eventUpdate.actualOffspringCount / existingEvent.predictedLitterSize;
        // Adjust the predicted ROI by the performance ratio
        eventUpdate.actualROI = Math.round(existingEvent.predictedROI * performanceRatio);
      }
    }
    
    // If we're recording birth (setting actualBirthDate), and we have offspring count
    // we could automatically create new animal records here
    if (eventUpdate.actualBirthDate && 
        (eventUpdate.actualOffspringCount || eventUpdate.offspringCount) && 
        (!existingEvent.actualBirthDate || existingEvent.offspringIds?.length === 0)) {
      
      // Get parent animals for reference
      const male = await this.getAnimal(existingEvent.maleId);
      const female = await this.getAnimal(existingEvent.femaleId);
      
      if (male && female) {
        const actualCount = eventUpdate.actualOffspringCount || eventUpdate.offspringCount;
        
        if (actualCount && actualCount > 0) {
          // Create a pairId if it doesn't exist
          const pairId = existingEvent.pairId || `${male.animalId}-${female.animalId}`;
          
          // Create offspring based on count
          const offspringIds: number[] = [];
          
          for (let i = 0; i < actualCount; i++) {
            // Generate an ID for this offspring based on parents and litter
            const offspringNumber = (i+1).toString().padStart(2, '0');
            const offspringId = `${pairId}_${offspringNumber}`;
            
            // Determine breed and breedId
            let offspringBreed = male.breed;
            let breedId = male.breedId;
            let secondaryBreedId = null;
            let isMixed = false;
            let mixRatio = null;
            
            if (male.breed !== female.breed) {
              offspringBreed = `${male.breed}/${female.breed}`;
              secondaryBreedId = female.breedId;
              isMixed = true;
              mixRatio = "50/50"; // Equal mix from both parents
            }
            
            // Random gender but slightly biased based on animal type
            // For rabbits, slightly more females on average
            let genderBias = male.type === 'rabbit' ? 0.45 : 0.5;
            const gender = Math.random() > genderBias ? 'male' : 'female';
            
            // Create ancestry array from parents
            const ancestry = [
              ...(male.ancestry || []),
              ...(female.ancestry || []),
              `${male.animalId}-${male.id}`, 
              `${female.animalId}-${female.id}`
            ];
            
            // Health calculation - blend of parents with some random variation
            const baseHealth = ((male.health || 85) + (female.health || 85)) / 2;
            // Add random variation of ±5
            const healthVariation = Math.floor(Math.random() * 11) - 5;
            const health = Math.min(100, Math.max(60, baseHealth + healthVariation));
            
            // Create the offspring
            const offspring = await this.createAnimal({
              animalId: offspringId,
              name: `Offspring ${offspringNumber} of ${female.name}`,
              type: male.type,
              breed: offspringBreed,
              breedId,
              secondaryBreedId,
              isMixed,
              mixRatio,
              gender,
              parentMaleId: male.id,
              parentFemaleId: female.id,
              dateOfBirth: eventUpdate.actualBirthDate,
              status: 'active',
              ancestry,
              generation: Math.max((male.generation || 0), (female.generation || 0)) + 1,
              pedigreeLevel: Math.min((male.pedigreeLevel || 3), (female.pedigreeLevel || 3)),
              health,
              fertility: gender === 'female' ? (female.fertility || 90) : (male.fertility || 90),
              growthRate: ((male.growthRate || 85) + (female.growthRate || 85)) / 2,
              tags: ["offspring", male.type, gender],
              birthWeight: eventUpdate.birthWeights ? eventUpdate.birthWeights[i] : null,
              notes: `Offspring from breeding event ${existingEvent.eventId || id}`
            });
            
            offspringIds.push(offspring.id);
          }
          
          // Update the event with the offspring IDs
          eventUpdate.offspringIds = offspringIds;
          
          // Set status to birthed if not already set
          if (!eventUpdate.status) {
            eventUpdate.status = "birthed";
          }
        }
      }
    }
    
    // Calculate wean date if birthed but not weaned yet
    if (eventUpdate.actualBirthDate && !existingEvent.weanDate && !eventUpdate.weanDate) {
      // Rabbits wean around 8 weeks
      const weanDays = 56; // Default 8 weeks
      const weanDate = new Date(eventUpdate.actualBirthDate);
      weanDate.setDate(weanDate.getDate() + weanDays);
      eventUpdate.weanDate = weanDate;
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
      animalId: "F1",
      name: "Fluffy",
      type: "rabbit",
      breed: "Dutch",
      gender: "female",
      breedId: 1, // Dutch breed ID
      status: "active",
      dateOfBirth: new Date("2024-09-15"),
      pedigreeLevel: 3, // 3rd generation pedigree
      ancestry: [], // No ancestry data yet
      health: 92,
      fertility: 95,
      growthRate: 90,
      tags: ["breeding", "female"],
      notes: "Healthy female rabbit"
    });
    
    const rabbit2 = await this.createAnimal({
      animalId: "M1",
      name: "Hopper",
      type: "rabbit",
      breed: "Dutch",
      breedId: 1, // Dutch breed ID
      gender: "male",
      status: "active",
      dateOfBirth: new Date("2024-08-10"),
      pedigreeLevel: 3, // 3rd generation pedigree
      ancestry: [], // No ancestry data yet
      health: 95,
      fertility: 98,
      growthRate: 88,
      tags: ["breeding", "male"],
      notes: "Active breeding male"
    });
    
    const rabbit3 = await this.createAnimal({
      animalId: "F2",
      name: "Cotton",
      type: "rabbit",
      breed: "Angora",
      breedId: 2, // Angora breed ID
      gender: "female",
      status: "active",
      dateOfBirth: new Date("2024-07-20"),
      pedigreeLevel: 4, // 4th generation pedigree
      ancestry: [], // No ancestry data yet
      health: 96,
      fertility: 97,
      growthRate: 85,
      litterSize: 7, // Average litter size
      tags: ["breeding", "female", "purebred"],
      notes: "Purebred Angora, good for breeding"
    });
    
    const goat1 = await this.createAnimal({
      animalId: "G-M1",
      name: "Billy",
      type: "goat",
      breed: "Boer",
      breedId: 101, // Boer goat breed ID
      gender: "male",
      status: "active",
      dateOfBirth: new Date("2023-05-10"),
      health: 92,
      fertility: 95,
      tags: ["breeding", "male"],
      notes: "Healthy breeding male"
    });
    
    const goat2 = await this.createAnimal({
      animalId: "G-F1",
      name: "Nanny",
      type: "goat",
      breed: "Boer",
      breedId: 101, // Boer goat breed ID
      gender: "female",
      status: "active",
      dateOfBirth: new Date("2023-06-15"),
      health: 94,
      fertility: 95,
      tags: ["breeding", "female", "milk"],
      notes: "Good milk producer"
    });
    
    // Create a mixed breed rabbit with parent data
    const rabbitMixed = await this.createAnimal({
      animalId: "M1F2_01",
      name: "Spot",
      type: "rabbit",
      breed: "Dutch/Angora",
      breedId: 1, // Dutch breed ID
      secondaryBreedId: 2, // Angora breed ID
      isMixed: true,
      mixRatio: "50/50",
      gender: "male",
      status: "active",
      dateOfBirth: new Date("2025-01-05"),
      parentMaleId: rabbit2.id, // Hopper is father
      parentFemaleId: rabbit3.id, // Cotton is mother
      generation: 1, // First generation offspring
      ancestry: [`M1-${rabbit2.id}`, `F2-${rabbit3.id}`], // Parent IDs in ancestry
      pedigreeLevel: 3, // Lower than parents
      health: 94, // Good hybrid vigor
      fertility: 90,
      growthRate: 92,
      tags: ["mixed-breed", "offspring"],
      notes: "Mixed breed with good hybrid characteristics"
    });
    
    // Create some breeding events
    await this.createBreedingEvent({
      eventId: "B" + this.currentBreedingEventId,
      maleId: rabbit2.id,
      femaleId: rabbit3.id,
      pairId: `M1-F2`,
      breedingDate: new Date("2025-03-15"),
      status: "pending",
      expectedOffspringCount: 7,
      geneticCompatibilityScore: 85,
      predictedLitterSize: 7,
      predictedOffspringHealth: 95,
      predictedROI: 250, // $250 predicted profit
      expectedWeightGain: 3.5, // kg
      notes: "First breeding attempt"
    });
    
    await this.createBreedingEvent({
      eventId: "B" + this.currentBreedingEventId,
      maleId: goat1.id,
      femaleId: goat2.id,
      pairId: `G-M1-G-F1`,
      breedingDate: new Date("2025-04-01"),
      status: "pending",
      expectedOffspringCount: 2,
      geneticCompatibilityScore: 90,
      predictedOffspringHealth: 93,
      predictedROI: 500, // $500 predicted profit
      notes: "Seasonal breeding"
    });
  }
}

// Database implementation of the Animal Breeding Service
export class DatabaseAnimalBreedingService implements AnimalBreedingService {
  async getAnimals(): Promise<Animal[]> {
    try {
      return await db.select().from(animals);
    } catch (error) {
      console.error('Error in DatabaseAnimalBreedingService.getAnimals:', error);
      return [];
    }
  }
  
  async getAnimalsByType(type: string): Promise<Animal[]> {
    try {
      return await db
        .select()
        .from(animals)
        .where(eq(animals.type, type));
    } catch (error) {
      console.error(`Error in DatabaseAnimalBreedingService.getAnimalsByType(${type}):`, error);
      return [];
    }
  }
  
  async getAnimal(id: number): Promise<Animal | undefined> {
    try {
      const [animal] = await db
        .select()
        .from(animals)
        .where(eq(animals.id, id));
      
      return animal;
    } catch (error) {
      console.error(`Error in DatabaseAnimalBreedingService.getAnimal(${id}):`, error);
      return undefined;
    }
  }
  
  async createAnimal(animal: InsertAnimal): Promise<Animal> {
    try {
      const [createdAnimal] = await db
        .insert(animals)
        .values(animal)
        .returning();
      
      return createdAnimal;
    } catch (error) {
      console.error('Error in DatabaseAnimalBreedingService.createAnimal:', error);
      throw error;
    }
  }
  
  async updateAnimal(id: number, animalUpdate: Partial<InsertAnimal>): Promise<Animal | undefined> {
    try {
      const [updatedAnimal] = await db
        .update(animals)
        .set(animalUpdate)
        .where(eq(animals.id, id))
        .returning();
      
      return updatedAnimal;
    } catch (error) {
      console.error(`Error in DatabaseAnimalBreedingService.updateAnimal(${id}):`, error);
      return undefined;
    }
  }
  
  async deleteAnimal(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(animals)
        .where(eq(animals.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error in DatabaseAnimalBreedingService.deleteAnimal(${id}):`, error);
      return false;
    }
  }
  
  async getPotentialMates(animalId: number): Promise<Animal[]> {
    try {
      const animal = await this.getAnimal(animalId);
      
      if (!animal) {
        return [];
      }
      
      // Get animals of the opposite gender and same type
      const potentialMates = await db
        .select()
        .from(animals)
        .where(
          and(
            eq(animals.type, animal.type),
            eq(animals.gender, animal.gender === 'male' ? 'female' : 'male'),
            eq(animals.status, 'active'),
            not(eq(animals.id, animalId))
          )
        );
      
      return potentialMates;
    } catch (error) {
      console.error(`Error in DatabaseAnimalBreedingService.getPotentialMates(${animalId}):`, error);
      return [];
    }
  }
  
  async checkInbreedingRisk(maleId: number, femaleId: number): Promise<{
    isRisky: boolean;
    relationshipType?: string;
  }> {
    try {
      const male = await this.getAnimal(maleId);
      const female = await this.getAnimal(femaleId);
      
      if (!male || !female) {
        return { isRisky: false };
      }
      
      // Check if they are directly related
      if (male.parentMaleId === female.id || male.parentFemaleId === female.id) {
        return { isRisky: true, relationshipType: 'parent-child' };
      }
      
      if (female.parentMaleId === male.id || female.parentFemaleId === male.id) {
        return { isRisky: true, relationshipType: 'parent-child' };
      }
      
      // Check if they are siblings or half-siblings
      if (male.parentMaleId && female.parentMaleId && male.parentMaleId === female.parentMaleId) {
        if (male.parentFemaleId && female.parentFemaleId && male.parentFemaleId === female.parentFemaleId) {
          return { isRisky: true, relationshipType: 'siblings' };
        } else {
          return { isRisky: true, relationshipType: 'half-siblings' };
        }
      }
      
      if (male.parentFemaleId && female.parentFemaleId && male.parentFemaleId === female.parentFemaleId) {
        return { isRisky: true, relationshipType: 'half-siblings' };
      }
      
      // TODO: Implement more sophisticated checks using the ancestry field
      
      return { isRisky: false };
    } catch (error) {
      console.error(`Error in DatabaseAnimalBreedingService.checkInbreedingRisk(${maleId}, ${femaleId}):`, error);
      return { isRisky: false };
    }
  }
  
  async getBreedingEvents(): Promise<BreedingEvent[]> {
    try {
      return await db.select().from(breedingEvents);
    } catch (error) {
      console.error('Error in DatabaseAnimalBreedingService.getBreedingEvents:', error);
      return [];
    }
  }
  
  async getBreedingEvent(id: number): Promise<BreedingEvent | undefined> {
    try {
      const [event] = await db
        .select()
        .from(breedingEvents)
        .where(eq(breedingEvents.id, id));
      
      return event;
    } catch (error) {
      console.error(`Error in DatabaseAnimalBreedingService.getBreedingEvent(${id}):`, error);
      return undefined;
    }
  }
  
  async createBreedingEvent(event: InsertBreedingEvent): Promise<BreedingEvent> {
    try {
      const [createdEvent] = await db
        .insert(breedingEvents)
        .values(event)
        .returning();
      
      return createdEvent;
    } catch (error) {
      console.error('Error in DatabaseAnimalBreedingService.createBreedingEvent:', error);
      throw error;
    }
  }
  
  async updateBreedingEvent(id: number, eventUpdate: Partial<InsertBreedingEvent>): Promise<BreedingEvent | undefined> {
    try {
      const [updatedEvent] = await db
        .update(breedingEvents)
        .set(eventUpdate)
        .where(eq(breedingEvents.id, id))
        .returning();
      
      return updatedEvent;
    } catch (error) {
      console.error(`Error in DatabaseAnimalBreedingService.updateBreedingEvent(${id}):`, error);
      return undefined;
    }
  }
  
  async deleteBreedingEvent(id: number): Promise<boolean> {
    try {
      await db
        .delete(breedingEvents)
        .where(eq(breedingEvents.id, id));
      
      return true;
    } catch (error) {
      console.error(`Error in DatabaseAnimalBreedingService.deleteBreedingEvent(${id}):`, error);
      return false;
    }
  }
}

// Export instances for different environments
// For database access
export const animalBreedingService = new DatabaseAnimalBreedingService()
// For in-memory access (during development & testing)
export const memAnimalBreedingService = new MemAnimalBreedingService();