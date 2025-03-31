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
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNewsletterSchema = createInsertSchema(newsletters).pick({
  email: true,
  name: true,
  subscribed: true,
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
