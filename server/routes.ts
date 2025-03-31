import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { emailService } from "./email";
import { 
  insertProductSchema, 
  insertTransactionSchema, 
  newsletterFormSchema,
  bulkOrderFormSchema,
  searchSchema,
  insertNewsletterSchema,
  insertBulkOrderSchema,
  insertSocialShareSchema,
  type InsertNewsletter
} from "@shared/schema";
import { z } from "zod";

// Import setupAuth from auth.ts after all other imports to prevent circular dependency
import { setupAuth } from "./auth";

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
      // Pre-process date field if it's a string
      const requestData = { ...req.body };
      if (requestData.date && typeof requestData.date === 'string') {
        requestData.date = new Date(requestData.date);
      }
      
      // Parse with schema validation
      const transactionData = insertTransactionSchema.parse(requestData);
      
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
      console.error("Transaction creation error:", error);
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Pre-process date field if it's a string
      const requestData = { ...req.body };
      if (requestData.date && typeof requestData.date === 'string') {
        requestData.date = new Date(requestData.date);
      }
      
      const transactionData = insertTransactionSchema.partial().parse(requestData);
      
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
  
  // Search API routes
  // POST endpoint for more complex searches with filters
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
  
  // GET endpoint for simple URL-based searches
  app.get("/api/search", async (req, res) => {
    try {
      // Allow empty queries for browsing all products with filters
      const query = req.query.q as string || "";
      
      // Parse filters from query parameters
      const filters: any = {};
      
      if (req.query.category) {
        filters.category = req.query.category as string;
      }
      
      if (req.query.minPrice && !isNaN(Number(req.query.minPrice))) {
        filters.minPrice = Number(req.query.minPrice);
      }
      
      if (req.query.maxPrice && !isNaN(Number(req.query.maxPrice))) {
        filters.maxPrice = Number(req.query.maxPrice);
      }
      
      if (req.query.inStock) {
        filters.inStock = req.query.inStock === "true";
      }
      
      if (req.query.sortBy) {
        const validSortOptions = ['price-asc', 'price-desc', 'name-asc', 'name-desc', 'newest', 'featured'];
        const sortBy = req.query.sortBy as string;
        if (validSortOptions.includes(sortBy)) {
          filters.sortBy = sortBy;
        }
      }
      
      const results = await storage.searchProducts(query, Object.keys(filters).length > 0 ? filters : undefined);
      res.json(results);
    } catch (error) {
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
  
  // Update newsletter subscriber
  app.patch("/api/newsletter/:id", async (req, res) => {
    try {
      // Ensure user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const { subscribed, verified } = req.body;
      if (subscribed === undefined && verified === undefined) {
        return res.status(400).json({ error: "No update parameters provided" });
      }
      
      const updateData: Partial<InsertNewsletter> = {};
      if (subscribed !== undefined) updateData.subscribed = subscribed;
      if (verified !== undefined) updateData.verified = verified;
      
      const updated = await storage.updateNewsletterSubscriber(id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Subscriber not found" });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update subscriber" });
    }
  });
  
  // Get newsletter stats
  app.get("/api/newsletter/stats", async (req, res) => {
    try {
      // Ensure user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const subscribers = await storage.getNewsletterSubscribers();
      const verifiedSubscribers = subscribers.filter(sub => sub.verified && sub.subscribed);
      
      res.json({
        count: verifiedSubscribers.length,
        totalCount: subscribers.length,
        verified: subscribers.filter(sub => sub.verified).length,
        unverified: subscribers.filter(sub => !sub.verified).length,
        subscribed: subscribers.filter(sub => sub.subscribed).length,
        unsubscribed: subscribers.filter(sub => !sub.subscribed).length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch newsletter statistics" });
    }
  });
  
  // Send promotional email to subscribers
  app.post("/api/newsletter/promotional", async (req, res) => {
    try {
      // Ensure user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      // Validate request body
      const { subject, title, content, ctaText, ctaLink } = req.body;
      if (!subject || !title || !content) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      // Check if email service is configured
      if (!emailService.isReady()) {
        return res.status(500).json({ 
          error: "Email service is not configured",
          message: "The email service is not configured. Please configure it in the Email Settings."
        });
      }
      
      // Get all verified and subscribed subscribers
      const subscribers = await storage.getNewsletterSubscribers();
      const emails = subscribers
        .filter(sub => sub.verified && sub.subscribed)
        .map(sub => sub.email);
      
      if (emails.length === 0) {
        return res.status(400).json({ 
          error: "No subscribers",
          message: "There are no verified subscribers to send the email to."
        });
      }
      
      // Send the promotional email
      const success = await emailService.sendPromotionalEmail(
        emails,
        subject,
        title,
        content,
        ctaLink,
        ctaText
      );
      
      if (!success) {
        return res.status(500).json({ 
          error: "Failed to send email",
          message: "There was an error sending the promotional email. Please try again."
        });
      }
      
      res.status(200).json({ 
        success: true,
        message: `Email sent to ${emails.length} subscribers`,
        recipientCount: emails.length
      });
    } catch (error) {
      console.error("Promotional email error:", error);
      res.status(500).json({ error: "Failed to send promotional email" });
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
          
          // Send welcome email
          if (emailService.isReady()) {
            await emailService.sendNewsletterWelcome(data.email);
          }
          
          return res.json(updated);
        }
      }
      
      // Create new subscription as unverified
      const subscriber = await storage.createNewsletterSubscriber({
        email: data.email,
        name: data.name,
        subscribed: true,
        verified: false
      });
      
      // Try to send verification email if email service is configured
      if (emailService.isReady()) {
        const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
        const verificationUrl = `${baseUrl}/api/newsletter/verify`;
        const emailSent = await emailService.sendVerificationEmail(data.email, verificationUrl);
        
        if (emailSent) {
          return res.status(201).json({
            ...subscriber,
            verificationSent: true,
            message: "Verification email sent. Please check your inbox."
          });
        } else {
          // Email service is configured but sending failed
          return res.status(201).json({
            ...subscriber,
            verificationSent: false,
            message: "Subscription recorded but verification email could not be sent. Our team will contact you shortly."
          });
        }
      }
      
      // Email service not configured
      return res.status(201).json({
        ...subscriber,
        serviceUnavailable: true,
        verificationSent: false,
        message: "Subscription recorded, but email verification service is currently unavailable."
      });
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
  
  // Email verification endpoint
  app.get("/api/newsletter/verify", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ error: "Verification token is required" });
      }
      
      // Verify the token
      const email = emailService.verifyEmailToken(token as string);
      if (!email) {
        return res.status(400).json({ 
          error: "Invalid or expired verification token",
          details: "The verification link may have expired or been used already. Please request a new verification link."
        });
      }
      
      // Find the subscriber
      const subscriber = await storage.getNewsletterSubscriber(email);
      if (!subscriber) {
        return res.status(404).json({ error: "Subscription not found" });
      }
      
      // Update subscriber to verified
      await storage.updateNewsletterSubscriber(subscriber.id, { verified: true });
      
      // Send welcome email
      if (emailService.isReady()) {
        await emailService.sendNewsletterWelcome(email);
      }
      
      // Redirect to a success page or return a success response
      // For API, return a success message
      res.json({ 
        success: true, 
        message: "Your email has been successfully verified. Thank you for subscribing to our newsletter." 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify email" });
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
      
      // Get product name for the confirmation email
      const productId = Number(data.productId);
      const product = await storage.getProduct(productId);
      
      // Generate a reference number for the order
      const referenceNumber = `BO-${order.id}-${Date.now().toString().slice(-6)}`;
      
      // Try to send confirmation email if product exists
      let emailSent = false;
      if (product) {
        emailSent = await emailService.sendBulkOrderConfirmation(
          data.email,
          data.name,
          {
            productName: product.name,
            quantity: Number(data.quantity),
            referenceNumber
          }
        );
      }
      
      // Return appropriate response based on email service status
      if (emailSent) {
        return res.status(201).json({
          ...order,
          emailSent: true,
          referenceNumber,
          message: "Bulk order received. A confirmation email has been sent to your inbox."
        });
      } else if (!emailService.isReady()) {
        return res.status(201).json({
          ...order,
          emailSent: false,
          serviceUnavailable: true,
          referenceNumber,
          message: "Bulk order received. Email service currently unavailable, but our team will contact you soon."
        });
      } else {
        res.status(201).json({
          ...order,
          emailSent: false,
          referenceNumber,
          message: "Bulk order received. Our team will contact you soon."
        });
      }
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
  
  // Send product information via email
  app.post("/api/products/:id/send-info", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const { email, name } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Fetch the product
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // Check if email service is configured
      // We'll still proceed even if email service is not configured,
      // but we'll return a different response if sending fails
      
      // Try to get the newsletter subscriber info for personalization
      const subscriber = await storage.getNewsletterSubscriber(email);
      const customerName = name || (subscriber?.name || "Valued Customer");
      
      // Create a reference number for tracking
      const referenceNumber = `PI-${Date.now().toString().slice(-6)}`;
      
      // Send the product information email
      const success = await emailService.sendProductInfo(email, product.name, {
        imageUrl: product.imageUrl,
        price: product.price,
        unit: product.unit,
        category: product.category,
        description: product.description,
        customerName,
        referenceNumber
      });
      
      if (success) {
        // If they're not already a newsletter subscriber, suggest they sign up
        const isSubscriber = subscriber && subscriber.subscribed;
        
        res.json({ 
          success: true, 
          message: "Product information has been sent to your email",
          isSubscriber,
          referenceNumber
        });
      } else {
        // Check if the failure is due to unconfigured email service
        if (!emailService.isReady()) {
          return res.status(503).json({ 
            error: "Email service not available", 
            message: "Email service is not yet configured. Your product request has been recorded with reference: " + referenceNumber,
            referenceNumber,
            serviceUnavailable: true
          });
        } else {
          res.status(500).json({ error: "Failed to send product information" });
        }
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to process request" });
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
  
  // Email service configuration endpoint (Admin only)
  app.post("/api/settings/email", async (req, res) => {
    try {
      // Ensure user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const { host, port, secure, user, pass } = req.body;
      
      // Validate required fields
      if (!host || !port || user === undefined || pass === undefined) {
        return res.status(400).json({ error: "Missing required email configuration" });
      }
      
      // Configure the email service
      const success = emailService.configure({
        host,
        port: Number(port),
        secure: Boolean(secure),
        auth: {
          user,
          pass
        }
      });
      
      if (success) {
        res.json({ message: "Email service configured successfully" });
      } else {
        res.status(500).json({ error: "Failed to configure email service" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to configure email service" });
    }
  });
  
  // Email service status endpoint
  app.get("/api/settings/email/status", async (req, res) => {
    try {
      // Ensure user is authenticated and has admin role
      if (!req.isAuthenticated() || req.user.role !== "Admin") {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      const isReady = emailService.isReady();
      res.json({ configured: isReady });
    } catch (error) {
      res.status(500).json({ error: "Failed to get email service status" });
    }
  });
  
  // DEBUG: Email service status endpoint (no auth required)
  app.get("/api/debug/email-status", async (req, res) => {
    try {
      const isReady = emailService.isReady();
      res.json({ 
        configured: isReady,
        transporter: isReady ? "Configured" : "Not configured"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get email service status" });
    }
  });

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
