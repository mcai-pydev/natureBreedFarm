import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertProductSchema, 
  insertTransactionSchema, 
  newsletterFormSchema,
  bulkOrderFormSchema,
  searchSchema,
  insertNewsletterSchema,
  insertBulkOrderSchema,
  insertSocialShareSchema
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup static files middleware
  app.use(express.static(path.join(process.cwd(), "client/src/assets")));
  
  // Setup authentication routes
  setupAuth(app);

  // Products API routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category, featured } = req.query;
      
      if (category) {
        const products = await storage.getProductsByCategory(category as string);
        return res.json(products);
      } 
      
      if (featured === 'true') {
        const products = await storage.getFeaturedProducts();
        return res.json(products);
      }
      
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const newProduct = await storage.createProduct(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const productData = insertProductSchema.partial().parse(req.body);
      const updatedProduct = await storage.updateProduct(id, productData);
      
      if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Transactions API routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const { type, startDate, endDate } = req.query;
      
      if (type) {
        const transactions = await storage.getTransactionsByType(type as string);
        return res.json(transactions);
      }
      
      if (startDate && endDate) {
        const transactions = await storage.getTransactionsByDate(
          new Date(startDate as string),
          new Date(endDate as string)
        );
        return res.json(transactions);
      }
      
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const transaction = await storage.getTransaction(id);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transaction" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      
      // Check if product exists
      const product = await storage.getProduct(transactionData.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Check if we have enough stock for sales or orders
      if ((transactionData.type === "sale" || transactionData.type === "order") && 
          product.stock < transactionData.quantity) {
        return res.status(400).json({ error: "Not enough stock available" });
      }
      
      const newTransaction = await storage.createTransaction(transactionData);
      res.status(201).json(newTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      
      // If changing product or quantity, check if we have enough stock
      if (transactionData.productId || transactionData.quantity) {
        const existingTransaction = await storage.getTransaction(id);
        if (!existingTransaction) {
          return res.status(404).json({ error: "Transaction not found" });
        }
        
        const productId = transactionData.productId || existingTransaction.productId;
        const product = await storage.getProduct(productId);
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }
        
        const type = transactionData.type || existingTransaction.type;
        const quantity = transactionData.quantity || existingTransaction.quantity;
        
        // For sales or orders, check if we have enough stock
        // (We need to account for the existing transaction's impact on stock)
        if ((type === "sale" || type === "order")) {
          const effectiveStock = product.stock + 
            (existingTransaction.productId === productId && 
             (existingTransaction.type === "sale" || existingTransaction.type === "order") ? 
             existingTransaction.quantity : 0);
             
          if (effectiveStock < quantity) {
            return res.status(400).json({ error: "Not enough stock available" });
          }
        }
      }
      
      const updatedTransaction = await storage.updateTransaction(id, transactionData);
      
      if (!updatedTransaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const success = await storage.deleteTransaction(id);
      if (!success) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });
  
  // Search API route
  app.post("/api/search", async (req, res) => {
    try {
      const { query, filters } = searchSchema.parse(req.body);
      const results = await storage.searchProducts(query, filters);
      res.json(results);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to perform search" });
    }
  });
  
  // Newsletter API routes
  app.get("/api/newsletter", async (req, res) => {
    try {
      // Ensure user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const subscribers = await storage.getNewsletterSubscribers();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch newsletter subscribers" });
    }
  });
  
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const data = newsletterFormSchema.parse(req.body);
      
      // Check if already subscribed
      const existing = await storage.getNewsletterSubscriber(data.email);
      if (existing) {
        if (existing.subscribed) {
          return res.status(400).json({ error: "Email already subscribed" });
        } else {
          // Re-subscribe
          const updated = await storage.updateNewsletterSubscriber(existing.id, { 
            subscribed: true 
          });
          return res.json(updated);
        }
      }
      
      // Create new subscription
      const subscriber = await storage.createNewsletterSubscriber({
        email: data.email,
        name: data.name,
        subscribed: true
      });
      
      res.status(201).json(subscriber);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to subscribe to newsletter" });
    }
  });
  
  app.post("/api/newsletter/unsubscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const subscriber = await storage.getNewsletterSubscriber(email);
      if (!subscriber) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      
      await storage.updateNewsletterSubscriber(subscriber.id, { subscribed: false });
      res.json({ message: "Successfully unsubscribed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });
  
  // Bulk order API routes
  app.get("/api/bulk-orders", async (req, res) => {
    try {
      // Ensure user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const orders = await storage.getBulkOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bulk orders" });
    }
  });
  
  app.post("/api/bulk-orders", async (req, res) => {
    try {
      const data = bulkOrderFormSchema.parse(req.body);
      
      // Create bulk order
      const order = await storage.createBulkOrder({
        name: data.name,
        email: data.email,
        phone: data.phone,
        productId: data.productId,
        quantity: data.quantity,
        message: data.message
      });
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to submit bulk order request" });
    }
  });
  
  app.put("/api/bulk-orders/:id/status", async (req, res) => {
    try {
      // Ensure user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const { status } = req.body;
      if (!status || !["new", "contacted", "completed", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      
      const updated = await storage.updateBulkOrder(id, { status });
      if (!updated) {
        return res.status(404).json({ error: "Bulk order not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bulk order status" });
    }
  });
  
  // Social share API routes
  app.get("/api/products/:id/shares", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const shares = await storage.getSocialShares(id);
      res.json(shares);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch social shares" });
    }
  });
  
  app.post("/api/products/:id/share", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const { platform } = req.body;
      if (!platform) {
        return res.status(400).json({ error: "Platform is required" });
      }
      
      // Record the share
      const share = await storage.createSocialShare({
        productId,
        platform,
        shareCount: 1
      });
      
      res.status(201).json(share);
    } catch (error) {
      res.status(500).json({ error: "Failed to record social share" });
    }
  });
  
  // Analytics API routes
  app.get("/api/analytics/product-distribution", async (req, res) => {
    try {
      // Ensure user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const distribution = await storage.getProductDistribution();
      res.json(distribution);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product distribution" });
    }
  });
  
  app.get("/api/analytics/transaction-summary", async (req, res) => {
    try {
      // Ensure user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start and end dates are required" });
      }
      
      const summary = await storage.getTransactionSummary(
        new Date(startDate as string),
        new Date(endDate as string)
      );
      
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transaction summary" });
    }
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
