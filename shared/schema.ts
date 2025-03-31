import { pgTable, text, serial, integer, boolean, real, timestamp, varchar } from "drizzle-orm/pg-core";
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

export type Animal = typeof animals.$inferSelect;
export type InsertAnimal = z.infer<typeof insertAnimalSchema>;

export type BreedingEvent = typeof breedingEvents.$inferSelect;
export type InsertBreedingEvent = z.infer<typeof insertBreedingEventSchema>;

// Extended transaction type with product information for the frontend
export type TransactionWithProduct = Transaction & {
  product: {
    name: string;
    unit: string;
  };
};

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

// Animal form validation schema
export const animalFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.string().min(2, "Animal type is required"),
  breed: z.string().optional(),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.date().optional(),
  fatherId: z.number().optional().nullable(),
  motherId: z.number().optional().nullable(),
  status: z.enum(["active", "sold", "deceased"]).default("active"),
  notes: z.string().optional(),
  imageUrl: z.string().optional(),
});

// Breeding event form validation schema
export const breedingEventFormSchema = z.object({
  maleId: z.number().min(1, "Male animal is required"),
  femaleId: z.number().min(1, "Female animal is required"),
  breedingDate: z.date().default(() => new Date()),
  expectedBirthDate: z.date().optional(),
  actualBirthDate: z.date().optional(),
  offspringCount: z.number().optional(),
  status: z.enum(["pending", "successful", "unsuccessful"]).default("pending"),
  notes: z.string().optional(),
});

// Animal breeding tracking tables
export const animals = pgTable("animals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // rabbit, goat, chicken, etc.
  breed: text("breed"),
  gender: text("gender").notNull(), // male, female
  dateOfBirth: timestamp("date_of_birth"),
  fatherId: integer("father_id"), // Will reference animals table ID
  motherId: integer("mother_id"), // Will reference animals table ID
  status: text("status").default("active").notNull(), // active, sold, deceased
  notes: text("notes"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAnimalSchema = createInsertSchema(animals).pick({
  name: true,
  type: true,
  breed: true,
  gender: true,
  dateOfBirth: true,
  fatherId: true,
  motherId: true,
  status: true,
  notes: true,
  imageUrl: true,
});

export const breedingEvents = pgTable("breeding_events", {
  id: serial("id").primaryKey(),
  maleId: integer("male_id").references(() => animals.id).notNull(),
  femaleId: integer("female_id").references(() => animals.id).notNull(),
  breedingDate: timestamp("breeding_date").defaultNow().notNull(),
  expectedBirthDate: timestamp("expected_birth_date"),
  actualBirthDate: timestamp("actual_birth_date"),
  offspringCount: integer("offspring_count"),
  status: text("status").default("pending").notNull(), // pending, successful, unsuccessful
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBreedingEventSchema = createInsertSchema(breedingEvents).pick({
  maleId: true,
  femaleId: true,
  breedingDate: true,
  expectedBirthDate: true,
  actualBirthDate: true,
  offspringCount: true,
  status: true,
  notes: true,
});
