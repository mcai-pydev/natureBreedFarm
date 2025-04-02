import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct, 
  transactions, type Transaction, type InsertTransaction,
  newsletters, type Newsletter, type InsertNewsletter,
  bulkOrders, type BulkOrder, type InsertBulkOrder,
  socialShares, type SocialShare, type InsertSocialShare,
  animals, type Animal, type InsertAnimal,
  breedingEvents, type BreedingEvent, type InsertBreedingEvent,
  orders, type Order, type InsertOrder,
  orderItems, type OrderItem, type InsertOrderItem,
  type TransactionWithProduct,
  UserRoles,
} from "@shared/schema";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import createMemoryStore from "memorystore";
import { getDefaultPermissionsForRole } from "./types/roles";

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
  
  // Order methods
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<Order & { items: OrderItem[] } | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;
  getOrdersByCustomerEmail(email: string): Promise<Order[]>;
  getRecentOrders(limit: number): Promise<Order[]>;
  
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
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  
  currentUserId: number;
  currentProductId: number;
  currentTransactionId: number;
  currentNewsletterId: number;
  currentBulkOrderId: number;
  currentSocialShareId: number;
  currentAnimalId: number;
  currentBreedingEventId: number;
  currentOrderId: number;
  currentOrderItemId: number;
  
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
    this.orders = new Map();
    this.orderItems = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentTransactionId = 1;
    this.currentNewsletterId = 1;
    this.currentBulkOrderId = 1;
    this.currentSocialShareId = 1;
    this.currentAnimalId = 1;
    this.currentBreedingEventId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    
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
          animalId: animal.animalId,
          name: animal.name,
          type: animal.type,
          breed: animal.breed || null,
          breedId: animal.breedId || null,
          secondaryBreedId: animal.secondaryBreedId || null,
          isMixed: animal.isMixed || false,
          mixRatio: animal.mixRatio || null,
          gender: animal.gender,
          weight: animal.weight || null,
          color: animal.color || null,
          markings: animal.markings || null,
          parentMaleId: animal.parentMaleId || null,
          parentFemaleId: animal.parentFemaleId || null,
          generation: animal.generation || 0,
          ancestry: animal.ancestry || [],
          pedigreeLevel: animal.pedigreeLevel || 0,
          health: animal.health || 85,
          fertility: animal.fertility || 85,
          growthRate: animal.growthRate || 85,
          litterSize: animal.litterSize || null,
          offspringCount: 0,
          survivabilityRate: null,
          dateOfBirth: animal.dateOfBirth || null,
          weanDate: animal.weanDate || null,
          matureDate: animal.matureDate || null,
          retirementDate: animal.retirementDate || null,
          status: animal.status || "active",
          cageNumber: animal.cageNumber || null,
          dietaryNotes: animal.dietaryNotes || null,
          healthNotes: animal.healthNotes || null,
          behaviorNotes: animal.behaviorNotes || null,
          imageUrl: animal.imageUrl || null,
          notes: animal.notes || null,
          tags: animal.tags || [],
          purchasePrice: animal.purchasePrice || null,
          currentValue: animal.currentValue || null,
          roi: animal.roi || null,
          traits: animal.traits || {},
          createdBy: null,
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
            if ((male.parentMaleId && male.parentMaleId === female.parentMaleId) ||
                (male.parentFemaleId && male.parentFemaleId === female.parentFemaleId)) {
              return { 
                isRisky: true, 
                relationshipType: (male.parentMaleId === female.parentMaleId && male.parentFemaleId === female.parentFemaleId) 
                  ? "siblings" 
                  : "half-siblings",
                relationshipDegree: 1
              };
            }
            
            // Check if one is the parent of the other
            if (male.id === female.parentMaleId || female.id === male.parentFemaleId) {
              return { isRisky: true, relationshipType: "parent-child", relationshipDegree: 1 };
            }
            
            // Check for grandparent relationship (2nd degree)
            // Father's parents
            if (male.parentMaleId) {
              const maleFather = this.animals.get(male.parentMaleId);
              if (maleFather) {
                if (maleFather.id === female.id) {
                  return { isRisky: true, relationshipType: "grandmother-grandson", relationshipDegree: 2 };
                }
                if (maleFather.parentMaleId === female.id || maleFather.parentFemaleId === female.id) {
                  return { isRisky: true, relationshipType: "great-grandmother-great-grandson", relationshipDegree: 3 };
                }
              }
            }
            
            // Mother's parents
            if (male.parentFemaleId) {
              const maleMother = this.animals.get(male.parentFemaleId);
              if (maleMother) {
                if (maleMother.id === female.id) {
                  return { isRisky: true, relationshipType: "grandmother-grandson", relationshipDegree: 2 };
                }
                if (maleMother.parentMaleId === female.id || maleMother.parentFemaleId === female.id) {
                  return { isRisky: true, relationshipType: "great-grandmother-great-grandson", relationshipDegree: 3 };
                }
              }
            }
            
            // Check female's ancestors
            if (female.parentMaleId) {
              const femaleFather = this.animals.get(female.parentMaleId);
              if (femaleFather) {
                if (femaleFather.id === male.id) {
                  return { isRisky: true, relationshipType: "grandfather-granddaughter", relationshipDegree: 2 };
                }
                if (femaleFather.parentMaleId === male.id || femaleFather.parentFemaleId === male.id) {
                  return { isRisky: true, relationshipType: "great-grandfather-great-granddaughter", relationshipDegree: 3 };
                }
              }
            }
            
            if (female.parentFemaleId) {
              const femaleMother = this.animals.get(female.parentFemaleId);
              if (femaleMother) {
                if (femaleMother.id === male.id) {
                  return { isRisky: true, relationshipType: "grandfather-granddaughter", relationshipDegree: 2 };
                }
                if (femaleMother.parentMaleId === male.id || femaleMother.parentFemaleId === male.id) {
                  return { isRisky: true, relationshipType: "great-grandfather-great-granddaughter", relationshipDegree: 3 };
                }
              }
            }
            
            // Check for uncle/aunt relationships (cousins)
            if (male.parentMaleId && female.parentMaleId && male.parentMaleId !== female.parentMaleId) {
              const maleFather = this.animals.get(male.parentMaleId);
              const femaleFather = this.animals.get(female.parentMaleId);
              
              if (maleFather && femaleFather && 
                 ((maleFather.parentMaleId && maleFather.parentMaleId === femaleFather.parentMaleId) ||
                  (maleFather.parentFemaleId && maleFather.parentFemaleId === femaleFather.parentFemaleId))) {
                return { isRisky: true, relationshipType: "cousins", relationshipDegree: 2 };
              }
            }
            
            if (male.parentFemaleId && female.parentFemaleId && male.parentFemaleId !== female.parentFemaleId) {
              const maleMother = this.animals.get(male.parentFemaleId);
              const femaleMother = this.animals.get(female.parentFemaleId);
              
              if (maleMother && femaleMother && 
                 ((maleMother.parentMaleId && maleMother.parentMaleId === femaleMother.parentMaleId) ||
                  (maleMother.parentFemaleId && maleMother.parentFemaleId === femaleMother.parentFemaleId))) {
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
        if ((male.parentMaleId && male.parentMaleId === female.parentMaleId) ||
            (male.parentFemaleId && male.parentFemaleId === female.parentFemaleId)) {
          return { 
            isRisky: true, 
            relationshipType: (male.parentMaleId === female.parentMaleId && male.parentFemaleId === female.parentFemaleId) 
              ? "siblings" 
              : "half-siblings",
            relationshipDegree: 1,
            message: "These rabbits share one or both parents - breeding will result in genetic abnormalities"
          };
        }
        
        // Check if one is the parent of the other
        if (male.id === female.parentMaleId || female.id === male.parentFemaleId) {
          return { 
            isRisky: true, 
            relationshipType: "parent-child", 
            relationshipDegree: 1,
            message: "This is a direct parent-child relationship - breeding will result in genetic abnormalities" 
          };
        }
        
        // Check for grandparent relationship (2nd degree)
        // Father's parents
        if (male.parentMaleId) {
          const maleFather = this.animals.get(male.parentMaleId);
          if (maleFather) {
            if (maleFather.id === female.id) {
              return { 
                isRisky: true, 
                relationshipType: "grandmother-grandson", 
                relationshipDegree: 2,
                message: "Grandmother-grandson relationship detected - breeding is not recommended" 
              };
            }
            if (maleFather.parentMaleId === female.id || maleFather.parentFemaleId === female.id) {
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
        if (male.parentFemaleId) {
          const maleMother = this.animals.get(male.parentFemaleId);
          if (maleMother) {
            if (maleMother.id === female.id) {
              return { 
                isRisky: true, 
                relationshipType: "grandmother-grandson", 
                relationshipDegree: 2,
                message: "Grandmother-grandson relationship detected - breeding is not recommended" 
              };
            }
            if (maleMother.parentMaleId === female.id || maleMother.parentFemaleId === female.id) {
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
        if (female.parentMaleId) {
          const femaleFather = this.animals.get(female.parentMaleId);
          if (femaleFather) {
            if (femaleFather.id === male.id) {
              return { 
                isRisky: true, 
                relationshipType: "grandfather-granddaughter", 
                relationshipDegree: 2,
                message: "Grandfather-granddaughter relationship detected - breeding is not recommended" 
              };
            }
            if (femaleFather.parentMaleId === male.id || femaleFather.parentFemaleId === male.id) {
              return { 
                isRisky: true, 
                relationshipType: "great-grandfather-great-granddaughter", 
                relationshipDegree: 3,
                message: "Great-grandfather relationship detected - breeding may result in reduced vigor" 
              };
            }
          }
        }
        
        if (female.parentFemaleId) {
          const femaleMother = this.animals.get(female.parentFemaleId);
          if (femaleMother) {
            if (femaleMother.id === male.id) {
              return { 
                isRisky: true, 
                relationshipType: "grandfather-granddaughter", 
                relationshipDegree: 2,
                message: "Grandfather-granddaughter relationship detected - breeding is not recommended" 
              };
            }
            if (femaleMother.parentMaleId === male.id || femaleMother.parentFemaleId === male.id) {
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
        if (male.parentMaleId && female.parentMaleId && male.parentMaleId !== female.parentMaleId) {
          const maleFather = this.animals.get(male.parentMaleId);
          const femaleFather = this.animals.get(female.parentMaleId);
          
          if (maleFather && femaleFather && 
             ((maleFather.parentMaleId && maleFather.parentMaleId === femaleFather.parentMaleId) ||
              (maleFather.parentFemaleId && maleFather.parentFemaleId === femaleFather.parentFemaleId))) {
            return { 
              isRisky: true, 
              relationshipType: "cousins", 
              relationshipDegree: 2,
              message: "These rabbits are cousins - breeding may result in reduced genetic diversity" 
            };
          }
        }
        
        if (male.parentFemaleId && female.parentFemaleId && male.parentFemaleId !== female.parentFemaleId) {
          const maleMother = this.animals.get(male.parentFemaleId);
          const femaleMother = this.animals.get(female.parentFemaleId);
          
          if (maleMother && femaleMother && 
             ((maleMother.parentMaleId && maleMother.parentMaleId === femaleMother.parentMaleId) ||
              (maleMother.parentFemaleId && maleMother.parentFemaleId === femaleMother.parentFemaleId))) {
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
          eventId: event.eventId,
          maleId: event.maleId,
          femaleId: event.femaleId,
          pairId: event.pairId,
          breedingDate: event.breedingDate,
          nestBoxDate: event.nestBoxDate || null,
          expectedBirthDate: expectedBirthDate || null,
          actualBirthDate: event.actualBirthDate || null,
          status: event.status || "pending",
          successRating: event.successRating || null,
          wasPlanned: event.wasPlanned || true,
          offspringCount: event.offspringCount || 0,
          offspringIds: event.offspringIds || [],
          maleOffspringCount: event.maleOffspringCount || 0,
          femaleOffspringCount: event.femaleOffspringCount || 0,
          offspringWeightAvg: event.offspringWeightAvg || null,
          offspringHealthAvg: event.offspringHealthAvg || 0,
          offspringMortality: event.offspringMortality || 0,
          crossBreedType: event.crossBreedType || null,
          expectedTraitsMatched: event.expectedTraitsMatched || 0,
          unexpectedTraitsObserved: event.unexpectedTraitsObserved || [],
          geneticAnomalies: event.geneticAnomalies || [],
          performanceRating: event.performanceRating || null,
          economicValue: event.economicValue || null,
          notes: event.notes || null,
          images: event.images || [],
          createdBy: null,
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
                parentMaleId: male.id,
                parentFemaleId: female.id,
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
        animalId: "M1",
        name: "Max",
        type: "rabbit",
        breed: "New Zealand White",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2023-01-05"),
        health: 90,
        fertility: 95,
        notes: "Original patriarch of the rabbit family"
      });
      
      const grandmother = await this.animalBreedingService.createAnimal({
        animalId: "F1",
        name: "Ruby",
        type: "rabbit",
        breed: "Rex",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2023-02-10"),
        health: 92,
        fertility: 96,
        notes: "Original matriarch of the rabbit family"
      });
      
      // Second generation - first breeding result
      const father1 = await this.animalBreedingService.createAnimal({
        animalId: "M2",
        name: "Jack",
        type: "rabbit",
        breed: "New Zealand/Rex Mix",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2023-06-15"),
        parentMaleId: grandfather.id,
        parentFemaleId: grandmother.id,
        ancestry: [grandfather.animalId, grandmother.animalId],
        generation: 1,
        health: 88,
        fertility: 90,
        isMixed: true,
        mixRatio: "50% New Zealand, 50% Rex",
        notes: "First generation offspring, now a breeding male"
      });
      
      const mother1 = await this.animalBreedingService.createAnimal({
        animalId: "F2",
        name: "Daisy",
        type: "rabbit",
        breed: "New Zealand/Rex Mix",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2023-06-15"),
        parentMaleId: grandfather.id,
        parentFemaleId: grandmother.id,
        ancestry: [grandfather.animalId, grandmother.animalId],
        generation: 1,
        health: 89,
        fertility: 92,
        isMixed: true,
        mixRatio: "50% New Zealand, 50% Rex",
        notes: "First generation offspring, now a breeding female"
      });
      
      // Unrelated rabbits to allow non-incestuous breeding
      const unrelatedMale = await this.animalBreedingService.createAnimal({
        animalId: "M3",
        name: "Thunder",
        type: "rabbit",
        breed: "Californian",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2023-07-10"),
        health: 91,
        fertility: 93,
        notes: "Unrelated male for outcrossing"
      });
      
      const unrelatedFemale = await this.animalBreedingService.createAnimal({
        animalId: "F3",
        name: "Snowflake",
        type: "rabbit",
        breed: "Himalayan",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2023-08-05"),
        health: 90,
        fertility: 91,
        notes: "Unrelated female for outcrossing"
      });
      
      // Breeding with unrelated animals
      const father2 = await this.animalBreedingService.createAnimal({
        animalId: "M4",
        name: "Oreo",
        type: "rabbit",
        breed: "Californian/Rex Mix",
        gender: "male",
        status: "active", 
        dateOfBirth: new Date("2024-01-10"),
        parentMaleId: unrelatedMale.id,
        parentFemaleId: mother1.id,
        ancestry: [unrelatedMale.animalId, mother1.animalId, grandfather.animalId, grandmother.animalId],
        generation: 2,
        health: 92,
        fertility: 90,
        isMixed: true,
        mixRatio: "50% Californian, 25% New Zealand, 25% Rex",
        notes: "Second generation offspring through outcrossing"
      });
      
      const mother2 = await this.animalBreedingService.createAnimal({
        animalId: "F4",
        name: "Coco",
        type: "rabbit",
        breed: "New Zealand/Himalayan Mix",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2024-02-15"),
        parentMaleId: father1.id,
        parentFemaleId: unrelatedFemale.id,
        ancestry: [father1.animalId, unrelatedFemale.animalId, grandfather.animalId, grandmother.animalId],
        generation: 2,
        health: 91,
        fertility: 93,
        isMixed: true,
        mixRatio: "25% New Zealand, 25% Rex, 50% Himalayan",
        notes: "Second generation offspring through outcrossing"
      });
      
      // Create third generation
      const youngMale = await this.animalBreedingService.createAnimal({
        animalId: "M5",
        name: "Peanut",
        type: "rabbit",
        breed: "Mixed",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2024-09-01"),
        parentMaleId: father2.id,
        parentFemaleId: mother2.id,
        ancestry: [father2.animalId, mother2.animalId, unrelatedMale.animalId, mother1.animalId, father1.animalId, unrelatedFemale.animalId],
        generation: 3,
        health: 88,
        fertility: 87,
        isMixed: true,
        mixRatio: "Complex Mix",
        notes: "Third generation offspring"
      });
      
      const youngFemale = await this.animalBreedingService.createAnimal({
        animalId: "F5",
        name: "Luna",
        type: "rabbit",
        breed: "Mixed",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2024-09-01"),
        parentMaleId: father2.id,
        parentFemaleId: mother2.id,
        ancestry: [father2.animalId, mother2.animalId, unrelatedMale.animalId, mother1.animalId, father1.animalId, unrelatedFemale.animalId],
        generation: 3,
        health: 89,
        fertility: 89,
        isMixed: true,
        mixRatio: "Complex Mix",
        notes: "Third generation offspring"
      });
      
      // Current breeding pair - should be safe from inbreeding
      const currentMale = await this.animalBreedingService.createAnimal({
        animalId: "M6",
        name: "Apollo",
        type: "rabbit",
        breed: "Californian/Himalayan Mix",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2024-08-10"),
        parentMaleId: unrelatedMale.id,
        parentFemaleId: unrelatedFemale.id,
        ancestry: [unrelatedMale.animalId, unrelatedFemale.animalId],
        generation: 1,
        health: 95,
        fertility: 94,
        isMixed: true,
        mixRatio: "50% Californian, 50% Himalayan",
        notes: "Current breeding male - unrelated to other family lines"
      });
      
      const currentFemale = await this.animalBreedingService.createAnimal({
        animalId: "F6",
        name: "Willow",
        type: "rabbit",
        breed: "New Zealand/Himalayan Mix",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2024-07-20"),
        parentMaleId: father1.id,
        parentFemaleId: unrelatedFemale.id,
        ancestry: [father1.animalId, unrelatedFemale.animalId, grandfather.animalId, grandmother.animalId],
        generation: 2,
        health: 93,
        fertility: 95,
        isMixed: true,
        mixRatio: "25% New Zealand, 25% Rex, 50% Himalayan",
        notes: "Current breeding female"
      });
      
      // Add some non-rabbit animals
      const goat1 = await this.animalBreedingService.createAnimal({
        animalId: "G1",
        name: "Billy",
        type: "goat",
        breed: "Boer",
        gender: "male",
        status: "active",
        dateOfBirth: new Date("2023-05-10"),
        health: 90,
        fertility: 92,
        notes: "Healthy breeding male goat"
      });
      
      const goat2 = await this.animalBreedingService.createAnimal({
        animalId: "G2",
        name: "Nanny",
        type: "goat",
        breed: "Boer",
        gender: "female",
        status: "active",
        dateOfBirth: new Date("2023-06-15"),
        health: 91,
        fertility: 90,
        notes: "Good milk producer goat"
      });
      
      // Create some breeding events - historical
      const pastBreeding1 = await this.animalBreedingService.createBreedingEvent({
        eventId: "BE-M1_F1-20230515",
        maleId: grandfather.id,
        femaleId: grandmother.id,
        pairId: "M1_F1",
        breedingDate: new Date("2023-05-15"),
        nestBoxDate: new Date("2023-06-01"),
        expectedBirthDate: new Date("2023-06-16"),
        actualBirthDate: new Date("2023-06-15"),
        status: "completed",
        successRating: 9,
        wasPlanned: true,
        offspringCount: 6,
        offspringIds: ["M2", "F2", "F2_1", "F2_2", "M2_1", "M2_2"],
        maleOffspringCount: 3,
        femaleOffspringCount: 3,
        offspringWeightAvg: 0.12,
        offspringHealthAvg: 90,
        offspringMortality: 0,
        crossBreedType: "mixed",
        expectedTraitsMatched: 85,
        economicValue: 180,
        notes: "First generation breeding - produced 6 healthy kits"
      });
      
      const pastBreeding2 = await this.animalBreedingService.createBreedingEvent({
        eventId: "BE-M3_F2-20231210",
        maleId: unrelatedMale.id,
        femaleId: mother1.id,
        pairId: "M3_F2",
        breedingDate: new Date("2023-12-10"),
        nestBoxDate: new Date("2023-12-28"),
        expectedBirthDate: new Date("2024-01-10"),
        actualBirthDate: new Date("2024-01-10"),
        status: "completed",
        successRating: 8,
        wasPlanned: true,
        offspringCount: 5,
        offspringIds: ["M4", "F4_1", "F4_2", "M4_1", "M4_2"],
        maleOffspringCount: 3,
        femaleOffspringCount: 2,
        offspringWeightAvg: 0.13,
        offspringHealthAvg: 92,
        offspringMortality: 0,
        crossBreedType: "outcross",
        expectedTraitsMatched: 75,
        economicValue: 150,
        notes: "Second generation outcross breeding"
      });
      
      const pastBreeding3 = await this.animalBreedingService.createBreedingEvent({
        eventId: "BE-M2_F3-20240115",
        maleId: father1.id,
        femaleId: unrelatedFemale.id,
        pairId: "M2_F3",
        breedingDate: new Date("2024-01-15"),
        nestBoxDate: new Date("2024-02-01"),
        expectedBirthDate: new Date("2024-02-16"),
        actualBirthDate: new Date("2024-02-15"),
        status: "completed",
        successRating: 9,
        wasPlanned: true,
        offspringCount: 7,
        offspringIds: ["F4", "M4_3", "M4_4", "F4_3", "F4_4", "M4_5", "F4_5"],
        maleOffspringCount: 3,
        femaleOffspringCount: 4,
        offspringWeightAvg: 0.14,
        offspringHealthAvg: 91,
        offspringMortality: 0,
        crossBreedType: "outcross",
        expectedTraitsMatched: 80,
        economicValue: 200,
        notes: "Second generation outcross breeding"
      });
      
      // Create current breeding event - pending
      const currentBreeding = await this.animalBreedingService.createBreedingEvent({
        eventId: "BE-M6_F6-20250315",
        maleId: currentMale.id,
        femaleId: currentFemale.id,
        pairId: "M6_F6",
        breedingDate: new Date("2025-03-15"),
        nestBoxDate: new Date("2025-04-01"),
        expectedBirthDate: new Date("2025-04-16"),
        status: "pending",
        wasPlanned: true,
        crossBreedType: "outcross",
        expectedTraitsMatched: 85,
        notes: "Current breeding attempt - healthy unrelated pair"
      });
      
      // Add non-rabbit breeding
      await this.animalBreedingService.createBreedingEvent({
        eventId: "BE-G1_G2-20250401",
        maleId: goat1.id,
        femaleId: goat2.id,
        pairId: "G1_G2",
        breedingDate: new Date("2025-04-01"),
        expectedBirthDate: new Date("2025-09-01"),
        status: "pending",
        wasPlanned: true,
        crossBreedType: "pure",
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
    
    // Set default permissions based on role if not explicitly provided
    let permissions = insertUser.permissions;
    if (!permissions && insertUser.role) {
      permissions = getDefaultPermissionsForRole(insertUser.role);
    }
    
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || UserRoles.CUSTOMER,
      permissions: permissions || [],
      avatar: insertUser.avatar || null,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      lastLogin: null,
      createdAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    // Handle role change - update permissions if role changes and permissions aren't explicitly set
    if (userUpdate.role && userUpdate.role !== existingUser.role && !userUpdate.permissions) {
      // Use the imported getDefaultPermissionsForRole function
      userUpdate.permissions = getDefaultPermissionsForRole(userUpdate.role);
    }
    
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

  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderWithItems(id: number): Promise<Order & { items: OrderItem[] } | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const items = Array.from(this.orderItems.values()).filter(item => item.orderId === id);
    return { ...order, items };
  }

  async createOrder(order: InsertOrder, items: { productId: number, productName: string, unitPrice: number, quantity: number, subtotal: number, notes?: string | null }[]): Promise<Order> {
    const id = this.currentOrderId++;
    const newOrder: Order = {
      id,
      userId: order.userId || null,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone || null,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress || null,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || "pending",
      shippingMethod: order.shippingMethod || null,
      shippingFee: order.shippingFee || 0,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount || 0,
      discountAmount: order.discountAmount || 0,
      totalAmount: order.totalAmount,
      orderNotes: order.orderNotes || null,
      status: order.status || 'pending',
      orderDate: new Date(),
      estimatedDeliveryDate: order.estimatedDeliveryDate || null,
      actualDeliveryDate: null,
      trackingCode: order.trackingCode || null,
      referralSource: order.referralSource || null
    };
    this.orders.set(id, newOrder);

    // Add order items
    for (const item of items) {
      const itemId = this.currentOrderItemId++;
      const orderItem: OrderItem = {
        id: itemId,
        orderId: id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        notes: item.notes || null
      };
      this.orderItems.set(itemId, orderItem);

      // Update product stock
      const product = this.products.get(item.productId);
      if (product) {
        product.stock = Math.max(0, (product.stock || 0) - item.quantity);
        this.products.set(product.id, product);
      }
    }

    return newOrder;
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;

    const updatedOrder: Order = {
      ...existingOrder,
      ...orderUpdate
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    // First delete all order items associated with this order
    const orderItems = Array.from(this.orderItems.values()).filter(item => item.orderId === id);
    for (const item of orderItems) {
      this.orderItems.delete(item.id);
    }

    return this.orders.delete(id);
  }

  async getOrdersByCustomerEmail(email: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.customerEmail === email);
  }

  async getRecentOrders(limit: number): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => {
        const dateA = a.orderDate || new Date(0);
        const dateB = b.orderDate || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
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

    // Add some sample orders
    // Create first sample order
    const order1Id = this.currentOrderId++;
    const order1: Order = {
      id: order1Id,
      userId: null,
      customerName: "Jane Smith",
      customerEmail: "jane.smith@example.com",
      customerPhone: "+1-555-111-2222",
      shippingAddress: "123 Main St, Anytown, USA",
      billingAddress: null,
      paymentMethod: "credit_card",
      paymentStatus: "paid",
      shippingMethod: null,
      shippingFee: 10.00,
      subtotal: 79.95,
      taxAmount: 6.40,
      discountAmount: 0,
      totalAmount: 96.35,
      orderNotes: "Please deliver in the morning",
      status: "processing",
      orderDate: new Date(),
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      trackingCode: null,
      referralSource: null
    };
    this.orders.set(order1Id, order1);
    
    // Add order 1 items
    const order1Item1Id = this.currentOrderItemId++;
    const order1Item1: OrderItem = {
      id: order1Item1Id,
      orderId: order1Id,
      productId: chicken.id,
      productName: chicken.name,
      quantity: 3,
      unitPrice: chicken.price,
      subtotal: 3 * chicken.price,
      notes: null
    };
    this.orderItems.set(order1Item1Id, order1Item1);
    
    const order1Item2Id = this.currentOrderItemId++;
    const order1Item2: OrderItem = {
      id: order1Item2Id,
      orderId: order1Id,
      productId: eggs.id,
      productName: eggs.name,
      quantity: 2,
      unitPrice: eggs.price,
      subtotal: 2 * eggs.price,
      notes: null
    };
    this.orderItems.set(order1Item2Id, order1Item2);

    // Create second sample order
    const order2Id = this.currentOrderId++;
    const order2: Order = {
      id: order2Id,
      userId: null,
      customerName: "Robert Johnson",
      customerEmail: "robert.j@example.com",
      customerPhone: "+1-555-333-4444",
      shippingAddress: "456 Oak Ave, Somewhere, USA",
      billingAddress: null,
      paymentMethod: "paypal",
      paymentStatus: "paid",
      shippingMethod: null,
      shippingFee: 15.00,
      subtotal: 255.99,
      taxAmount: 20.48,
      discountAmount: 0,
      totalAmount: 291.47,
      orderNotes: "Call before delivery",
      status: "shipped",
      orderDate: new Date(),
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      trackingCode: "ABC123456",
      referralSource: null
    };
    this.orders.set(order2Id, order2);
    
    // Add order 2 items
    const order2Item1Id = this.currentOrderItemId++;
    const order2Item1: OrderItem = {
      id: order2Item1Id,
      orderId: order2Id,
      productId: goat.id,
      productName: goat.name,
      quantity: 1,
      unitPrice: goat.price,
      subtotal: goat.price,
      notes: null
    };
    this.orderItems.set(order2Item1Id, order2Item1);
    
    const order2Item2Id = this.currentOrderItemId++;
    const order2Item2: OrderItem = {
      id: order2Item2Id,
      orderId: order2Id,
      productId: chickenFeed.id,
      productName: chickenFeed.name,
      quantity: 1,
      unitPrice: chickenFeed.price,
      subtotal: chickenFeed.price,
      notes: null
    };
    this.orderItems.set(order2Item2Id, order2Item2);

    // Create third sample order
    const order3Id = this.currentOrderId++;
    const order3: Order = {
      id: order3Id,
      userId: null,
      customerName: "Maria Garcia",
      customerEmail: "maria.g@example.com",
      customerPhone: "+1-555-777-8888",
      shippingAddress: "789 Pine St, Elsewhere, USA",
      billingAddress: null,
      paymentMethod: "cash",
      paymentStatus: "pending",
      shippingMethod: null,
      shippingFee: 8.00,
      subtotal: 42.97,
      taxAmount: 3.44,
      discountAmount: 0,
      totalAmount: 54.41,
      orderNotes: "Leave at front porch",
      status: "pending",
      orderDate: new Date(),
      estimatedDeliveryDate: null,
      actualDeliveryDate: null,
      trackingCode: null,
      referralSource: null
    };
    this.orders.set(order3Id, order3);
    
    // Add order 3 items
    const order3Item1Id = this.currentOrderItemId++;
    const order3Item1: OrderItem = {
      id: order3Item1Id,
      orderId: order3Id,
      productId: rabbit.id,
      productName: rabbit.name,
      quantity: 1,
      unitPrice: rabbit.price,
      subtotal: rabbit.price,
      notes: null
    };
    this.orderItems.set(order3Item1Id, order3Item1);
    
    const order3Item2Id = this.currentOrderItemId++;
    const order3Item2: OrderItem = {
      id: order3Item2Id,
      orderId: order3Id,
      productId: goatMilk.id,
      productName: goatMilk.name,
      quantity: 1,
      unitPrice: goatMilk.price,
      subtotal: goatMilk.price,
      notes: null
    };
    this.orderItems.set(order3Item2Id, order3Item2);
  }
}

export const storage = new MemStorage();