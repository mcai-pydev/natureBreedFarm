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
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

// Products table for farm products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  unit: text("unit").notNull(),
  stock: real("stock").notNull(),
  imageUrl: text("image_url"),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  unit: true,
  stock: true,
  imageUrl: true,
});

// Transactions table for purchases, sales, and orders
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(), // "sale", "purchase", "order"
  quantity: real("quantity").notNull(),
  price: real("price").notNull(),
  customer: text("customer"),
  notes: text("notes"),
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  date: true,
  productId: true,
  type: true,
  quantity: true,
  price: true,
  customer: true,
  notes: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Extended transaction type with product information for the frontend
export type TransactionWithProduct = Transaction & {
  product: {
    name: string;
    unit: string;
  };
};
