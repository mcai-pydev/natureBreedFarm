// This script is a standalone utility to update the admin user's password
// Run it with: npx tsx update-password.js

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Set WebSocket constructor for NeonDB
neonConfig.webSocketConstructor = ws;

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function updateAdminPassword() {
  // Create a direct database connection
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔐 Generating new password hash...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    console.log('✅ Generated hash:', hashedPassword);
    
    // Update the user using direct SQL (to avoid module resolution issues)
    console.log('🔄 Updating admin user password...');
    const updateResult = await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username',
      [hashedPassword, 'admin']
    );
    
    if (updateResult.rowCount === 0) {
      console.log('❌ No user found with username "admin"');
      
      // Check if we need to create the admin user
      const checkResult = await pool.query('SELECT COUNT(*) FROM users');
      
      if (parseInt(checkResult.rows[0].count) === 0) {
        console.log('📝 Creating admin user since no users exist');
        const insertResult = await pool.query(
          'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, username',
          ['admin', hashedPassword, 'Administrator', 'Admin']
        );
        console.log('✅ Created admin user with ID:', insertResult.rows[0].id);
      }
    } else {
      console.log('✅ Updated user:', updateResult.rows[0].username, 'with ID:', updateResult.rows[0].id);
    }
    
    // Test the password
    const testResult = await pool.query('SELECT password FROM users WHERE username = $1', ['admin']);
    
    if (testResult.rows.length > 0) {
      const storedHash = testResult.rows[0].password;
      const passwordMatch = await bcrypt.compare('admin123', storedHash);
      console.log('🔍 Password verification test:', passwordMatch ? 'PASSED ✅' : 'FAILED ❌');
      console.log('🔒 Stored password hash:', storedHash);
    } else {
      console.log('❌ User not found for verification test');
    }
    
    console.log('✅ Password update process completed');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating password:', error);
    await pool.end();
    process.exit(1);
  }
}

updateAdminPassword();