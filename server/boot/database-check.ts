/**
 * Database connection check and seed utility
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import { storage } from '../storage';
import { products } from '@shared/schema';

// Check database connection
export async function checkDatabase() {
  try {
    // Test query to check database connection
    await db.execute(sql`SELECT 1 AS result`);
    
    // Additional check: verify tables exist
    try {
      const tableCount = await db.select({ count: sql<number>`count(*)` })
        .from(products);
      
      return {
        success: true,
        message: 'Database connection successful',
        details: { tables: { products: !!tableCount } }
      };
    } catch (error) {
      // If table check fails, database might be empty or tables not migrated
      return {
        success: true,
        message: 'Database connected but schema may need migration',
        details: { error: error instanceof Error ? error.message : String(error) }
      };
    }
  } catch (error) {
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Seed sample data if database is empty
export async function seedSampleData() {
  try {
    // Check if products table exists and has data
    const productsCount = await db.select({ count: sql<number>`count(*)` })
      .from(products);
    
    const count = Number(productsCount[0]?.count || '0');
    
    if (count === 0) {
      console.log('🌱 Database needs sample data - seeding...');
      
      // Use storage layer to seed data
      // This ensures we follow the same pattern as the rest of the application
      const sampleProducts = [
        {
          name: 'Live Chicken',
          description: 'Healthy free-range chicken',
          price: 15.99,
          unit: 'each',
          stock: 30,
          stockQuantity: 30,
          lowStockThreshold: 10,
          stockStatus: 'normal',
          category: 'chicken',
          imageUrl: '/chicken.jpg',
          featured: true
        },
        {
          name: 'Goat',
          description: 'Healthy adult goat ready for breeding',
          price: 250,
          unit: 'each',
          stock: 10,
          stockQuantity: 10,
          lowStockThreshold: 3,
          stockStatus: 'normal',
          category: 'goat',
          imageUrl: '/goat.jpg',
          featured: true
        },
        {
          name: 'Rabbit',
          description: 'Young healthy rabbit',
          price: 35.99,
          unit: 'each',
          stock: 25,
          stockQuantity: 25,
          lowStockThreshold: 5,
          stockStatus: 'normal',
          category: 'rabbit',
          imageUrl: '/rabbit.jpg',
          featured: false
        },
        {
          name: 'Duck',
          description: 'Farm-raised duck',
          price: 22.50,
          unit: 'each',
          stock: 15,
          stockQuantity: 15,
          lowStockThreshold: 3,
          stockStatus: 'normal',
          category: 'duck',
          imageUrl: '/duck.jpg',
          featured: false
        },
        {
          name: 'Snail',
          description: 'Giant African land snail',
          price: 8.99,
          unit: 'each',
          stock: 100,
          stockQuantity: 100,
          lowStockThreshold: 20,
          stockStatus: 'normal',
          category: 'snail',
          imageUrl: '/snail.jpg',
          featured: false
        },
        {
          name: 'Fish Fingerlings',
          description: 'Young fish for stocking ponds',
          price: 2.50,
          unit: 'each',
          stock: 500,
          stockQuantity: 500,
          lowStockThreshold: 100,
          stockStatus: 'normal',
          category: 'fish',
          imageUrl: '/fish.jpg',
          featured: true
        }
      ];
      
      // Use the bulk insert from drizzle
      await db.insert(products).values(sampleProducts);
      
      return {
        success: true,
        message: `Sample data seeded successfully with ${sampleProducts.length} products`,
        details: { productCount: sampleProducts.length }
      };
    }
    
    return {
      success: true,
      message: `Database already has ${count} products, no seeding needed`,
      details: { productCount: count }
    };
  } catch (error) {
    console.error('Error seeding data:', error);
    return {
      success: false,
      message: `Error seeding data: ${error instanceof Error ? error.message : String(error)}`,
      details: { error }
    };
  }
}