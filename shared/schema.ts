import { pgTable, text, serial, integer, boolean, real, timestamp, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").default("User"),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  avatar: true,
});

// Products table for farm products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  salePrice: real("sale_price"),
  unit: text("unit").notNull(),
  stock: real("stock").notNull(),
  stockQuantity: real("stock_quantity").notNull().default(0),
  lowStockThreshold: real("low_stock_threshold").default(10), // Threshold for low stock alerts
  stockStatus: text("stock_status").default("normal"), // normal, low, out_of_stock
  lastRestockDate: timestamp("last_restock_date").defaultNow(), // Date of last restock
  nextRestockDate: timestamp("next_restock_date"), // Expected date of next restock
  category: text("category").default("general"),
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
  isFeatured: boolean("is_featured").default(false),
  isNew: boolean("is_new").default(false),
  supplierName: text("supplier_name"),
  location: text("location"), // For product distribution tracking
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  salePrice: true,
  unit: true,
  stock: true,
  stockQuantity: true,
  lowStockThreshold: true,
  stockStatus: true,
  lastRestockDate: true,
  nextRestockDate: true,
  category: true,
  imageUrl: true,
  featured: true,
  isFeatured: true,
  isNew: true,
  supplierName: true,
  location: true,
  createdAt: true,
});

// Transactions table for purchases, sales, and orders
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(), // "sale", "purchase", "order", "auction"
  quantity: real("quantity").notNull(),
  price: real("price").notNull(),
  customer: text("customer"),
  notes: text("notes"),
  status: text("status").default("completed"), // pending, completed, cancelled
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  date: true,
  productId: true,
  type: true,
  quantity: true,
  price: true,
  customer: true,
  notes: true,
  status: true,
});

// Newsletter subscribers
export const newsletters = pgTable("newsletters", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  subscribed: boolean("subscribed").default(true),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNewsletterSchema = createInsertSchema(newsletters).pick({
  email: true,
  name: true,
  subscribed: true,
  verified: true,
});

// Bulk order requests
export const bulkOrders = pgTable("bulk_orders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  productId: integer("product_id"),
  quantity: real("quantity"),
  message: text("message").notNull(),
  status: text("status").default("new"), // new, contacted, completed, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBulkOrderSchema = createInsertSchema(bulkOrders).pick({
  name: true,
  email: true,
  phone: true,
  productId: true,
  quantity: true,
  message: true,
  status: true,
});

// Social media sharing analytics
export const socialShares = pgTable("social_shares", {
  id: serial("id").primaryKey(),
  productId: integer("product_id"),
  platform: text("platform").notNull(), // facebook, twitter, instagram, etc.
  shareCount: integer("share_count").default(0),
  lastShared: timestamp("last_shared").defaultNow(),
});

export const insertSocialShareSchema = createInsertSchema(socialShares).pick({
  productId: true,
  platform: true,
  shareCount: true,
});

// We'll add type definitions after all tables are defined
// We'll define all types at the end of the file

// Zod validation schemas for form submissions
export const newsletterFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
});

export const bulkOrderFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  productId: z.number().optional(),
  quantity: z.number().positive("Quantity must be positive").optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
  status: z.enum(["new", "contacted", "completed", "rejected"]).default("new").optional(),
});

export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  filters: z.object({
    category: z.string().optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    inStock: z.boolean().optional(),
    stockStatus: z.enum(['normal', 'low', 'out_of_stock']).optional(),
    sortBy: z.enum([
      'price-asc', 
      'price-desc', 
      'name-asc', 
      'name-desc', 
      'newest', 
      'featured'
    ]).optional(),
  }).optional(),
});

// Inventory settings validation schema
export const inventorySettingsSchema = z.object({
  lowStockThreshold: z.number().min(1, "Threshold must be at least 1").default(10),
  stockStatus: z.enum(['normal', 'low', 'out_of_stock']).default('normal'),
  stockQuantity: z.number().min(0, "Stock quantity cannot be negative").default(0),
  nextRestockDate: z.date().nullable().optional(),
});

// Enhanced animal form validation schema for rabbit breeding
export const animalFormSchema = z.object({
  // Basic info
  animalId: z.string().min(2, "Animal ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.string().min(2, "Animal type is required"),
  breed: z.string().optional(),
  breedId: z.number().optional(),
  secondaryBreedId: z.number().optional(),
  isMixed: z.boolean().optional(),
  mixRatio: z.string().optional(),
  
  // Physical characteristics
  gender: z.enum(["male", "female"]),
  weight: z.number().optional(),
  color: z.string().optional(),
  markings: z.string().optional(),
  
  // Lineage tracking
  parentMaleId: z.number().optional().nullable(),
  parentFemaleId: z.number().optional().nullable(),
  generation: z.number().optional(),
  ancestry: z.array(z.string()).optional(),
  pedigreeLevel: z.number().optional(),
  
  // Health and performance metrics
  health: z.number().min(1).max(100).optional(),
  fertility: z.number().min(1).max(100).optional(),
  growthRate: z.number().min(1).max(100).optional(),
  litterSize: z.number().optional(),
  
  // Dates and lifecycle
  dateOfBirth: z.date().optional(),
  weanDate: z.date().optional(),
  matureDate: z.date().optional(),
  retirementDate: z.date().optional(),
  status: z.enum([
    "active", 
    "breeding", 
    "retired", 
    "sold", 
    "deceased"
  ]).default("active"),
  
  // Management data
  cageNumber: z.string().optional(),
  dietaryNotes: z.string().optional(),
  healthNotes: z.string().optional(),
  behaviorNotes: z.string().optional(),
  
  // General
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  
  // Economic tracking
  purchasePrice: z.number().optional(),
  currentValue: z.number().optional(),
});

// Enhanced breeding event form validation schema
export const breedingEventFormSchema = z.object({
  // Event identifiers
  eventId: z.string().optional(),
  
  // Participants
  maleId: z.number().min(1, "Male animal is required"),
  femaleId: z.number().min(1, "Female animal is required"),
  pairId: z.string().optional(),
  
  // Timing
  breedingDate: z.date().default(() => new Date()),
  nestBoxDate: z.date().optional(),
  expectedBirthDate: z.date().optional(),
  actualBirthDate: z.date().optional(),
  
  // Outcome
  status: z.enum([
    "pending", 
    "successful", 
    "unsuccessful", 
    "cancelled"
  ]).default("pending"),
  successRating: z.number().min(1).max(10).optional(),
  wasPlanned: z.boolean().default(true),
  
  // Offspring details
  offspringCount: z.number().optional(),
  maleOffspringCount: z.number().optional(),
  femaleOffspringCount: z.number().optional(),
  offspringWeightAvg: z.number().optional(),
  offspringHealthAvg: z.number().optional(),
  offspringMortality: z.number().optional(),
  
  // Cross-breeding specific data
  crossBreedType: z.enum(["pure", "mixed", "hybrid"]).optional(),
  expectedTraitsMatched: z.number().min(0).max(100).optional(),
  
  // Notes
  notes: z.string().optional(),
});

// Rabbit breed form validation schema
export const rabbitBreedFormSchema = z.object({
  name: z.string().min(2, "Breed name is required"),
  description: z.string().optional(),
  originCountry: z.string().optional(),
  sizeCategory: z.enum(["small", "medium", "large", "giant"]).default("medium"),
  weightRangeLow: z.number().optional(),
  weightRangeHigh: z.number().optional(),
  furType: z.string().optional(),
  colorPatterns: z.array(z.string()).optional(),
  lifeExpectancy: z.number().optional(),
  temperament: z.array(z.string()).optional(),
  
  // Breed-specific health metrics
  fertilityStat: z.number().min(1).max(100).optional(),
  healthStat: z.number().min(1).max(100).optional(),
  growthRateStat: z.number().min(1).max(100).optional(),
  litterSizeStat: z.number().min(1).max(100).optional(),
  diseaseResistanceStat: z.number().min(1).max(100).optional(),
  geneticDiversityStat: z.number().min(1).max(100).optional(),
  
  // Common health issues for this breed
  commonHealthIssues: z.array(z.string()).optional(),
  breedingDifficulty: z.number().min(1).max(100).optional(),
  
  // Management info
  dietaryNeeds: z.string().optional(),
  housingRequirements: z.string().optional(),
  
  // Images and metadata
  imageUrl: z.string().optional(),
  isRare: z.boolean().optional(),
});

// Breed compatibility form validation schema
export const breedCompatibilityFormSchema = z.object({
  breed1Id: z.number().min(1, "First breed is required"),
  breed2Id: z.number().min(1, "Second breed is required"),
  compatibilityScore: z.number().min(1).max(100).optional(),
  expectedOffspringHealthBonus: z.number().min(-50).max(50).optional(),
  expectedLitterSizeModifier: z.number().min(0.1).max(2.0).optional(),
  expectedTraits: z.array(z.string()).optional(),
  expectedIssues: z.array(z.string()).optional(),
  recommendedForBeginners: z.boolean().optional(),
  notes: z.string().optional(),
  success_rate: z.number().min(1).max(100).optional(),
  uniqueBreedPair: z.string().optional(),
});

// Rabbit breed characteristics table - defines traits for each breed
export const rabbitBreeds = pgTable("rabbit_breeds", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  originCountry: text("origin_country"),
  sizeCategory: text("size_category").default("medium"), // small, medium, large, giant
  weightRangeLow: real("weight_range_low"), // in kg
  weightRangeHigh: real("weight_range_high"), // in kg
  furType: text("fur_type"), // rex, satin, normal, etc.
  colorPatterns: text("color_patterns").array(), // Array of possible colors
  lifeExpectancy: integer("life_expectancy"), // in years
  temperament: text("temperament").array(), // calm, active, friendly, etc.
  
  // Breed-specific health metrics (1-100 scale)
  fertilityStat: integer("fertility_stat").default(75), // Base fertility rating
  healthStat: integer("health_stat").default(75), // Overall health robustness
  growthRateStat: integer("growth_rate_stat").default(75), // How quickly they grow
  litterSizeStat: integer("litter_size_stat").default(75), // Average litter size
  diseaseResistanceStat: integer("disease_resistance_stat").default(75), // Resistance to common issues
  geneticDiversityStat: integer("genetic_diversity_stat").default(75), // Genetic diversity within breed
  
  // Common health issues for this breed
  commonHealthIssues: text("common_health_issues").array(),
  breedingDifficulty: integer("breeding_difficulty").default(50), // 1-100 scale
  
  // Management info
  dietaryNeeds: text("dietary_needs"),
  housingRequirements: text("housing_requirements"),
  
  // Images and metadata
  imageUrl: text("image_url"),
  isRare: boolean("is_rare").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cross-breeding compatibility table - defines compatibility between breeds
export const breedCompatibility = pgTable("breed_compatibility", {
  id: serial("id").primaryKey(),
  breed1Id: integer("breed_1_id").references(() => rabbitBreeds.id).notNull(),
  breed2Id: integer("breed_2_id").references(() => rabbitBreeds.id).notNull(),
  compatibilityScore: integer("compatibility_score").default(50), // 1-100
  expectedOffspringHealthBonus: integer("expected_offspring_health_bonus").default(0), // -50 to +50
  expectedLitterSizeModifier: real("expected_litter_size_modifier").default(1.0), // Multiplier
  expectedTraits: text("expected_traits").array(), // Traits likely to be inherited
  expectedIssues: text("expected_issues").array(), // Potential issues with this cross
  recommendedForBeginners: boolean("recommended_for_beginners").default(false),
  notes: text("notes"),
  success_rate: integer("success_rate").default(75), // Historical success rate
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Ensure each breed pair only has one entry
  uniqueBreedPair: text("unique_breed_pair").notNull().unique(),
});

// Enhanced animal table for comprehensive breeding tracking
export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  
  // Basic info
  animalId: text("animal_id").notNull().unique(), // Custom ID like M1_F1 or M1F1_01
  name: text("name").notNull(),
  type: text("type").notNull(), // rabbit, goat, chicken, etc.
  breed: text("breed"),
  breedId: integer("breed_id").references(() => rabbitBreeds.id), // Primary breed reference
  secondaryBreedId: integer("secondary_breed_id").references(() => rabbitBreeds.id), // For mixed breeds
  isMixed: boolean("is_mixed").default(false),
  mixRatio: text("mix_ratio"), // e.g., "75% New Zealand, 25% Californian"
  
  // Physical characteristics
  gender: text("gender").notNull(), // male, female
  weight: real("weight"), // in kg
  color: text("color"),
  markings: text("markings"),
  
  // Lineage tracking
  parentMaleId: integer("parent_male_id"), // Will be set to reference animals.id
  parentFemaleId: integer("parent_female_id"), // Will be set to reference animals.id
  generation: integer("generation").default(0), // 0 = foundation, 1 = first generation, etc.
  ancestry: text("ancestry").array(), // Array of ancestor IDs for quick relationship checks
  pedigreeLevel: integer("pedigree_level").default(0), // 0-5 scale, higher = more pure lineage
  
  // Health and performance metrics
  health: integer("health").default(85), // 1-100 scale
  fertility: integer("fertility").default(85), // 1-100 scale
  growthRate: integer("growth_rate").default(85), // 1-100 scale
  litterSize: integer("litter_size"), // Average litter size (for breeding females)
  offspringCount: integer("offspring_count").default(0), // Total offspring produced
  survivabilityRate: real("survivability_rate"), // % of offspring that survive
  
  // Dates and lifecycle
  dateOfBirth: timestamp("date_of_birth"),
  weanDate: timestamp("wean_date"),
  matureDate: timestamp("mature_date"), // Date ready for breeding
  retirementDate: timestamp("retirement_date"), // Date retired from breeding
  status: text("status").default("active").notNull(), // active, breeding, retired, sold, deceased
  
  // Management data
  cageNumber: text("cage_number"),
  dietaryNotes: text("dietary_notes"),
  healthNotes: text("health_notes"),
  behaviorNotes: text("behavior_notes"),
  
  // Images and general notes
  imageUrl: text("image_url"),
  notes: text("notes"),
  tags: text("tags").array(),
  
  // Economic tracking
  purchasePrice: real("purchase_price"),
  currentValue: real("current_value"),
  roi: real("roi"), // Return on Investment calculation
  
  // Metadata
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Tracking specific traits for this animal
  traits: json("traits").default({}),
});

export const insertAnimalSchema = createInsertSchema(animals).pick({
  animalId: true,
  name: true,
  type: true,
  breed: true,
  breedId: true,
  secondaryBreedId: true,
  isMixed: true,
  mixRatio: true,
  gender: true,
  weight: true,
  color: true,
  markings: true,
  parentMaleId: true,
  parentFemaleId: true,
  generation: true,
  ancestry: true,
  pedigreeLevel: true,
  health: true,
  fertility: true,
  growthRate: true,
  litterSize: true,
  dateOfBirth: true,
  weanDate: true,
  matureDate: true,
  retirementDate: true,
  status: true,
  cageNumber: true,
  dietaryNotes: true,
  healthNotes: true,
  behaviorNotes: true,
  imageUrl: true,
  notes: true,
  tags: true,
  purchasePrice: true,
  currentValue: true,
  roi: true,
  traits: true,
});

// Enhanced breeding events table
export const breedingEvents = pgTable("breeding_events", {
  id: serial("id").primaryKey(),
  
  // Event identifiers
  eventId: text("event_id").notNull().unique(), // Custom ID like "BE-M1_F1-20250401"
  
  // Participants
  maleId: integer("male_id").references(() => animals.id).notNull(),
  femaleId: integer("female_id").references(() => animals.id).notNull(),
  pairId: text("pair_id").notNull(), // Composite ID like "M1_F1" for easy querying
  
  // Timing
  breedingDate: timestamp("breeding_date").defaultNow().notNull(),
  nestBoxDate: timestamp("nest_box_date"), // When nest box was added
  expectedBirthDate: timestamp("expected_birth_date"),
  actualBirthDate: timestamp("actual_birth_date"),
  
  // Outcome
  status: text("status").default("pending").notNull(), // pending, successful, unsuccessful, cancelled
  successRating: integer("success_rating"), // 1-10 subjective rating of success
  wasPlanned: boolean("was_planned").default(true),
  
  // Offspring details
  offspringCount: integer("offspring_count").default(0),
  offspringIds: text("offspring_ids").array(), // Array of IDs for quick reference
  maleOffspringCount: integer("male_offspring_count").default(0),
  femaleOffspringCount: integer("female_offspring_count").default(0),
  offspringWeightAvg: real("offspring_weight_avg"), // Average birth weight
  offspringHealthAvg: integer("offspring_health_avg").default(0), // 1-100 scale
  offspringMortality: integer("offspring_mortality").default(0), // Number that didn't survive
  
  // Cross-breeding specific data
  crossBreedType: text("cross_breed_type"), // "pure", "mixed", "hybrid"
  expectedTraitsMatched: integer("expected_traits_matched").default(0), // 0-100%
  unexpectedTraitsObserved: text("unexpected_traits_observed").array(),
  geneticAnomalies: text("genetic_anomalies").array(),
  
  // Performance metrics
  performanceRating: integer("performance_rating"), // 1-100 subjective rating
  economicValue: real("economic_value"), // Calculated value of the breeding
  
  // Notes and metadata
  notes: text("notes"),
  images: text("images").array(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBreedingEventSchema = createInsertSchema(breedingEvents).pick({
  eventId: true,
  maleId: true,
  femaleId: true,
  pairId: true,
  breedingDate: true,
  nestBoxDate: true,
  expectedBirthDate: true,
  actualBirthDate: true,
  status: true,
  successRating: true,
  wasPlanned: true,
  offspringCount: true,
  offspringIds: true,
  maleOffspringCount: true,
  femaleOffspringCount: true,
  offspringWeightAvg: true,
  offspringHealthAvg: true,
  offspringMortality: true,
  crossBreedType: true,
  expectedTraitsMatched: true,
  unexpectedTraitsObserved: true,
  geneticAnomalies: true,
  performanceRating: true,
  economicValue: true,
  notes: true,
  images: true,
});

// Create insert schemas
export const insertRabbitBreedSchema = createInsertSchema(rabbitBreeds).pick({
  name: true,
  description: true,
  originCountry: true,
  sizeCategory: true,
  weightRangeLow: true,
  weightRangeHigh: true,
  furType: true,
  colorPatterns: true,
  lifeExpectancy: true,
  temperament: true,
  fertilityStat: true,
  healthStat: true,
  growthRateStat: true,
  litterSizeStat: true,
  diseaseResistanceStat: true,
  geneticDiversityStat: true,
  commonHealthIssues: true,
  breedingDifficulty: true,
  dietaryNeeds: true,
  housingRequirements: true,
  imageUrl: true,
  isRare: true,
});

export const insertBreedCompatibilitySchema = createInsertSchema(breedCompatibility).pick({
  breed1Id: true,
  breed2Id: true,
  compatibilityScore: true,
  expectedOffspringHealthBonus: true,
  expectedLitterSizeModifier: true,
  expectedTraits: true,
  expectedIssues: true,
  recommendedForBeginners: true,
  notes: true,
  success_rate: true,
  uniqueBreedPair: true,
});

// Extended transaction type with product information for the frontend
export type TransactionWithProduct = Transaction & {
  product: {
    name: string;
    unit: string;
  };
};

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;

export type BulkOrder = typeof bulkOrders.$inferSelect;
export type InsertBulkOrder = z.infer<typeof insertBulkOrderSchema>;

export type SocialShare = typeof socialShares.$inferSelect;
export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;

export type RabbitBreed = typeof rabbitBreeds.$inferSelect;
export type InsertRabbitBreed = z.infer<typeof insertRabbitBreedSchema>;

export type BreedCompatibility = typeof breedCompatibility.$inferSelect;
export type InsertBreedCompatibility = z.infer<typeof insertBreedCompatibilitySchema>;

export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;

export type BreedingEvent = typeof breedingEvents.$inferSelect;
export type InsertBreedingEvent = z.infer<typeof insertBreedingEventSchema>;
