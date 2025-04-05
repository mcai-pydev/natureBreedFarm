import { pgTable, serial, text, timestamp, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enhanced animal table specifically for rabbits
export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  
  // Basic info
  animalId: text("animal_id").notNull().unique(), // Custom ID like M1, F1
  name: text("name").notNull(),
  type: text("type").notNull().default("rabbit"), // Always "rabbit" for this micro-app
  breed: text("breed"),
  breedId: integer("breed_id"),
  secondaryBreedId: integer("secondary_breed_id"),
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
  litterSize: integer("litter_size"), // Average litter size
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
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // Tracking specific traits for this animal
  traits: text("traits").array(),
});

export const insertAnimalSchema = createInsertSchema(animals).pick({
  animalId: true,
  name: true,
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
  traits: true,
});

// Breeding events table
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
  weanDate: timestamp("wean_date"), // When kits were weaned
  
  // Outcome
  status: text("status").default("pending").notNull(), // pending, successful, unsuccessful, cancelled
  successRating: integer("success_rating"), // 1-10 subjective rating of success
  wasPlanned: boolean("was_planned").default(true),
  
  // Offspring details
  expectedOffspringCount: integer("expected_offspring_count"), // Predicted litter size
  actualOffspringCount: integer("actual_offspring_count"), // Actual litter size at birth
  offspringCount: integer("offspring_count").default(0), // Number surviving to wean
  offspringIds: text("offspring_ids").array(), // Array of IDs for quick reference
  maleWeight: real("male_weight"), // Male weight at time of breeding
  femaleWeight: real("female_weight"), // Female weight at time of breeding
  expectedWeightGain: real("expected_weight_gain"), // Expected doe weight gain during pregnancy
  actualWeightGain: real("actual_weight_gain"), // Actual weight gain
  
  // Predictive metrics
  geneticCompatibilityScore: integer("genetic_compatibility_score"), // 1-100 compatibility score
  predictedLitterSize: integer("predicted_litter_size"), // Predicted number of kits
  predictedOffspringHealth: integer("predicted_offspring_health"), // Predicted health score 1-100
  predictedROI: real("predicted_roi"), // Predicted return on investment
  actualROI: real("actual_roi"), // Actual ROI after sale/weaning
  
  // Notes and metadata
  notes: text("notes"),
  tags: text("tags").array(),
  breedingPurpose: text("breeding_purpose").default("commercial"), // commercial, show, pets, research
  images: text("images").array(),
  createdBy: integer("created_by"),
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
  weanDate: true,
  status: true,
  successRating: true,
  wasPlanned: true,
  expectedOffspringCount: true,
  actualOffspringCount: true,
  offspringCount: true,
  offspringIds: true,
  maleWeight: true,
  femaleWeight: true,
  geneticCompatibilityScore: true,
  predictedLitterSize: true,
  predictedOffspringHealth: true,
  predictedROI: true,
  notes: true,
  breedingPurpose: true,
  tags: true,
  images: true,
});

// Create validation schema for breeding risk check
export const breedingRiskCheckSchema = z.object({
  maleId: z.number().int().positive(),
  femaleId: z.number().int().positive(),
});

// Create validation schema for potential mates query
export const potentialMatesSchema = z.object({
  animalId: z.number().int().positive(),
});

// Type definitions
export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;
export type BreedingEvent = typeof breedingEvents.$inferSelect;
export type InsertBreedingEvent = z.infer<typeof insertBreedingEventSchema>;
export type BreedingRiskCheck = z.infer<typeof breedingRiskCheckSchema>;
export type PotentialMatesQuery = z.infer<typeof potentialMatesSchema>;