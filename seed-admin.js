const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// Create a PostgreSQL connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function seedAdminUser() {
  try {
    console.log('🔍 Checking for existing admin user...');
    
    // Check if admin already exists
    const checkQuery = "SELECT * FROM users WHERE username = $1 OR email = $2";
    const checkValues = ["admin", "admin@naturebreedfarm.org"];
    const existingUser = await pool.query(checkQuery, checkValues);
    
    // Hash the admin password
    const hashedPassword = await hashPassword("admin123");
    
    if (existingUser.rows.length > 0) {
      console.log('📝 Admin user already exists, updating credentials...');
      // Update the user with correct credentials
      const updateQuery = `
        UPDATE users 
        SET username = $1, 
            password = $2, 
            email = $3, 
            name = $4, 
            role = $5, 
            "isActive" = $6
        WHERE id = $7
        RETURNING *
      `;
      const updateValues = ["admin", hashedPassword, "admin@naturebreedfarm.org", "System Administrator", "Admin", true, existingUser.rows[0].id];
      const result = await pool.query(updateQuery, updateValues);
      console.log('✅ Admin user updated successfully:', result.rows[0].username);
    } else {
      console.log('📝 Creating new admin user...');
      // Insert a new admin user
      const insertQuery = `
        INSERT INTO users (username, password, email, name, role, permissions, "isActive") 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const permissions = JSON.stringify(["READ_PRODUCT", "CREATE_PRODUCT", "UPDATE_PRODUCT", "DELETE_PRODUCT", "READ_ORDER", "READ_ALL_ORDERS", "CREATE_ORDER", "UPDATE_ORDER", "DELETE_ORDER", "READ_ANIMAL", "CREATE_ANIMAL", "UPDATE_ANIMAL", "DELETE_ANIMAL", "READ_ANALYTICS", "MANAGE_NEWSLETTERS", "MANAGE_BULK_ORDERS"]);
      const insertValues = ["admin", hashedPassword, "admin@naturebreedfarm.org", "System Administrator", "Admin", permissions, true];
      const result = await pool.query(insertQuery, insertValues);
      console.log('✅ Admin user created successfully:', result.rows[0].username);
    }
    
    console.log('🔑 Admin credentials:');
    console.log('Username: admin@naturebreedfarm.org');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await pool.end();
  }
}

seedAdminUser();