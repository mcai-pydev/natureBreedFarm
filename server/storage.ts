import { 
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  transactions, type Transaction, type InsertTransaction,
  newsletters, type Newsletter, type InsertNewsletter,
  bulkOrders, type BulkOrder, type InsertBulkOrder,
  socialShares, type SocialShare, type InsertSocialShare,
  type TransactionWithProduct,
  searchSchema
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

// Create MemoryStore for session storage
const MemoryStore = createMemoryStore(session);

// Function for hashing passwords (duplicated from auth.ts for sample data)
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
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
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
  
  currentUserId: number;
  currentProductId: number;
  currentTransactionId: number;
  currentNewsletterId: number;
  currentBulkOrderId: number;
  currentSocialShareId: number;
  
  sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.transactions = new Map();
    this.newsletters = new Map();
    this.bulkOrders = new Map();
    this.socialShares = new Map();
    
    this.currentUserId = 1;
    this.currentProductId = 1;
    this.currentTransactionId = 1;
    this.currentNewsletterId = 1;
    this.currentBulkOrderId = 1;
    this.currentSocialShareId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
    
    // Add sample data for testing
    this.initSampleData();
    
    console.log("Storage initialized with test admin user (admin/admin123)");
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
    const product: Product = { 
      ...insertProduct, 
      id,
      description: insertProduct.description || null,
      salePrice: insertProduct.salePrice || null,
      stockQuantity: insertProduct.stockQuantity || insertProduct.stock,
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
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
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
        await this.updateProduct(product.id, { 
          stock: product.stock - transaction.quantity,
          stockQuantity: (product.stockQuantity || product.stock) - transaction.quantity
        });
      } else if (transaction.type === "purchase") {
        await this.updateProduct(product.id, { 
          stock: product.stock + transaction.quantity,
          stockQuantity: (product.stockQuantity || product.stock) + transaction.quantity
        });
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
          await this.updateProduct(oldProduct.id, { 
            stock: oldProduct.stock + existingTransaction.quantity,
            stockQuantity: (oldProduct.stockQuantity || oldProduct.stock) + existingTransaction.quantity
          });
        } else if (existingTransaction.type === "purchase") {
          await this.updateProduct(oldProduct.id, { 
            stock: oldProduct.stock - existingTransaction.quantity,
            stockQuantity: (oldProduct.stockQuantity || oldProduct.stock) - existingTransaction.quantity
          });
        }
      }
      
      // Apply new transaction's effect on stock
      const productId = transactionUpdate.productId || existingTransaction.productId;
      const quantity = transactionUpdate.quantity || existingTransaction.quantity;
      const type = transactionUpdate.type || existingTransaction.type;
      
      const newProduct = await this.getProduct(productId);
      if (newProduct) {
        if (type === "sale" || type === "order") {
          await this.updateProduct(newProduct.id, { 
            stock: newProduct.stock - quantity,
            stockQuantity: (newProduct.stockQuantity || newProduct.stock) - quantity
          });
        } else if (type === "purchase") {
          await this.updateProduct(newProduct.id, { 
            stock: newProduct.stock + quantity,
            stockQuantity: (newProduct.stockQuantity || newProduct.stock) + quantity
          });
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
        await this.updateProduct(product.id, { 
          stock: product.stock + transaction.quantity,
          stockQuantity: (product.stockQuantity || product.stock) + transaction.quantity
        });
      } else if (transaction.type === "purchase") {
        await this.updateProduct(product.id, { 
          stock: product.stock - transaction.quantity,
          stockQuantity: (product.stockQuantity || product.stock) - transaction.quantity
        });
      }
    }
    
    return this.transactions.delete(id);
  }
  
  // Newsletter methods
  async getNewsletterSubscribers(): Promise<Newsletter[]> {
    return Array.from(this.newsletters.values());
  }
  
  async getNewsletterSubscriber(email: string): Promise<Newsletter | undefined> {
    return Array.from(this.newsletters.values()).find(sub => sub.email === email);
  }
  
  async createNewsletterSubscriber(subscriber: InsertNewsletter): Promise<Newsletter> {
    const id = this.currentNewsletterId++;
    const newSubscriber: Newsletter = {
      ...subscriber,
      id,
      name: subscriber.name || null,
      subscribed: subscriber.subscribed ?? true,
      verified: subscriber.verified ?? false,
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
      phone: order.phone || null,
      productId: order.productId || null,
      quantity: order.quantity || null,
      status: "new",
      createdAt: new Date()
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
      id,
      productId: share.productId !== undefined ? share.productId : null,
      platform: share.platform,
      shareCount: share.shareCount || 1,
      lastShared: new Date()
    };
    this.socialShares.set(id, newShare);
    return newShare;
  }
  
  async updateSocialShare(id: number, share: Partial<InsertSocialShare>): Promise<SocialShare | undefined> {
    const existing = this.socialShares.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...share, lastShared: new Date() };
    this.socialShares.set(id, updated);
    return updated;
  }
  
  // Analytics methods
  async getProductDistribution(): Promise<{ category: string, count: number }[]> {
    const products = Array.from(this.products.values());
    const categoryCount = new Map<string, number>();
    
    products.forEach(product => {
      const category = product.category || 'uncategorized';
      const count = categoryCount.get(category) || 0;
      categoryCount.set(category, count + 1);
    });
    
    return Array.from(categoryCount.entries()).map(([category, count]) => ({
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
    
    return {
      totalSales: transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.price * t.quantity, 0),
      totalPurchases: transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.price * t.quantity, 0),
      totalOrders: transactions.filter(t => t.type === 'order').reduce((sum, t) => sum + t.price * t.quantity, 0),
      totalAuctions: transactions.filter(t => t.type === 'auction').reduce((sum, t) => sum + t.price * t.quantity, 0)
    };
  }

  // Initialize sample data for testing
  private async initSampleData() {
    // Add admin user with Chief Ijeh avatar
    const hashedPassword = await hashPassword("admin123");
    await this.createUser({
      username: "admin",
      password: hashedPassword,
      name: "Chief Ijeh",
      role: "Admin",
      avatar: "/assets/chief-ijeh.jpg"
    });
    
    // Sample products
    const tomatoes = await this.createProduct({
      name: "Organic Tomatoes",
      description: "Fresh farm tomatoes",
      price: 4.50,
      unit: "kg",
      stock: 120,
      category: "produce",
      imageUrl: "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    });
    
    const eggs = await this.createProduct({
      name: "Fresh Eggs",
      description: "Free-range chicken eggs",
      price: 6.00,
      unit: "dozen",
      stock: 45,
      category: "dairy",
      imageUrl: "https://images.unsplash.com/photo-1573246123716-6b1782bfc499?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    });
    
    const lettuce = await this.createProduct({
      name: "Organic Lettuce",
      description: "Fresh green lettuce",
      price: 3.25,
      unit: "head",
      stock: 78,
      category: "produce",
      imageUrl: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    });
    
    const honey = await this.createProduct({
      name: "Raw Honey",
      description: "Pure unfiltered honey",
      price: 12.00,
      unit: "jar",
      stock: 32,
      category: "specialty",
      imageUrl: "https://images.unsplash.com/photo-1528825871115-3581a5387919?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    });
    
    // Animal products
    const goat = await this.createProduct({
      name: "Goat",
      description: "Healthy farm-raised goats",
      price: 250.00,
      unit: "head",
      stock: 15,
      category: "livestock",
      imageUrl: "https://images.unsplash.com/photo-1560468660-6c11a19d7330?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    });
    
    const fish = await this.createProduct({
      name: "Fish",
      description: "Fresh farm-raised tilapia",
      price: 8.50,
      unit: "kg",
      stock: 85,
      category: "seafood",
      imageUrl: "https://images.unsplash.com/photo-1534177616072-ef7dc120449d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    });
    
    const duck = await this.createProduct({
      name: "Duck",
      description: "Free-range farm ducks",
      price: 22.00,
      unit: "head",
      stock: 28,
      category: "poultry",
      imageUrl: "https://images.unsplash.com/photo-1597207047705-52b3d6741136?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    });
    
    const chicken = await this.createProduct({
      name: "Chicken",
      description: "Free-range broiler chickens",
      price: 15.00,
      unit: "head",
      stock: 45,
      category: "poultry",
      imageUrl: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    });
    
    // Sample Transactions
    
    // Sales
    await this.createTransaction({
      productId: tomatoes.id,
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      quantity: 25,
      price: 4.50,
      type: "sale",
      status: "completed",
      notes: "Regular customer order"
    });
    
    await this.createTransaction({
      productId: eggs.id,
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      quantity: 10,
      price: 6.00,
      type: "sale",
      status: "completed",
      notes: "Local restaurant weekly order"
    });
    
    await this.createTransaction({
      productId: fish.id,
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      quantity: 15,
      price: 8.50,
      type: "sale",
      status: "completed",
      notes: "Weekend market sales"
    });
    
    // Purchases
    await this.createTransaction({
      productId: chicken.id,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      quantity: 20,
      price: 10.00, // Purchase price
      type: "purchase",
      status: "completed",
      notes: "Restocking after market day"
    });
    
    await this.createTransaction({
      productId: honey.id,
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      quantity: 15,
      price: 8.00, // Purchase price
      type: "purchase",
      status: "completed",
      notes: "Purchased from local supplier"
    });
    
    // Orders (future sales)
    await this.createTransaction({
      productId: goat.id,
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days in future
      quantity: 5,
      price: 250.00,
      type: "order",
      status: "pending",
      notes: "Order for upcoming festival"
    });
    
    await this.createTransaction({
      productId: duck.id,
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days in future
      quantity: 10,
      price: 22.00,
      type: "order",
      status: "pending",
      notes: "Restaurant bulk order"
    });
    
    // Auction sales
    await this.createTransaction({
      productId: chicken.id,
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
      quantity: 15,
      price: 18.00, // Auction starting price
      type: "auction",
      status: "scheduled",
      notes: "Monthly livestock auction"
    });
    
    await this.createTransaction({
      productId: goat.id,
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days in future
      quantity: 8,
      price: 280.00, // Auction starting price
      type: "auction",
      status: "scheduled",
      notes: "Premium goat auction"
    });
    
    // Add some bulk orders
    await this.createBulkOrder({
      name: "John Restaurant",
      email: "john@restaurant.com",
      phone: "555-123-4567",
      message: "Interested in ordering 20kg of tomatoes weekly for our restaurant.",
      productId: tomatoes.id,
      quantity: 20,
      status: "pending"
    });
    
    await this.createBulkOrder({
      name: "City Market",
      email: "orders@citymarket.com",
      phone: "555-987-6543",
      message: "Looking for regular supply of free-range eggs for our gourmet section.",
      productId: eggs.id,
      quantity: 50,
      status: "pending"
    });
  }
}

export const storage = new MemStorage();
