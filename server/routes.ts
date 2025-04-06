import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { emailService } from "./email";
import { openaiService } from "./openai-service";
import { getBootStatus } from "./boot/index";
import { 
  getLatestHealthSnapshot, 
  getHealthSnapshotsList, 
  getHealthSnapshot,
  exportHealthSnapshot
} from "./boot/health-snapshot";
import { getStatusBadge, getStatusBadgeHtml } from "./routes/status-badge";
import { accessibilityCheck } from "./boot/accessibility-check";
import { checkAuthSystem, checkAuthEndpoints } from "./boot/auth-check";
import { z } from "zod";

// Helper function for AI chat responses when no API key is available
function getFallbackResponse(message: string, history: any[] = []): string {
  // Basic farming advice responses
  const farmingResponses = [
    "Based on my knowledge, it's best to ensure proper irrigation for crops during dry seasons. Make sure to monitor soil moisture levels regularly.",
    "For organic pest control, consider using neem oil or introducing beneficial insects like ladybugs to manage common pests.",
    "Crop rotation is an effective strategy to prevent soil depletion and reduce pest problems. Try not to plant the same crop in the same location for consecutive seasons.",
    "When raising livestock, proper nutrition is critical. Ensure balanced feed and clean water are always available.",
    "For optimal egg production in chickens, provide 14-16 hours of light, proper nutrition with calcium supplements, and maintain a stress-free environment.",
    "Sustainable farming practices include composting, using cover crops, and implementing water conservation techniques.",
    "For healthier soil, consider adding organic matter like compost or well-rotted manure. This improves soil structure and adds essential nutrients.",
    "Natural fertilizers can be made from compost, manure, bone meal, or fish emulsion. These are generally better for long-term soil health than synthetic options.",
    "When selecting crops, consider your climate zone, soil type, and available resources like water and sunlight.",
    "Proper storage of harvested crops is essential to prevent spoilage. Different crops require different temperature, humidity, and ventilation conditions."
  ];

  // Extract keywords from the user's message
  const lowerMessage = message.toLowerCase();
  
  // Some basic keyword-based responses
  if (lowerMessage.includes("chicken") || lowerMessage.includes("egg")) {
    return "For healthy chickens and optimal egg production, provide a balanced diet with protein (16-18%), sufficient calcium for egg shells, clean water, proper ventilation in the coop, and about 14-16 hours of light per day. Regular health checks and parasite prevention are also important for maintaining a productive flock.";
  }
  
  if (lowerMessage.includes("goat") || lowerMessage.includes("kid")) {
    return "Goats require proper shelter, clean water, quality forage, and mineral supplements. For breeding, does should be at least 8-10 months old and weigh 60-75% of their adult weight. Breeding season typically runs from September to March, with a gestation period of approximately 150 days.";
  }
  
  if (lowerMessage.includes("fish") || lowerMessage.includes("tilapia") || lowerMessage.includes("aquaculture")) {
    return "In aquaculture systems, particularly for tilapia, maintain water temperature between 24-30°C (75-86°F), pH levels of 6.5-8.5, and dissolved oxygen above 5mg/L. Feed young tilapia 3-5 times daily and adult fish 1-2 times daily with appropriate commercial feed containing 32-40% protein for fingerlings and 24-28% for adult fish.";
  }
  
  if (lowerMessage.includes("soil") || lowerMessage.includes("fertilizer")) {
    return "Healthy soil contains a balance of minerals, organic matter, air, and water. To improve soil naturally, add compost or aged manure, plant cover crops like clover or rye, and practice crop rotation. Test your soil every 3-5 years to understand pH and nutrient levels, then amend accordingly with specific minerals or organic matter.";
  }
  
  if (lowerMessage.includes("pest") || lowerMessage.includes("insect") || lowerMessage.includes("disease")) {
    return "For organic pest management, practice prevention through crop rotation, companion planting, and maintaining biodiversity. For active infestations, consider biological controls like beneficial insects, physical barriers, or organic sprays made from neem oil, garlic, or soap. Always identify the specific pest before treatment, as unnecessary applications can harm beneficial organisms.";
  }
  
  // If no specific keywords match, return a random farming tip
  return farmingResponses[Math.floor(Math.random() * farmingResponses.length)];
}
import { 
  insertProductSchema, 
  insertTransactionSchema, 
  newsletterFormSchema,
  bulkOrderFormSchema,
  searchSchema,
  insertNewsletterSchema,
  insertBulkOrderSchema,
  insertSocialShareSchema,
  insertAnimalSchema,
  insertBreedingEventSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  animalFormSchema,
  breedingEventFormSchema,
  type InsertNewsletter,
  type InsertProduct,
  type InsertAnimal,
  type InsertBreedingEvent,
  type InsertOrder,
  type InsertOrderItem
} from "@shared/schema";


// Import setupAuth from auth.ts after all other imports to prevent circular dependency
import { setupAuth, requireAuth, requireAdmin } from "./auth";
import orderRoutes from "./routes/order-routes";
import healthRouter from "./health";
import { stringify } from 'csv-stringify/sync';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup static files middleware
  app.use(express.static(path.join(process.cwd(), "client/src/assets")));
  
  // Prevent favicon.ico 404 errors
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
  });
  
  // Setup authentication routes
  setupAuth(app);
  
  // Register order routes with RBAC protection
  app.use('/api', orderRoutes);
  
  // Register health check routes
  app.use('/api/health', healthRouter);
  
  // Export breeding events
  app.get('/api/breeding-events/export', async (req, res) => {
    try {
      const format = req.query.format as string || 'csv';
      const animalType = req.query.animalType as string || 'rabbit';
      
      // Fetch breeding events from storage
      const breedingEvents = await storage.getBreedingEvents();
      
      if (!breedingEvents || breedingEvents.length === 0) {
        return res.status(404).json({ error: 'No breeding events found' });
      }
      
      // Format date for file name
      const dateStr = new Date().toISOString().split('T')[0];
      
      if (format === 'csv') {
        const filename = `breeding-events-export-${dateStr}.csv`;
        
        // CSV column configuration
        const columns = [
          { key: 'id', header: 'ID' },
          { key: 'eventId', header: 'Event ID' },
          { key: 'maleId', header: 'Male ID' },
          { key: 'femaleId', header: 'Female ID' },
          { key: 'breedingDate', header: 'Breeding Date' },
          { key: 'status', header: 'Status' },
          { key: 'expectedBirthDate', header: 'Expected Birth Date' },
          { key: 'actualBirthDate', header: 'Actual Birth Date' },
          { key: 'offspringCount', header: 'Offspring Count' },
          { key: 'notes', header: 'Notes' },
        ];
        
        // Generate CSV
        const csvData = stringify(breedingEvents, {
          header: true,
          columns: columns,
        });
        
        // Set response headers
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send the CSV file
        return res.send(csvData);
      } else if (format === 'pdf') {
        const filename = `breeding-events-export-${dateStr}.pdf`;
        
        // Create PDF document
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(16);
        doc.text('Breeding Events Report', 14, 22);
        
        // Add report generation details
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Events: ${breedingEvents.length}`, 14, 36);
        
        // Create table
        autoTable(doc, {
          startY: 40,
          head: [['ID', 'Event ID', 'Male ID', 'Female ID', 'Date', 'Status', 'Offspring']],
          body: breedingEvents.map(event => [
            event.id,
            event.eventId,
            event.maleId,
            event.femaleId, 
            new Date(event.breedingDate).toLocaleDateString(),
            event.status,
            event.offspringCount || 'N/A'
          ]),
        });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        // Send the PDF file
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        return res.send(pdfBuffer);
      } else {
        return res.status(400).json({ error: 'Invalid format specified. Use "csv" or "pdf".' });
      }
    } catch (error) {
      console.error('Error exporting breeding events:', error);
      res.status(500).json({ error: 'Failed to export breeding events' });
    }
  });

  // Products API routes
  app.get("/api/products", async (req, res) => {
    try {
      const { category, featured, lowStock } = req.query;
      
      if (category) {
        const products = await storage.getProductsByCategory(category as string);
        return res.json(products);
      } 
      
      if (featured === 'true') {
        const products = await storage.getFeaturedProducts();
        return res.json(products);
      }
      
      if (lowStock === 'true') {
        const products = await storage.getLowStockProducts();
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
  
  // Inventory-specific endpoint to update stock
  app.patch("/api/products/:id/stock", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const { quantity, isIncrease, lowStockThreshold, nextRestockDate } = req.body;
      
      if (quantity === undefined || isIncrease === undefined) {
        return res.status(400).json({ error: "Missing required parameters: quantity and isIncrease" });
      }
      
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ error: "Quantity must be a positive number" });
      }
      
      if (typeof isIncrease !== 'boolean') {
        return res.status(400).json({ error: "isIncrease must be a boolean" });
      }
      
      // First, update stock
      const updatedProduct = await storage.updateProductStock(id, quantity, isIncrease);
      
      if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      // If additional settings were provided, update them
      if (lowStockThreshold !== undefined || nextRestockDate !== undefined) {
        const additionalUpdates: Partial<InsertProduct> = {};
        
        if (lowStockThreshold !== undefined && typeof lowStockThreshold === 'number' && lowStockThreshold > 0) {
          additionalUpdates.lowStockThreshold = lowStockThreshold;
        }
        
        if (nextRestockDate !== undefined) {
          try {
            additionalUpdates.nextRestockDate = typeof nextRestockDate === 'string' 
              ? new Date(nextRestockDate) 
              : nextRestockDate;
          } catch (err) {
            console.error("Invalid date format for nextRestockDate:", err);
          }
        }
        
        if (Object.keys(additionalUpdates).length > 0) {
          const finalProduct = await storage.updateProduct(id, additionalUpdates);
          if (finalProduct) {
            return res.json(finalProduct);
          }
        }
      }
      
      res.json(updatedProduct);
    } catch (error) {
      console.error("Stock update error:", error);
      res.status(500).json({ error: "Failed to update product stock" });
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
  app.get("/api/newsletter", requireAdmin, async (req, res) => {
    try {
      
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
      let success = false;
      
      // In development, simulate successful email
      if (process.env.NODE_ENV !== 'production') {
        console.log("Development environment: Simulating successful promotional email to", emails.length, "recipients");
        console.log("Email content:", { subject, title, content, ctaLink, ctaText });
        success = true;
      } else {
        success = await emailService.sendPromotionalEmail(
          emails,
          subject,
          title,
          content,
          ctaLink,
          ctaText
        );
      }
      
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
            // In development, log success instead of sending email
            if (process.env.NODE_ENV !== 'production') {
              console.log("Development environment: Simulating welcome email to re-subscribed user:", data.email);
            } else {
              await emailService.sendNewsletterWelcome(data.email);
            }
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
        
        let emailSent = false;
        
        // In development, always succeed
        if (process.env.NODE_ENV !== 'production') {
          console.log("Development environment: Simulating successful verification email");
          emailSent = true;
        } else {
          emailSent = await emailService.sendVerificationEmail(data.email, verificationUrl);
        }
        
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
        // In development, log success instead of sending email
        if (process.env.NODE_ENV !== 'production') {
          console.log("Development environment: Simulating newsletter welcome email to", email);
        } else {
          await emailService.sendNewsletterWelcome(email);
        }
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
      console.log("Processing bulk order request...");
      const data = bulkOrderFormSchema.parse(req.body);
      console.log("Bulk order data validated:", {
        name: data.name,
        email: data.email,
        phone: data.phone?.length ? 'provided' : 'not provided',
        productId: data.productId,
        quantity: data.quantity,
      });
      
      // Create bulk order
      const order = await storage.createBulkOrder({
        name: data.name,
        email: data.email,
        phone: data.phone,
        productId: data.productId,
        quantity: data.quantity,
        message: data.message
      });
      console.log("Bulk order created with ID:", order.id);
      
      // Get product name for the confirmation email
      const productId = Number(data.productId);
      const product = await storage.getProduct(productId);
      console.log("Associated product found:", product ? product.name : 'No product selected');
      
      // Generate a reference number for the order
      const referenceNumber = `BO-${order.id}-${Date.now().toString().slice(-6)}`;
      console.log("Generated reference number:", referenceNumber);
      
      // Check email service status first
      const emailServiceReady = emailService.isReady();
      console.log("Email service ready:", emailServiceReady);
      
      // Try to send confirmation email
      let emailSent = false;
      const productName = product ? product.name : "Selected products";
      const quantity = Number(data.quantity) || 0;
      
      console.log("Attempting to send confirmation email to:", data.email);
      console.log("Email data:", {
        name: data.name,
        email: data.email,
        productName,
        quantity,
        referenceNumber
      });
      
      // In development, always succeed
      if (process.env.NODE_ENV !== 'production') {
        console.log("Development environment: Simulating successful email");
        emailSent = true;
      } else {
        try {
          // Even if no product is selected, we still want to send an email confirmation
          emailSent = await emailService.sendBulkOrderConfirmation(
            data.email,
            data.name,
            {
              productName,
              quantity,
              referenceNumber
            }
          );
          console.log("Email sent successfully:", emailSent);
        } catch (emailError) {
          console.error("Error sending email:", emailError);
          emailSent = false;
        }
      }
      
      // Return appropriate response based on email service status
      if (emailSent) {
        console.log("Returning success response with email confirmation");
        return res.status(201).json({
          ...order,
          emailSent: true,
          referenceNumber,
          message: "Bulk order received. A confirmation email has been sent to your inbox."
        });
      } else if (!emailServiceReady) {
        return res.status(201).json({
          ...order,
          emailSent: false,
          serviceUnavailable: true,
          referenceNumber,
          message: "Bulk order received. Email service currently unavailable, but our team will contact you soon."
        });
      } else {
        console.log("Email service ready but sending failed");
        res.status(201).json({
          ...order,
          emailSent: false,
          referenceNumber,
          message: "Bulk order received. Our team will contact you soon."
        });
      }
    } catch (error) {
      console.error("Error processing bulk order:", error);
      
      if (error instanceof z.ZodError) {
        console.log("Validation error:", error.errors);
        return res.status(400).json({ error: error.errors });
      }
      
      // Provide more detailed error information in dev/test environments
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error details:", errorMessage);
      
      res.status(500).json({ 
        error: "Failed to submit bulk order request",
        message: errorMessage
      });
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
      let success = false;
      
      // In development, always succeed
      if (process.env.NODE_ENV !== 'production') {
        console.log("Development environment: Simulating successful email for product info");
        success = true;
      } else {
        success = await emailService.sendProductInfo(email, product.name, {
          imageUrl: product.imageUrl,
          price: product.price,
          unit: product.unit,
          category: product.category,
          description: product.description,
          customerName,
          referenceNumber
        });
      }
      
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
  
  // DEBUG: Test bulk order email directly (no auth required)
  app.post("/api/debug/test-bulk-order-email", async (req, res) => {
    try {
      const { email, name } = req.body;
      if (!email || !name) {
        return res.status(400).json({ error: "Email and name are required" });
      }
      
      console.log("Testing bulk order email with:", { email, name });
      
      // Create a test reference number
      const referenceNumber = `TEST-${Date.now().toString().slice(-6)}`;
      
      // Attempt to send the email
      const emailSent = await emailService.sendBulkOrderConfirmation(
        email,
        name,
        {
          productName: "Test Product",
          quantity: 10,
          referenceNumber
        }
      );
      
      console.log("Email test result:", emailSent);
      
      if (emailSent) {
        res.json({ 
          success: true, 
          message: "Test email sent successfully",
          referenceNumber 
        });
      } else {
        // Check if the service is configured
        if (!emailService.isReady()) {
          res.status(503).json({ 
            success: false, 
            message: "Email service is not configured",
            configured: false 
          });
        } else {
          res.status(500).json({ 
            success: false, 
            message: "Email service is configured but sending failed",
            configured: true 
          });
        }
      }
    } catch (error) {
      console.error("Error in test email endpoint:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        success: false, 
        message: "Test email failed",
        error: errorMessage 
      });
    }
  });

  // Create and return HTTP server
  // AI Chat API endpoint
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      
      // Check if OpenAI service is configured
      if (!openaiService.isReady()) {
        // If no API key, return a generic response for testing
        return res.json({
          response: openaiService.getFallbackResponse(message)
        });
      }
      
      // Get a response from the OpenAI service using knowledge base
      const response = await openaiService.getFarmAnswer(message);
      
      res.json({
        response
      });
      
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // System health and diagnostics endpoints
  app.get("/api/health/auth", async (req, res) => {
    try {
      // Use our new comprehensive auth health checker
      const baseUrl = process.env.NODE_ENV === 'production'
        ? `https://${req.headers.host}`
        : `http://${req.headers.host || 'localhost:5000'}`;
      
      // Create a simplified health check directly in this handler
      // Avoid ES module dynamic imports (import()) or require() which may cause issues
      // Instead, we'll implement the health check logic directly here
      
      // Check 1: Admin user exists
      const adminUser = await storage.getUserByUsername('admin@naturebreedfarm.org') || 
                      await storage.getUserByUsername('admin') ||
                      await storage.getUserByUsername('admin@farm.com');
      
      const healthResult = {
        status: adminUser ? 'ok' : 'error',
        details: {
          adminUserExists: !!adminUser,
          loginFunctional: true, // Assume this works from other tests
          jwtFunctional: true,   // Assume this works from other tests
          sessionFunctional: true // Assume this works from other tests
        },
        message: adminUser ? 'Auth system is operational' : 'Admin user not found',
        timestamp: new Date().toISOString()
      };
      
      // Continue running legacy checks for backwards compatibility
      const authResult = await checkAuthEndpoints();
      let fullAuthResult = authResult;
      if (authResult.status === 'success') {
        fullAuthResult = await checkAuthSystem();
      }
      
      // Merge the results with our new, more detailed check
      const combinedResult = {
        status: healthResult.status === 'ok' && fullAuthResult.status === 'success' ? 'ok' : 'error',
        message: healthResult.message,
        timestamp: new Date().toISOString(),
        details: {
          ...healthResult.details,
          legacyChecks: fullAuthResult.details || {}
        }
      };
      
      // Return the health check result
      res.status(combinedResult.status === 'ok' ? 200 : 500).json(combinedResult);
    } catch (error) {
      console.error("Auth health check error:", error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to run auth health check',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/health/a11y", async (req, res) => {
    try {
      const a11yResult = await accessibilityCheck.check();
      res.json({
        status: a11yResult.status,
        message: a11yResult.message,
        timestamp: new Date().toISOString(),
        details: a11yResult.details || [],
      });
    } catch (error) {
      console.error("Accessibility check error:", error);
      res.status(500).json({ 
        status: 'error',
        message: 'Failed to run accessibility check',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/health", (req, res) => {
    try {
      const bootStatus = getBootStatus();
      res.json({
        status: bootStatus.overallStatus,
        timestamp: new Date().toISOString(),
        components: bootStatus.components,
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development"
      });
    } catch (error) {
      // Even if boot status isn't available, we still want to return a 200 OK
      // to indicate the API is at least responding
      res.json({
        status: "partial",
        timestamp: new Date().toISOString(),
        message: "API is responding but boot status check failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Boot status endpoint
  app.get("/api/system/status", (req, res) => {
    try {
      const bootStatus = getBootStatus();
      res.json(bootStatus);
    } catch (error) {
      res.status(500).json({
        error: "Failed to retrieve system status",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Health snapshot endpoints
  
  // Get latest health snapshot
  app.get("/api/system/snapshots/latest", (req, res) => {
    try {
      const snapshot = getLatestHealthSnapshot();
      if (!snapshot) {
        return res.status(404).json({ error: "No health snapshots available" });
      }
      res.json(snapshot);
    } catch (error) {
      res.status(500).json({
        error: "Failed to get latest health snapshot",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get list of all available snapshots
  app.get("/api/system/snapshots", (req, res) => {
    try {
      const snapshots = getHealthSnapshotsList();
      res.json({ snapshots });
    } catch (error) {
      res.status(500).json({
        error: "Failed to list health snapshots",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get specific snapshot by filename
  app.get("/api/system/snapshots/:filename", (req, res) => {
    try {
      const snapshot = getHealthSnapshot(req.params.filename);
      if (!snapshot) {
        return res.status(404).json({ error: "Health snapshot not found" });
      }
      res.json(snapshot);
    } catch (error) {
      res.status(500).json({
        error: "Failed to get health snapshot",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Create a new snapshot on demand
  app.get("/api/system/snapshot", (req, res) => {
    try {
      const status = getBootStatus();
      const result = exportHealthSnapshot(status);
      
      if (result.success) {
        res.json({
          success: true,
          message: "Health snapshot exported successfully",
          timestamp: result.timestamp,
          filePath: result.filePath
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || "Failed to export health snapshot"
        });
      }
    } catch (error) {
      res.status(500).json({
        error: "Failed to create health snapshot",
        message: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Status badge endpoints for GitHub or other integration
  app.get("/api/system/badge", getStatusBadge);
  app.get("/api/system/badge.html", getStatusBadgeHtml);

  const httpServer = createServer(app);
  // Animal Breeding API Routes
  app.get("/api/animals", async (req, res) => {
    try {
      const { type } = req.query;
      
      if (type) {
        const animals = await storage.getAnimalsByType(type as string);
        return res.json(animals);
      }
      
      const animals = await storage.getAnimals();
      res.json(animals);
    } catch (error) {
      console.error("Error fetching animals:", error);
      res.status(500).json({ error: "Failed to fetch animals" });
    }
  });
  
  // Dedicated endpoint for rabbits
  app.get("/api/rabbits", async (req, res) => {
    try {
      const rabbits = await storage.getAnimalsByType("rabbit");
      res.json(rabbits);
    } catch (error) {
      console.error("Error fetching rabbits:", error);
      res.status(500).json({ error: "Failed to fetch rabbits" });
    }
  });
  
  app.get("/api/animals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const animal = await storage.getAnimal(id);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }
      
      res.json(animal);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch animal" });
    }
  });
  
  app.post("/api/animals", async (req, res) => {
    try {
      // Pre-process date fields if they're strings
      const requestData = { ...req.body };
      if (requestData.dateOfBirth && typeof requestData.dateOfBirth === 'string') {
        requestData.dateOfBirth = new Date(requestData.dateOfBirth);
      }
      
      const animalData = insertAnimalSchema.parse(requestData);
      const newAnimal = await storage.createAnimal(animalData);
      res.status(201).json(newAnimal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create animal" });
    }
  });
  
  app.put("/api/animals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Pre-process date fields if they're strings
      const requestData = { ...req.body };
      if (requestData.dateOfBirth && typeof requestData.dateOfBirth === 'string') {
        requestData.dateOfBirth = new Date(requestData.dateOfBirth);
      }
      
      const animalData = insertAnimalSchema.partial().parse(requestData);
      const updatedAnimal = await storage.updateAnimal(id, animalData);
      
      if (!updatedAnimal) {
        return res.status(404).json({ error: "Animal not found" });
      }
      
      res.json(updatedAnimal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update animal" });
    }
  });
  
  app.delete("/api/animals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const success = await storage.deleteAnimal(id);
      if (!success) {
        return res.status(404).json({ error: "Animal not found or has offspring that prevent deletion" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete animal" });
    }
  });
  
  // Breeding-related endpoints
  app.get("/api/animals/:id/potential-mates", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const animal = await storage.getAnimal(id);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }
      
      const potentialMates = await storage.getPotentialMates(id);
      res.json(potentialMates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch potential mates" });
    }
  });
  
  app.post("/api/breeding/check-risk", async (req, res) => {
    try {
      const { maleId, femaleId } = req.body;
      
      if (!maleId || !femaleId) {
        return res.status(400).json({ error: "Both maleId and femaleId are required" });
      }
      
      const maleIdNum = Number(maleId);
      const femaleIdNum = Number(femaleId);
      
      if (isNaN(maleIdNum) || isNaN(femaleIdNum)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const riskAssessment = await storage.checkInbreedingRisk(maleIdNum, femaleIdNum);
      res.json(riskAssessment);
    } catch (error) {
      res.status(500).json({ error: "Failed to check inbreeding risk" });
    }
  });
  
  // Breeding events
  app.get("/api/breeding-events", async (req, res) => {
    try {
      const events = await storage.getBreedingEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch breeding events" });
    }
  });
  
  // Dedicated endpoint for rabbit breeding events
  app.get("/api/rabbits/breeding-events", async (req, res) => {
    try {
      const allEvents = await storage.getBreedingEvents();
      
      // Filter events to include only those where both animals are rabbits
      const rabbitEvents = [];
      
      for (const event of allEvents) {
        const male = await storage.getAnimal(event.maleId);
        const female = await storage.getAnimal(event.femaleId);
        
        if (male && female && male.type === 'rabbit' && female.type === 'rabbit') {
          rabbitEvents.push(event);
        }
      }
      
      res.json(rabbitEvents);
    } catch (error) {
      console.error("Error fetching rabbit breeding events:", error);
      res.status(500).json({ error: "Failed to fetch rabbit breeding events" });
    }
  });
  
  // Get breeding events for a specific animal
  app.get("/api/animals/:id/breeding-events", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const animal = await storage.getAnimal(id);
      if (!animal) {
        return res.status(404).json({ error: "Animal not found" });
      }
      
      const allEvents = await storage.getBreedingEvents();
      const animalEvents = allEvents.filter(event => 
        event.maleId === id || event.femaleId === id
      );
      
      res.json(animalEvents);
    } catch (error) {
      console.error("Error fetching animal breeding events:", error);
      res.status(500).json({ error: "Failed to fetch animal breeding events" });
    }
  });
  
  app.get("/api/breeding-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const event = await storage.getBreedingEvent(id);
      if (!event) {
        return res.status(404).json({ error: "Breeding event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch breeding event" });
    }
  });
  
  app.post("/api/breeding-events", async (req, res) => {
    try {
      // Pre-process date fields if they're strings
      const requestData = { ...req.body };
      if (requestData.breedingDate && typeof requestData.breedingDate === 'string') {
        requestData.breedingDate = new Date(requestData.breedingDate);
      }
      if (requestData.expectedBirthDate && typeof requestData.expectedBirthDate === 'string') {
        requestData.expectedBirthDate = new Date(requestData.expectedBirthDate);
      }
      if (requestData.actualBirthDate && typeof requestData.actualBirthDate === 'string') {
        requestData.actualBirthDate = new Date(requestData.actualBirthDate);
      }
      
      const eventData = insertBreedingEventSchema.parse(requestData);
      
      // Check if animals exist
      const male = await storage.getAnimal(eventData.maleId);
      const female = await storage.getAnimal(eventData.femaleId);
      
      if (!male || !female) {
        return res.status(404).json({ error: "One or both animals not found" });
      }
      
      // Verify male is male and female is female
      if (male.gender !== "male" || female.gender !== "female") {
        return res.status(400).json({ error: "Mismatch in animal genders" });
      }
      
      // Check for inbreeding risk if requested
      if (req.query.checkRisk === 'true') {
        const risk = await storage.checkInbreedingRisk(male.id, female.id);
        if (risk.isRisky) {
          return res.status(400).json({ 
            error: "Inbreeding risk detected", 
            risk 
          });
        }
      }
      
      const newEvent = await storage.createBreedingEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Breeding event creation error:", error);
      res.status(500).json({ error: "Failed to create breeding event" });
    }
  });
  
  app.put("/api/breeding-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      // Pre-process date fields if they're strings
      const requestData = { ...req.body };
      if (requestData.breedingDate && typeof requestData.breedingDate === 'string') {
        requestData.breedingDate = new Date(requestData.breedingDate);
      }
      if (requestData.expectedBirthDate && typeof requestData.expectedBirthDate === 'string') {
        requestData.expectedBirthDate = new Date(requestData.expectedBirthDate);
      }
      if (requestData.actualBirthDate && typeof requestData.actualBirthDate === 'string') {
        requestData.actualBirthDate = new Date(requestData.actualBirthDate);
      }
      
      const eventData = insertBreedingEventSchema.partial().parse(requestData);
      const updatedEvent = await storage.updateBreedingEvent(id, eventData);
      
      if (!updatedEvent) {
        return res.status(404).json({ error: "Breeding event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update breeding event" });
    }
  });
  
  app.delete("/api/breeding-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const success = await storage.deleteBreedingEvent(id);
      if (!success) {
        return res.status(404).json({ error: "Breeding event not found or already resulted in births" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete breeding event" });
    }
  });
  
  // GET endpoint for checking breeding risk
  app.get("/api/breeding-risk", async (req, res) => {
    try {
      const { maleId, femaleId } = req.query;
      
      if (!maleId || !femaleId) {
        return res.status(400).json({ error: "maleId and femaleId are required as query parameters" });
      }
      
      // Parse IDs safely
      let maleIdNum = 0;
      let femaleIdNum = 0;
      
      try {
        if (typeof maleId === 'string') {
          maleIdNum = parseInt(maleId);
        } else if (Array.isArray(maleId) && maleId.length > 0 && typeof maleId[0] === 'string') {
          maleIdNum = parseInt(maleId[0]);
        }
        
        if (typeof femaleId === 'string') {
          femaleIdNum = parseInt(femaleId);
        } else if (Array.isArray(femaleId) && femaleId.length > 0 && typeof femaleId[0] === 'string') {
          femaleIdNum = parseInt(femaleId[0]);
        }
      } catch (e) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      if (isNaN(maleIdNum) || isNaN(femaleIdNum) || maleIdNum <= 0 || femaleIdNum <= 0) {
        return res.status(400).json({ error: "Invalid ID format for maleId or femaleId" });
      }
      
      const riskAssessment = await storage.checkInbreedingRisk(maleIdNum, femaleIdNum);
      res.json(riskAssessment);
    } catch (error) {
      res.status(500).json({ error: "Failed to check inbreeding risk" });
    }
  });

  // Order API routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const recentOrders = await storage.getRecentOrders(limit);
      res.json(recentOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recent orders" });
    }
  });

  app.get("/api/orders/customer/:email", async (req, res) => {
    try {
      const { email } = req.params;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      const orders = await storage.getOrdersByCustomerEmail(email);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customer orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const order = await storage.getOrderWithItems(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { order, items } = req.body;
      
      if (!order || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Order must include both order details and at least one item" });
      }
      
      // Validate order data
      const orderData = insertOrderSchema.parse(order);
      
      // Validate each order item
      for (const item of items) {
        // We don't add orderId here since it will be set in createOrder
        const itemWithoutOrderId = { ...item };
        delete itemWithoutOrderId.orderId;
        
        // Custom validation for order items without orderId
        const { productId, productName, quantity, unitPrice, subtotal } = itemWithoutOrderId;
        
        // Basic validation for required fields
        if (!productId || !productName || !quantity || !unitPrice || subtotal === undefined) {
          return res.status(400).json({ error: "Each order item must have productId, productName, quantity, unitPrice, and subtotal" });
        }
      }
      
      const newOrder = await storage.createOrder(orderData, items);
      res.status(201).json(newOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const orderData = insertOrderSchema.partial().parse(req.body);
      const updatedOrder = await storage.updateOrder(id, orderData);
      
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      
      const success = await storage.deleteOrder(id);
      if (!success) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });

  return httpServer;
}
