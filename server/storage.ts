import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct, 
  transactions, type Transaction, type InsertTransaction,
  newsletters, type Newsletter, type InsertNewsletter,
  bulkOrders, type BulkOrder, type InsertBulkOrder,
  socialShares, type SocialShare, type InsertSocialShare,
  animals, type Animal, type InsertAnimal,
  breedingEvents, type BreedingEvent, type InsertBreedingEvent,
  type TransactionWithProduct,
} from "@shared/schema";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import createMemoryStore from "memorystore";

// Explicitly import and define the memory store constructor
const MemoryStore = createMemoryStore(session);

// For password hashing
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Define the type of session store to be used in IStorage
type SessionStore = session.Store;

// Define the storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  searchProducts(query: string, filters?: any): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  updateProductStock(id: number, quantity: number, isIncrease: boolean): Promise<Product | undefined>;
  
  // Transaction methods
  getTransactions(): Promise<TransactionWithProduct[]>;
  getTransactionsByType(type: string): Promise<TransactionWithProduct[]>;
  getTransactionsByDate(startDate: Date, endDate: Date): Promise<TransactionWithProduct[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<boolean>;
  
  // Newsletter methods
  getNewsletterSubscribers(): Promise<Newsletter[]>;
  getNewsletterSubscriber(email: string): Promise<Newsletter | undefined>;
  createNewsletterSubscriber(subscriber: InsertNewsletter): Promise<Newsletter>;
  updateNewsletterSubscriber(id: number, subscriber: Partial<InsertNewsletter>): Promise<Newsletter | undefined>;
  deleteNewsletterSubscriber(id: number): Promise<boolean>;
  
  // Bulk order methods
  getBulkOrders(): Promise<BulkOrder[]>;
  getBulkOrder(id: number): Promise<BulkOrder | undefined>;
  createBulkOrder(order: InsertBulkOrder): Promise<BulkOrder>;
  updateBulkOrder(id: number, order: Partial<InsertBulkOrder>): Promise<BulkOrder | undefined>;
  deleteBulkOrder(id: number): Promise<boolean>;
  
  // Social share methods
  getSocialShares(productId: number): Promise<SocialShare[]>;
  createSocialShare(share: InsertSocialShare): Promise<SocialShare>;
  updateSocialShare(id: number, share: Partial<InsertSocialShare>): Promise<SocialShare | undefined>;
  
  // Animal breeding methods
  getAnimals(): Promise<Animal[]>;
  getAnimalsByType(type: string): Promise<Animal[]>;
  getAnimal(id: number): Promise<Animal | undefined>;
  createAnimal(animal: InsertAnimal): Promise<Animal>;
  updateAnimal(id: number, animal: Partial<InsertAnimal>): Promise<Animal | undefined>;
  deleteAnimal(id: number): Promise<boolean>;
  getPotentialMates(animalId: number): Promise<Animal[]>;
  checkInbreedingRisk(maleId: number, femaleId: number): Promise<{
    isRisky: boolean;
    relationshipType?: string;
  }>;
  getBreedingEvents(): Promise<BreedingEvent[]>;
  getBreedingEvent(id: number): Promise<BreedingEvent | undefined>;
  createBreedingEvent(event: InsertBreedingEvent): Promise<BreedingEvent>;
  updateBreedingEvent(id: number, event: Partial<InsertBreedingEvent>): Promise<BreedingEvent | undefined>;
  deleteBreedingEvent(id: number): Promise<boolean>;
  
  // Analytics methods
  getProductDistribution(): Promise<{ category: string, count: number }[]>;
  getTransactionSummary(startDate: Date, endDate: Date): Promise<{ 
    totalSales: number, 
    totalPurchases: number, 
    totalOrders: number,
    totalAuctions: number
  }>;
  
  // Session store
  sessionStore: SessionStore;
}

// Implement in-memory storage
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private transactions: Map<number, Transaction>;
  private newsletters: Map<number, Newsletter>;
  private bulkOrders: Map<number, BulkOrder>;
  private socialShares: Map<number, SocialShare>;
  private animals: Map<number, Animal>;
  private breedingEvents: Map<number, BreedingEvent>;
  
  currentUserId: number;
  currentProductId: number;
  currentTransactionId: number;
  currentNewsletterId: number;
  currentBulkOrderId: number;
  currentSocialShareId: number;
  currentAnimalId: number;
  currentBreedingEventId: number;
  
  sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.transactions = new Map();
    this.newsletters = new Map();
    this.bulkOrders = new Map();
    this.socialShares = new Map();
    this.animals = new Map();
    this.breedingEvents = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentTransactionId = 1;
    this.currentNewsletterId = 1;
    this.currentBulkOrderId = 1;
    this.currentSocialShareId = 1;
    this.currentAnimalId = 1;
    this.currentBreedingEventId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    // Initialize the animal breeding service directly
    this.animals = new Map();
    this.breedingEvents = new Map();
    this.currentAnimalId = 1;
    this.currentBreedingEventId = 1;
    
    // Create a direct implementation of the animal breeding service
    this.animalBreedingService = {
      getAnimals: async () => Array.from(this.animals.values()),
      getAnimalsByType: async (type: string) => Array.from(this.animals.values())
        .filter(animal => animal.type.toLowerCase() === type.toLowerCase()),
      getAnimal: async (id: number) => this.animals.get(id),
      createAnimal: async (animal: InsertAnimal) => {
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
      },
      updateAnimal: async (id: number, animalUpdate: Partial<InsertAnimal>) => {
        const existingAnimal = this.animals.get(id);
        if (!existingAnimal) return undefined;
        
        const updatedAnimal: Animal = { 
          ...existingAnimal, 
          ...animalUpdate,
          updatedAt: new Date()
        };
        this.animals.set(id, updatedAnimal);
        return updatedAnimal;
      },
      deleteAnimal: async (id: number) => {
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
      },
      getPotentialMates: async (animalId: number) => {
        const animal = this.animals.get(animalId);
        if (!animal) return [];
        
        // Only work with rabbits for now
        if (animal.type.toLowerCase() !== "rabbit") {
          return [];
        }
        
        // Get animals of the opposite gender and same type
        return Array.from(this.animals.values()).filter(potential => {
          // Must be active and the opposite gender
          if (potential.status !== "active" || potential.gender === animal.gender) {
            return false;
          }
          
          // Must be rabbit (we're only focusing on rabbits for breeding)
          if (potential.type.toLowerCase() !== "rabbit") {
            return false;
          }
          
          // Check for inbreeding risk using the internal function
          const checkInbreedingRiskSync = (maleId: number, femaleId: number): {
            isRisky: boolean;
            relationshipType?: string;
            relationshipDegree?: number;
          } => {
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
                  : "half-siblings",
                relationshipDegree: 1
              };
            }
            
            // Check if one is the parent of the other
            if (male.id === female.fatherId || female.id === male.motherId) {
              return { isRisky: true, relationshipType: "parent-child", relationshipDegree: 1 };
            }
            
            // Check for grandparent relationship (2nd degree)
            // Father's parents
            if (male.fatherId) {
              const maleFather = this.animals.get(male.fatherId);
              if (maleFather) {
                if (maleFather.id === female.id) {
                  return { isRisky: true, relationshipType: "grandmother-grandson", relationshipDegree: 2 };
                }
                if (maleFather.fatherId === female.id || maleFather.motherId === female.id) {
                  return { isRisky: true, relationshipType: "great-grandmother-great-grandson", relationshipDegree: 3 };
                }
              }
            }
            
            // Mother's parents
            if (male.motherId) {
              const maleMother = this.animals.get(male.motherId);
              if (maleMother) {
                if (maleMother.id === female.id) {
                  return { isRisky: true, relationshipType: "grandmother-grandson", relationshipDegree: 2 };
                }
                if (maleMother.fatherId === female.id || maleMother.motherId === female.id) {
                  return { isRisky: true, relationshipType: "great-grandmother-great-grandson", relationshipDegree: 3 };
                }
              }
            }
            
            // Check female's ancestors
            if (female.fatherId) {
              const femaleFather = this.animals.get(female.fatherId);
              if (femaleFather) {
                if (femaleFather.id === male.id) {
                  return { isRisky: true, relationshipType: "grandfather-granddaughter", relationshipDegree: 2 };
                }
                if (femaleFather.fatherId === male.id || femaleFather.motherId === male.id) {
                  return { isRisky: true, relationshipType: "great-grandfather-great-granddaughter", relationshipDegree: 3 };
                }
              }
            }
            
            if (female.motherId) {
              const femaleMother = this.animals.get(female.motherId);
              if (femaleMother) {
                if (femaleMother.id === male.id) {
                  return { isRisky: true, relationshipType: "grandfather-granddaughter", relationshipDegree: 2 };
                }
                if (femaleMother.fatherId === male.id || femaleMother.motherId === male.id) {
                  return { isRisky: true, relationshipType: "great-grandfather-great-granddaughter", relationshipDegree: 3 };
                }
              }
            }
            
            // Check for uncle/aunt relationships (cousins)
            if (male.fatherId && female.fatherId && male.fatherId !== female.fatherId) {
              const maleFather = this.animals.get(male.fatherId);
              const femaleFather = this.animals.get(female.fatherId);
              
              if (maleFather && femaleFather && 
                 ((maleFather.fatherId && maleFather.fatherId === femaleFather.fatherId) ||
                  (maleFather.motherId && maleFather.motherId === femaleFather.motherId))) {
                return { isRisky: true, relationshipType: "cousins", relationshipDegree: 2 };
              }
            }
            
            if (male.motherId && female.motherId && male.motherId !== female.motherId) {
              const maleMother = this.animals.get(male.motherId);
              const femaleMother = this.animals.get(female.motherId);
              
              if (maleMother && femaleMother && 
                 ((maleMother.fatherId && maleMother.fatherId === femaleMother.fatherId) ||
                  (maleMother.motherId && maleMother.motherId === femaleMother.motherId))) {
                return { isRisky: true, relationshipType: "cousins", relationshipDegree: 2 };
              }
            }
            
            return { isRisky: false };
          };
          
          const { isRisky } = checkInbreedingRiskSync(
            animal.gender === "male" ? animal.id : potential.id,
            animal.gender === "female" ? animal.id : potential.id
          );
          
          // Only include animals without inbreeding risk
          return !isRisky;
        });
      },
      checkInbreedingRisk: async (maleId: number, femaleId: number) => {
        const male = this.animals.get(maleId);
        const female = this.animals.get(femaleId);
        
        if (!male || !female) {
          return { isRisky: false };
        }
        
        // Only work with rabbits for now
        if (male.type.toLowerCase() !== "rabbit" || female.type.toLowerCase() !== "rabbit") {
          return { isRisky: false, message: "Inbreeding check is only available for rabbits" };
        }

        // Check if they're siblings or half-siblings
        if ((male.fatherId && male.fatherId === female.fatherId) ||
            (male.motherId && male.motherId === female.motherId)) {
          return { 
            isRisky: true, 
            relationshipType: (male.fatherId === female.fatherId && male.motherId === female.motherId) 
              ? "siblings" 
              : "half-siblings",
            relationshipDegree: 1,
            message: "These rabbits share one or both parents - breeding will result in genetic abnormalities"
          };
        }
        
        // Check if one is the parent of the other
        if (male.id === female.fatherId || female.id === male.motherId) {
          return { 
            isRisky: true, 
            relationshipType: "parent-child", 
            relationshipDegree: 1,
            message: "This is a direct parent-child relationship - breeding will result in genetic abnormalities" 
          };
        }
        
        // Check for grandparent relationship (2nd degree)
        // Father's parents
        if (male.fatherId) {
          const maleFather = this.animals.get(male.fatherId);
          if (maleFather) {
            if (maleFather.id === female.id) {
              return { 
                isRisky: true, 
                relationshipType: "grandmother-grandson", 
                relationshipDegree: 2,
                message: "Grandmother-grandson relationship detected - breeding is not recommended" 
              };
            }
            if (maleFather.fatherId === female.id || maleFather.motherId === female.id) {
              return { 
                isRisky: true, 
                relationshipType: "great-grandmother-great-grandson", 
                relationshipDegree: 3,
                message: "Great-grandmother relationship detected - breeding may result in reduced vigor" 
              };
            }
          }
        }
        
        // Mother's parents
        if (male.motherId) {
          const maleMother = this.animals.get(male.motherId);
          if (maleMother) {
            if (maleMother.id === female.id) {
              return { 
                isRisky: true, 
                relationshipType: "grandmother-grandson", 
                relationshipDegree: 2,
                message: "Grandmother-grandson relationship detected - breeding is not recommended" 
              };
            }
            if (maleMother.fatherId === female.id || maleMother.motherId === female.id) {
              return { 
                isRisky: true, 
                relationshipType: "great-grandmother-great-grandson", 
                relationshipDegree: 3,
                message: "Great-grandmother relationship detected - breeding may result in reduced vigor" 
              };
            }
          }
        }
        
        // Check female's ancestors
        if (female.fatherId) {
          const femaleFather = this.animals.get(female.fatherId);
          if (femaleFather) {
            if (femaleFather.id === male.id) {
              return { 
                isRisky: true, 
                relationshipType: "grandfather-granddaughter", 
                relationshipDegree: 2,
                message: "Grandfather-granddaughter relationship detected - breeding is not recommended" 
              };
            }
            if (femaleFather.fatherId === male.id || femaleFather.motherId === male.id) {
              return { 
                isRisky: true, 
                relationshipType: "great-grandfather-great-granddaughter", 
                relationshipDegree: 3,
                message: "Great-grandfather relationship detected - breeding may result in reduced vigor" 
              };
            }
          }
        }
        
        if (female.motherId) {
          const femaleMother = this.animals.get(female.motherId);
          if (femaleMother) {
            if (femaleMother.id === male.id) {
              return { 
                isRisky: true, 
                relationshipType: "grandfather-granddaughter", 
                relationshipDegree: 2,
                message: "Grandfather-granddaughter relationship detected - breeding is not recommended" 
              };
            }
            if (femaleMother.fatherId === male.id || femaleMother.motherId === male.id) {
              return { 
                isRisky: true, 
                relationshipType: "great-grandfather-great-granddaughter", 
                relationshipDegree: 3,
                message: "Great-grandfather relationship detected - breeding may result in reduced vigor" 
              };
            }
          }
        }
        
        // Check for uncle/aunt relationships (cousins)
        if (male.fatherId && female.fatherId && male.fatherId !== female.fatherId) {
          const maleFather = this.animals.get(male.fatherId);
          const femaleFather = this.animals.get(female.fatherId);
          
          if (maleFather && femaleFather && 
             ((maleFather.fatherId && maleFather.fatherId === femaleFather.fatherId) ||
              (maleFather.motherId && maleFather.motherId === femaleFather.motherId))) {
            return { 
              isRisky: true, 
              relationshipType: "cousins", 
              relationshipDegree: 2,
              message: "These rabbits are cousins - breeding may result in reduced genetic diversity" 
            };
          }
        }
        
        if (male.motherId && female.motherId && male.motherId !== female.motherId) {
          const maleMother = this.animals.get(male.motherId);
          const femaleMother = this.animals.get(female.motherId);
          
          if (maleMother && femaleMother && 
             ((maleMother.fatherId && maleMother.fatherId === femaleMother.fatherId) ||
              (maleMother.motherId && maleMother.motherId === femaleMother.motherId))) {
            return { 
              isRisky: true, 
              relationshipType: "cousins", 
              relationshipDegree: 2,
              message: "These rabbits are cousins - breeding may result in reduced genetic diversity" 
            };
          }
        }
        
        return { 
          isRisky: false,
          message: "No close family relationship detected - breeding is safe from an inbreeding perspective" 
        };
      },
      getBreedingEvents: async () => Array.from(this.breedingEvents.values()),
      getBreedingEvent: async (id: number) => this.breedingEvents.get(id),
      createBreedingEvent: async (event: InsertBreedingEvent & { breedingDate: Date }) => {
        const id = this.currentBreedingEventId++;
        
        // Calculate expected birth date based on animal type
        let expectedBirthDate = event.expectedBirthDate;
        if (!expectedBirthDate && event.breedingDate) {
          const male = this.animals.get(event.maleId);
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
          breedingDate: event.breedingDate,
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
      },
      updateBreedingEvent: async (id: number, eventUpdate: Partial<InsertBreedingEvent>) => {
        const existingEvent = this.breedingEvents.get(id);
        if (!existingEvent) return undefined;
        
        // If we're recording birth (setting actualBirthDate), and we have offspring count
        // we could automatically create new animal records here
        if (eventUpdate.actualBirthDate && 
            eventUpdate.offspringCount && 
            eventUpdate.offspringCount > 0 && 
            !existingEvent.actualBirthDate) {
          
          // Get parent animals for reference
          const male = this.animals.get(existingEvent.maleId);
          const female = this.animals.get(existingEvent.femaleId);
          
          if (male && female) {
            // Create offspring based on count
            for (let i = 0; i < eventUpdate.offspringCount; i++) {
              this.animalBreedingService.createAnimal({
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
      },
      deleteBreedingEvent: async (id: number) => {
        const event = this.breedingEvents.get(id);
        // If the event already resulted in births, don't allow deletion
        if (event && event.actualBirthDate && event.offspringCount && event.offspringCount > 0) {
          return false;
        }
        return this.breedingEvents.delete(id);
      }
    };
    
    // Initialize with sample breeding data - create a full rabbit family tree
    const initBreedingSampleData = async () => {
      // Create first generation - original breeding pair
      const grandfather = await this.animalBreedingService.createAnimal({
        name: "Max",
        type: "rabbit",
        breed: "New Zealand White",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2023-01-05"),
        notes: "Original patriarch of the rabbit family"
      });
      
      const grandmother = await this.animalBreedingService.createAnimal({
        name: "Ruby",
        type: "rabbit",
        breed: "Rex",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2023-02-10"),
        notes: "Original matriarch of the rabbit family"
      });
      
      // Second generation - first breeding result
      const father1 = await this.animalBreedingService.createAnimal({
        name: "Jack",
        type: "rabbit",
        breed: "New Zealand/Rex Mix",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2023-06-15"),
        fatherId: grandfather.id,
        motherId: grandmother.id,
        notes: "First generation offspring, now a breeding male"
      });
      
      const mother1 = await this.animalBreedingService.createAnimal({
        name: "Daisy",
        type: "rabbit",
        breed: "New Zealand/Rex Mix",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2023-06-15"),
        fatherId: grandfather.id,
        motherId: grandmother.id,
        notes: "First generation offspring, now a breeding female"
      });
      
      // Unrelated rabbits to allow non-incestuous breeding
      const unrelatedMale = await this.animalBreedingService.createAnimal({
        name: "Thunder",
        type: "rabbit",
        breed: "Californian",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2023-07-10"),
        notes: "Unrelated male for outcrossing"
      });
      
      const unrelatedFemale = await this.animalBreedingService.createAnimal({
        name: "Snowflake",
        type: "rabbit",
        breed: "Himalayan",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2023-08-05"),
        notes: "Unrelated female for outcrossing"
      });
      
      // Breeding with unrelated animals
      const father2 = await this.animalBreedingService.createAnimal({
        name: "Oreo",
        type: "rabbit",
        breed: "Californian/Rex Mix",
        gender: "male",
        status: "active", 
        dateOfBirth: new Date("2024-01-10"),
        fatherId: unrelatedMale.id,
        motherId: mother1.id,
        notes: "Second generation offspring through outcrossing"
      });
      
      const mother2 = await this.animalBreedingService.createAnimal({
        name: "Coco",
        type: "rabbit",
        breed: "New Zealand/Himalayan Mix",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2024-02-15"),
        fatherId: father1.id,
        motherId: unrelatedFemale.id,
        notes: "Second generation offspring through outcrossing"
      });
      
      // Create third generation
      const youngMale = await this.animalBreedingService.createAnimal({
        name: "Peanut",
        type: "rabbit",
        breed: "Mixed",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2024-09-01"),
        fatherId: father2.id,
        motherId: mother2.id,
        notes: "Third generation offspring"
      });
      
      const youngFemale = await this.animalBreedingService.createAnimal({
        name: "Luna",
        type: "rabbit",
        breed: "Mixed",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2024-09-01"),
        fatherId: father2.id,
        motherId: mother2.id,
        notes: "Third generation offspring"
      });
      
      // Current breeding pair - should be safe from inbreeding
      const currentMale = await this.animalBreedingService.createAnimal({
        name: "Apollo",
        type: "rabbit",
        breed: "Californian/Rex Mix",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2024-08-10"),
        fatherId: unrelatedMale.id,
        motherId: unrelatedFemale.id,
        notes: "Current breeding male - unrelated to other family lines"
      });
      
      const currentFemale = await this.animalBreedingService.createAnimal({
        name: "Willow",
        type: "rabbit",
        breed: "New Zealand/Himalayan Mix",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2024-07-20"),
        fatherId: father1.id,
        motherId: unrelatedFemale.id,
        notes: "Current breeding female"
      });
      
      // Add some non-rabbit animals
      const goat1 = await this.animalBreedingService.createAnimal({
        name: "Billy",
        type: "goat",
        breed: "Boer",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2023-05-10"),
        notes: "Healthy breeding male goat"
      });
      
      const goat2 = await this.animalBreedingService.createAnimal({
        name: "Nanny",
        type: "goat",
        breed: "Boer",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2023-06-15"),
        notes: "Good milk producer goat"
      });
      
      // Create some breeding events - historical
      const pastBreeding1 = await this.animalBreedingService.createBreedingEvent({
        maleId: grandfather.id,
        femaleId: grandmother.id,
        breedingDate: new Date("2023-05-15"),
        status: "completed",
        actualBirthDate: new Date("2023-06-15"),
        offspringCount: 6,
        notes: "First generation breeding - produced 6 healthy kits"
      });
      
      const pastBreeding2 = await this.animalBreedingService.createBreedingEvent({
        maleId: unrelatedMale.id,
        femaleId: mother1.id,
        breedingDate: new Date("2023-12-10"),
        status: "completed",
        actualBirthDate: new Date("2024-01-10"),
        offspringCount: 5,
        notes: "Second generation outcross breeding"
      });
      
      const pastBreeding3 = await this.animalBreedingService.createBreedingEvent({
        maleId: father1.id,
        femaleId: unrelatedFemale.id,
        breedingDate: new Date("2024-01-15"),
        status: "completed",
        actualBirthDate: new Date("2024-02-15"),
        offspringCount: 7,
        notes: "Second generation outcross breeding"
      });
      
      // Create current breeding event - pending
      const currentBreeding = await this.animalBreedingService.createBreedingEvent({
        maleId: currentMale.id,
        femaleId: currentFemale.id,
        breedingDate: new Date("2025-03-15"),
        status: "pending",
        notes: "Current breeding attempt - healthy unrelated pair"
      });
      
      // Add non-rabbit breeding
      await this.animalBreedingService.createBreedingEvent({
        maleId: goat1.id,
        femaleId: goat2.id,
        breedingDate: new Date("2025-04-01"),
        status: "pending",
        notes: "Seasonal goat breeding"
      });
    };
    
    initBreedingSampleData();
    
    // Add sample data for testing
    this.initSampleData();
    
    console.log("Storage initialized with test admin user (admin/admin123)");
  }
  
  // Animal breeding service initialized in the constructor
  private animalBreedingService: any;
  
  // Animal breeding methods - delegate to specialized service
  async getAnimals(): Promise<Animal[]> {
    return this.animalBreedingService.getAnimals();
  }
  
  async getAnimalsByType(type: string): Promise<Animal[]> {
    return this.animalBreedingService.getAnimalsByType(type);
  }
  
  async getAnimal(id: number): Promise<Animal | undefined> {
    return this.animalBreedingService.getAnimal(id);
  }
  
  async createAnimal(animal: InsertAnimal): Promise<Animal> {
    return this.animalBreedingService.createAnimal(animal);
  }
  
  async updateAnimal(id: number, animalUpdate: Partial<InsertAnimal>): Promise<Animal | undefined> {
    return this.animalBreedingService.updateAnimal(id, animalUpdate);
  }
  
  async deleteAnimal(id: number): Promise<boolean> {
    return this.animalBreedingService.deleteAnimal(id);
  }
  
  async getPotentialMates(animalId: number): Promise<Animal[]> {
    return this.animalBreedingService.getPotentialMates(animalId);
  }
  
  async checkInbreedingRisk(maleId: number, femaleId: number): Promise<{
    isRisky: boolean;
    relationshipType?: string;
  }> {
    return this.animalBreedingService.checkInbreedingRisk(maleId, femaleId);
  }
  
  async getBreedingEvents(): Promise<BreedingEvent[]> {
    return this.animalBreedingService.getBreedingEvents();
  }
  
  async getBreedingEvent(id: number): Promise<BreedingEvent | undefined> {
    return this.animalBreedingService.getBreedingEvent(id);
  }
  
  async createBreedingEvent(event: InsertBreedingEvent): Promise<BreedingEvent> {
    return this.animalBreedingService.createBreedingEvent(event);
  }
  
  async updateBreedingEvent(id: number, eventUpdate: Partial<InsertBreedingEvent>): Promise<BreedingEvent | undefined> {
    return this.animalBreedingService.updateBreedingEvent(id, eventUpdate);
  }
  
  async deleteBreedingEvent(id: number): Promise<boolean> {
    return this.animalBreedingService.deleteBreedingEvent(id);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || null,
      avatar: insertUser.avatar || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userUpdate };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.category === category);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values())
      .filter(product => product.featured);
  }

  async searchProducts(query: string, filters?: any): Promise<Product[]> {
    // If query is empty, return all products (filtered by other criteria if provided)
    let results: Product[];
    
    if (!query.trim()) {
      results = Array.from(this.products.values());
    } else {
      const searchTerm = query.toLowerCase();
      results = Array.from(this.products.values()).filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        (product.description && product.description.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply filters if provided
    if (filters) {
      // Handle single category or multiple categories (comma-separated)
      if (filters.category) {
        const categories = filters.category.split(',').map((c: string) => c.trim());
        results = results.filter(p => categories.includes(p.category || 'general'));
      }
      
      // Apply price range filters
      if (filters.minPrice !== undefined) {
        results = results.filter(p => p.price >= filters.minPrice);
      }
      
      if (filters.maxPrice !== undefined) {
        results = results.filter(p => p.price <= filters.maxPrice);
      }
      
      // Apply stock filter
      if (filters.inStock !== undefined) {
        results = filters.inStock 
          ? results.filter(p => p.stockQuantity > 0)
          : results.filter(p => p.stockQuantity === 0);
      }
      
      // Apply sorting
      if (filters.sortBy) {
        switch (filters.sortBy) {
          case 'price-asc':
            results.sort((a, b) => a.price - b.price);
            break;
          case 'price-desc':
            results.sort((a, b) => b.price - a.price);
            break;
          case 'name-asc':
            results.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'name-desc':
            results.sort((a, b) => b.name.localeCompare(a.name));
            break;
          case 'newest':
            results.sort((a, b) => {
              const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return bDate - aDate;
            });
            break;
          case 'featured':
            results.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
            break;
          default:
            // Default sorting (featured first, then by id)
            results.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || a.id - b.id);
        }
      }
    }
    
    return results;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    
    // Set initial stock quantity and calculate stock status
    const stockQuantity = insertProduct.stockQuantity || insertProduct.stock;
    const lowStockThreshold = insertProduct.lowStockThreshold || 10;
    
    let stockStatus = 'normal';
    if (stockQuantity <= 0) {
      stockStatus = 'out_of_stock';
    } else if (stockQuantity <= lowStockThreshold) {
      stockStatus = 'low';
    }
    
    const product: Product = { 
      ...insertProduct, 
      id,
      description: insertProduct.description || null,
      salePrice: insertProduct.salePrice || null,
      stockQuantity: stockQuantity,
      lowStockThreshold: lowStockThreshold,
      stockStatus: stockStatus,
      lastRestockDate: insertProduct.lastRestockDate || new Date(),
      nextRestockDate: insertProduct.nextRestockDate || null,
      imageUrl: insertProduct.imageUrl || null,
      category: insertProduct.category || null,
      featured: insertProduct.featured || false,
      isFeatured: insertProduct.isFeatured || false,
      isNew: insertProduct.isNew || false,
      supplierName: insertProduct.supplierName || null,
      location: insertProduct.location || null,
      createdAt: insertProduct.createdAt || new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct = { ...existingProduct, ...productUpdate };
    
    // Check if we need to update stock status
    if (productUpdate.stockQuantity !== undefined || productUpdate.lowStockThreshold !== undefined) {
      const stockQuantity = updatedProduct.stockQuantity || updatedProduct.stock;
      const threshold = updatedProduct.lowStockThreshold || 10;
      
      if (stockQuantity <= 0) {
        updatedProduct.stockStatus = 'out_of_stock';
      } else if (stockQuantity <= threshold) {
        updatedProduct.stockStatus = 'low';
      } else {
        updatedProduct.stockStatus = 'normal';
      }
    }
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  async getLowStockProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => {
      // Include product if it has a threshold set and current stock is at or below threshold
      // OR if stock is completely depleted (stock is 0)
      return (
        product.stock === 0 || 
        (product.lowStockThreshold !== null && 
         product.lowStockThreshold !== undefined && 
         product.lowStockThreshold > 0 && 
         product.stock <= product.lowStockThreshold)
      );
    }).sort((a, b) => {
      // Sort by criticality:
      // 1. Products with 0 stock first
      if (a.stock === 0 && b.stock !== 0) return -1;
      if (a.stock !== 0 && b.stock === 0) return 1;
      
      // 2. Then by how far below threshold (as a percentage)
      const aThreshold = (a.lowStockThreshold !== null && a.lowStockThreshold !== undefined) ? a.lowStockThreshold : 1;
      const bThreshold = (b.lowStockThreshold !== null && b.lowStockThreshold !== undefined) ? b.lowStockThreshold : 1;
      
      const aPercentage = a.stock / aThreshold;
      const bPercentage = b.stock / bThreshold;
      
      return aPercentage - bPercentage;
    });
  }
  
  async updateProductStock(id: number, quantity: number, isIncrease: boolean): Promise<Product | undefined> {
    const product = await this.getProduct(id);
    if (!product) return undefined;
    
    const newQuantity = isIncrease 
      ? (product.stockQuantity || product.stock) + quantity 
      : Math.max(0, (product.stockQuantity || product.stock) - quantity);
    
    const threshold = (product.lowStockThreshold !== null && product.lowStockThreshold !== undefined) 
      ? product.lowStockThreshold 
      : 10;
      
    const stockStatus = newQuantity <= 0 
      ? 'out_of_stock' 
      : newQuantity <= threshold
        ? 'low' 
        : 'normal';
    
    // If we're adding inventory, update the last restock date
    const updates: Partial<InsertProduct> = {
      stock: newQuantity,
      stockQuantity: newQuantity,
      stockStatus
    };
    
    if (isIncrease && quantity > 0) {
      updates.lastRestockDate = new Date();
    }
    
    return this.updateProduct(id, updates);
  }

  // Transaction methods
  async getTransactions(): Promise<TransactionWithProduct[]> {
    return Array.from(this.transactions.values()).map(transaction => {
      const product = this.products.get(transaction.productId);
      return {
        ...transaction,
        product: {
          name: product?.name || "Unknown Product",
          unit: product?.unit || ""
        }
      };
    });
  }
  
  async getTransactionsByType(type: string): Promise<TransactionWithProduct[]> {
    return (await this.getTransactions()).filter(transaction => transaction.type === type);
  }
  
  async getTransactionsByDate(startDate: Date, endDate: Date): Promise<TransactionWithProduct[]> {
    return (await this.getTransactions()).filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    
    // Ensure date is always a Date object
    let transactionDate: Date;
    if (insertTransaction.date instanceof Date) {
      transactionDate = insertTransaction.date;
    } else if (typeof insertTransaction.date === 'string') {
      transactionDate = new Date(insertTransaction.date);
    } else {
      transactionDate = new Date();
    }
    
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      date: transactionDate,
      customer: insertTransaction.customer || null,
      notes: insertTransaction.notes || null,
      status: insertTransaction.status || "completed"
    };
    this.transactions.set(id, transaction);
    
    // Update product stock based on transaction type
    const product = await this.getProduct(transaction.productId);
    if (product) {
      if (transaction.type === "sale" || transaction.type === "order") {
        // Decrease stock
        await this.updateProductStock(
          product.id, 
          transaction.quantity, 
          false // decrease
        );
      } else if (transaction.type === "purchase") {
        // Increase stock and update restock date
        await this.updateProductStock(
          product.id, 
          transaction.quantity, 
          true // increase
        );
      }
    }
    
    return transaction;
  }

  async updateTransaction(id: number, transactionUpdate: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const existingTransaction = this.transactions.get(id);
    if (!existingTransaction) return undefined;
    
    // If updating product or quantity, handle stock updates
    if (transactionUpdate.productId !== undefined || 
        transactionUpdate.quantity !== undefined || 
        transactionUpdate.type !== undefined) {
      
      // Revert old transaction's effect on stock
      const oldProduct = await this.getProduct(existingTransaction.productId);
      if (oldProduct) {
        if (existingTransaction.type === "sale" || existingTransaction.type === "order") {
          // Add stock back for sales/orders
          await this.updateProductStock(
            oldProduct.id,
            existingTransaction.quantity,
            true // increase
          );
        } else if (existingTransaction.type === "purchase") {
          // Remove stock for purchases
          await this.updateProductStock(
            oldProduct.id,
            existingTransaction.quantity,
            false // decrease
          );
        }
      }
      
      // Apply new transaction's effect on stock
      const productId = transactionUpdate.productId || existingTransaction.productId;
      const quantity = transactionUpdate.quantity || existingTransaction.quantity;
      const type = transactionUpdate.type || existingTransaction.type;
      
      const newProduct = await this.getProduct(productId);
      if (newProduct) {
        if (type === "sale" || type === "order") {
          // Decrease stock for sales/orders
          await this.updateProductStock(
            newProduct.id,
            quantity,
            false // decrease
          );
        } else if (type === "purchase") {
          // Increase stock for purchases
          await this.updateProductStock(
            newProduct.id,
            quantity,
            true // increase
          );
        }
      }
    }
    
    const updatedTransaction = { ...existingTransaction, ...transactionUpdate };
    this.transactions.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const transaction = this.transactions.get(id);
    if (!transaction) return false;
    
    // Revert transaction's effect on stock
    const product = await this.getProduct(transaction.productId);
    if (product) {
      if (transaction.type === "sale" || transaction.type === "order") {
        // Add stock back for sales/orders
        await this.updateProductStock(
          product.id,
          transaction.quantity,
          true // increase
        );
      } else if (transaction.type === "purchase") {
        // Remove stock for purchases
        await this.updateProductStock(
          product.id,
          transaction.quantity,
          false // decrease
        );
      }
    }
    
    return this.transactions.delete(id);
  }

  // Newsletter methods
  async getNewsletterSubscribers(): Promise<Newsletter[]> {
    return Array.from(this.newsletters.values());
  }
  
  async getNewsletterSubscriber(email: string): Promise<Newsletter | undefined> {
    return Array.from(this.newsletters.values()).find(
      subscriber => subscriber.email === email
    );
  }
  
  async createNewsletterSubscriber(subscriber: InsertNewsletter): Promise<Newsletter> {
    const id = this.currentNewsletterId++;
    
    const newSubscriber: Newsletter = {
      ...subscriber,
      id,
      name: subscriber.name || null,
      subscribed: subscriber.subscribed || true,
      verified: subscriber.verified || false,
      createdAt: new Date()
    };
    
    this.newsletters.set(id, newSubscriber);
    return newSubscriber;
  }
  
  async updateNewsletterSubscriber(id: number, subscriber: Partial<InsertNewsletter>): Promise<Newsletter | undefined> {
    const existing = this.newsletters.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...subscriber };
    this.newsletters.set(id, updated);
    return updated;
  }
  
  async deleteNewsletterSubscriber(id: number): Promise<boolean> {
    return this.newsletters.delete(id);
  }
  
  // Bulk order methods
  async getBulkOrders(): Promise<BulkOrder[]> {
    return Array.from(this.bulkOrders.values());
  }
  
  async getBulkOrder(id: number): Promise<BulkOrder | undefined> {
    return this.bulkOrders.get(id);
  }
  
  async createBulkOrder(order: InsertBulkOrder): Promise<BulkOrder> {
    const id = this.currentBulkOrderId++;
    
    const newOrder: BulkOrder = {
      ...order,
      id,
      createdAt: new Date(),
      status: order.status || "pending",
      productId: order.productId || null,
      quantity: order.quantity || null,
      phone: order.phone || null
    };
    
    this.bulkOrders.set(id, newOrder);
    return newOrder;
  }
  
  async updateBulkOrder(id: number, order: Partial<InsertBulkOrder>): Promise<BulkOrder | undefined> {
    const existing = this.bulkOrders.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...order };
    this.bulkOrders.set(id, updated);
    return updated;
  }
  
  async deleteBulkOrder(id: number): Promise<boolean> {
    return this.bulkOrders.delete(id);
  }
  
  // Social share methods
  async getSocialShares(productId: number): Promise<SocialShare[]> {
    return Array.from(this.socialShares.values())
      .filter(share => share.productId === productId);
  }
  
  async createSocialShare(share: InsertSocialShare): Promise<SocialShare> {
    const id = this.currentSocialShareId++;
    
    const newShare: SocialShare = {
      ...share,
      id,
      productId: share.productId || null,
      shareCount: share.shareCount || 0,
      lastShared: new Date()
    };
    
    this.socialShares.set(id, newShare);
    return newShare;
  }
  
  async updateSocialShare(id: number, share: Partial<InsertSocialShare>): Promise<SocialShare | undefined> {
    const existing = this.socialShares.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...share };
    this.socialShares.set(id, updated);
    return updated;
  }
  
  // Analytics methods
  async getProductDistribution(): Promise<{ category: string, count: number }[]> {
    const categoryMap = new Map<string, number>();
    
    // Count products by category
    for (const product of this.products.values()) {
      const category = product.category || 'Uncategorized';
      const count = categoryMap.get(category) || 0;
      categoryMap.set(category, count + 1);
    }
    
    // Convert to array of objects
    return Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      count
    }));
  }
  
  async getTransactionSummary(startDate: Date, endDate: Date): Promise<{ 
    totalSales: number, 
    totalPurchases: number, 
    totalOrders: number,
    totalAuctions: number
  }> {
    const transactions = await this.getTransactionsByDate(startDate, endDate);
    
    // Initialize summary object
    const summary = {
      totalSales: 0,
      totalPurchases: 0,
      totalOrders: 0,
      totalAuctions: 0
    };
    
    // Sum up transactions by type
    for (const transaction of transactions) {
      if (transaction.type === 'sale') {
        summary.totalSales += transaction.price * transaction.quantity;
      } else if (transaction.type === 'purchase') {
        summary.totalPurchases += transaction.price * transaction.quantity;
      } else if (transaction.type === 'order') {
        summary.totalOrders += transaction.price * transaction.quantity;
      } else if (transaction.type === 'auction') {
        summary.totalAuctions += transaction.price * transaction.quantity;
      }
    }
    
    return summary;
  }

  // Initialize with sample data
  private async initSampleData() {
    // Create a test admin user
    const admin = await this.createUser({
      username: "admin",
      password: await hashPassword("admin123"),
      name: "Administrator",
      role: "admin"
    });
    
    // Create some sample products
    const chicken = await this.createProduct({
      name: "Live Chicken",
      description: "Healthy free-range chicken",
      price: 15.99,
      unit: "each",
      stock: 50,
      stockQuantity: 50,
      lowStockThreshold: 10,
      stockStatus: "normal",
      category: "chicken",
      imageUrl: "/chicken.jpg",
      featured: true
    });
    
    const goat = await this.createProduct({
      name: "Goat",
      description: "Healthy adult goat ready for breeding",
      price: 250.00,
      unit: "each",
      stock: 12,
      stockQuantity: 12,
      lowStockThreshold: 3,
      stockStatus: "normal",
      category: "goat",
      imageUrl: "/goat.jpg",
      featured: true
    });
    
    const rabbit = await this.createProduct({
      name: "Rabbit",
      description: "Young healthy rabbit",
      price: 35.99,
      unit: "each",
      stock: 25,
      stockQuantity: 25,
      lowStockThreshold: 5,
      stockStatus: "normal",
      category: "rabbit",
      imageUrl: "/rabbit.jpg",
      featured: false
    });
    
    const duck = await this.createProduct({
      name: "Duck",
      description: "Domestic duck for meat or egg production",
      price: 18.50,
      unit: "each",
      stock: 30,
      stockQuantity: 30,
      lowStockThreshold: 8,
      stockStatus: "normal",
      category: "duck",
      imageUrl: "/duck.jpg",
      featured: false
    });
    
    const fish = await this.createProduct({
      name: "Tilapia Fish",
      description: "Live tilapia for farming",
      price: 5.99,
      unit: "each",
      stock: 200,
      stockQuantity: 200,
      lowStockThreshold: 30,
      stockStatus: "normal",
      category: "fish",
      imageUrl: "/fish.jpg",
      featured: true
    });
    
    const eggs = await this.createProduct({
      name: "Fresh Eggs",
      description: "Farm fresh chicken eggs",
      price: 3.99,
      unit: "dozen",
      stock: 85,
      stockQuantity: 85,
      lowStockThreshold: 20,
      stockStatus: "normal",
      category: "chicken",
      imageUrl: "/eggs.jpg",
      featured: true
    });
    
    const goatMilk = await this.createProduct({
      name: "Goat Milk",
      description: "Fresh, unprocessed goat milk",
      price: 6.50,
      unit: "liter",
      stock: 45,
      stockQuantity: 45,
      lowStockThreshold: 15,
      stockStatus: "normal",
      category: "goat",
      imageUrl: "/goat-milk.jpg",
      featured: false
    });
    
    const chickenFeed = await this.createProduct({
      name: "Chicken Feed",
      description: "Premium chicken feed mix",
      price: 20.99,
      unit: "25kg bag",
      stock: 18,
      stockQuantity: 18,
      lowStockThreshold: 5,
      stockStatus: "normal",
      category: "supplies",
      imageUrl: "/chicken-feed.jpg",
      featured: false
    });
    
    // Create some sample transactions
    await this.createTransaction({
      productId: chicken.id,
      type: "sale",
      quantity: 5,
      price: chicken.price,
      date: new Date("2025-03-15"),
      customer: "John Doe",
      notes: "Local pickup"
    });
    
    await this.createTransaction({
      productId: goat.id,
      type: "sale",
      quantity: 2,
      price: goat.price,
      date: new Date("2025-03-18"),
      customer: "Farm Supply Co.",
      notes: "Regular buyer"
    });
    
    await this.createTransaction({
      productId: eggs.id,
      type: "sale",
      quantity: 30,
      price: eggs.price,
      date: new Date("2025-03-20"),
      customer: "Local Market",
      notes: "Weekly delivery"
    });
    
    await this.createTransaction({
      productId: chickenFeed.id,
      type: "purchase",
      quantity: 10,
      price: 18.50,
      date: new Date("2025-03-10"),
      customer: "Feed Supplier Inc.",
      notes: "Monthly supply order"
    });
    
    await this.createTransaction({
      productId: chicken.id,
      type: "order",
      quantity: 15,
      price: chicken.price,
      date: new Date("2025-03-25"),
      customer: "Restaurant Group",
      notes: "Delivery scheduled for April 1st"
    });
    
    await this.createTransaction({
      productId: fish.id,
      type: "sale",
      quantity: 50,
      price: fish.price,
      date: new Date("2025-03-22"),
      customer: "Fish Farm Co.",
      notes: "Bulk purchase for stocking pond"
    });
    
    // Add some newsletter subscribers
    await this.createNewsletterSubscriber({
      email: "johndoe@example.com",
      name: "John Doe",
      subscribed: true,
      verified: true
    });
    
    await this.createNewsletterSubscriber({
      email: "farmersupply@example.com",
      name: "Farmer Supply Co.",
      subscribed: true,
      verified: true
    });
    
    await this.createNewsletterSubscriber({
      email: "restaurant@example.com",
      name: "Local Restaurant",
      subscribed: true,
      verified: false
    });
    
    // Add some bulk orders
    await this.createBulkOrder({
      name: "Restaurant Chain Ltd.",
      email: "orders@restaurant.com",
      phone: "+1-555-123-4567",
      message: "Looking for regular supply of chickens for our restaurants.",
      productId: chicken.id,
      quantity: 20,
      status: "pending"
    });
    
    await this.createBulkOrder({
      name: "School District",
      email: "nutrition@schooldistrict.org",
      phone: "+1-555-987-6543",
      message: "Interested in establishing a monthly delivery of fresh eggs for our school breakfast program.",
      productId: eggs.id,
      quantity: 50,
      status: "pending"
    });
  }
}

export const storage = new MemStorage();