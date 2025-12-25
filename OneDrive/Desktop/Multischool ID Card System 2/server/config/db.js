const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    console.log(`[DB] Attempting to connect to MongoDB...`);
    console.log(`[DB] Connection string: ${env.mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Hide credentials in logs
    const conn = await mongoose.connect(env.mongoUri);
    console.log(`[DB] MongoDB connected successfully!`);
    console.log(`[DB] Database name: ${conn.connection.name}`);
    console.log(`[DB] Host: ${conn.connection.host}`);
    
    // Log collection names after connection
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`[DB] Available collections: ${collections.map(c => c.name).join(', ') || 'None (database is empty)'}`);
  } catch (error) {
    console.error(`[DB] MongoDB connection error: ${error.message}`);
    console.error(`[DB] Error details:`, error);
    // Don't exit the process - server should continue running
    console.log('[DB] Server continuing without database connection');
  }
};

module.exports = connectDB;