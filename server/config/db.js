const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    console.log(`[DB] ========================================`);
    console.log(`[DB] Attempting to connect to MongoDB...`);
    console.log(`[DB] Connection string: ${env.mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
    
    // Extract database name from connection string for verification
    const dbNameMatch = env.mongoUri.match(/\/([^/?]+)(\?|$)/);
    const dbNameFromUri = dbNameMatch ? dbNameMatch[1] : 'unknown';
    console.log(`[DB] Database name from URI: ${dbNameFromUri}`);
    
    const conn = await mongoose.connect(env.mongoUri);
    console.log(`[DB] ========================================`);
    console.log(`[DB] ✅ MongoDB connected successfully!`);
    console.log(`[DB] Database name: ${conn.connection.name}`);
    console.log(`[DB] Host: ${conn.connection.host}`);
    console.log(`[DB] Port: ${conn.connection.port || 'N/A (Atlas)'}`);
    console.log(`[DB] ========================================`);
    
    // Verify database name matches
    if (conn.connection.name !== dbNameFromUri) {
      console.warn(`[DB] ⚠️  WARNING: Database name mismatch!`);
      console.warn(`[DB] Expected from URI: ${dbNameFromUri}`);
      console.warn(`[DB] Actual connected: ${conn.connection.name}`);
      console.warn(`[DB] Make sure MongoDB Compass is connected to: ${conn.connection.name}`);
    }
    
    // Log collection names after connection
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`[DB] Available collections: ${collections.map(c => c.name).join(', ') || 'None (database is empty)'}`);
    console.log(`[DB] ========================================`);
    console.log(`[DB] IMPORTANT: Ensure MongoDB Compass is connected to database: "${conn.connection.name}"`);
    console.log(`[DB] ========================================`);
  } catch (error) {
    console.error(`[DB] ========================================`);
    console.error(`[DB] ❌ MongoDB connection error: ${error.message}`);
    console.error(`[DB] Error details:`, error);
    console.error(`[DB] ========================================`);
    // Don't exit the process - server should continue running
    console.log('[DB] Server continuing without database connection');
  }
};

module.exports = connectDB;