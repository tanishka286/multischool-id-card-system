const mongoose = require('mongoose');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * TEMPORARY VERIFICATION ROUTE - REMOVE AFTER VERIFICATION
 * 
 * This route inserts a test document to verify MongoDB Atlas writes.
 * It will be removed after confirming data appears in MongoDB Compass.
 */
const verifyMongoWrite = asyncHandler(async (req, res) => {
  const connection = mongoose.connection;
  
  // Log connection details
  const dbInfo = {
    readyState: connection.readyState,
    state: ['disconnected', 'connected', 'connecting', 'disconnecting'][connection.readyState] || 'unknown',
    dbName: connection.name,
    host: connection.host,
    port: connection.port,
    mongoUri: connection.client?.s?.url || 'N/A'
  };

  console.log('[VERIFY] ========================================');
  console.log('[VERIFY] MongoDB Connection Verification');
  console.log('[VERIFY] ========================================');
  console.log('[VERIFY] Database Name:', dbInfo.dbName);
  console.log('[VERIFY] Host:', dbInfo.host);
  console.log('[VERIFY] Port:', dbInfo.port);
  console.log('[VERIFY] Connection State:', dbInfo.state);
  console.log('[VERIFY] Ready State:', dbInfo.readyState);
  console.log('[VERIFY] ========================================');

  if (connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database not connected',
      message: `Connection state: ${dbInfo.state}`,
      dbInfo
    });
  }

  try {
    // Create a test user document
    const testUser = {
      name: 'MongoDB Verification Test',
      email: `verify-${Date.now()}@test.com`,
      username: `verify-${Date.now()}`,
      passwordHash: 'verification-test-hash',
      role: 'Superadmin', // Superadmin doesn't require schoolId
      status: 'active'
    };

    console.log('[VERIFY] Attempting to insert test document...');
    console.log('[VERIFY] Document:', JSON.stringify(testUser, null, 2));

    // Insert the document
    const insertedUser = await User.create(testUser);

    console.log('[VERIFY] ========================================');
    console.log('[VERIFY] ✅ Document inserted successfully!');
    console.log('[VERIFY] Document ID:', insertedUser._id);
    console.log('[VERIFY] Database:', dbInfo.dbName);
    console.log('[VERIFY] Collection: users');
    console.log('[VERIFY] ========================================');
    console.log('[VERIFY] Please check MongoDB Compass for:');
    console.log('[VERIFY] - Database:', dbInfo.dbName);
    console.log('[VERIFY] - Collection: users');
    console.log('[VERIFY] - Document with email:', testUser.email);
    console.log('[VERIFY] ========================================');

    // Verify the document exists by querying it
    const verifyDoc = await User.findById(insertedUser._id);
    const docCount = await User.countDocuments({ email: testUser.email });

    res.status(200).json({
      success: true,
      message: 'Test document inserted successfully',
      dbInfo,
      insertedDocument: {
        _id: insertedUser._id,
        name: insertedUser.name,
        email: insertedUser.email,
        username: insertedUser.username,
        role: insertedUser.role,
        createdAt: insertedUser.createdAt,
        updatedAt: insertedUser.updatedAt
      },
      verification: {
        documentFound: !!verifyDoc,
        documentCount: docCount,
        collection: 'users'
      },
      instructions: {
        checkInCompass: `Open MongoDB Compass, connect to the same cluster, select database "${dbInfo.dbName}", and check the "users" collection for the document with email "${testUser.email}"`
      }
    });
  } catch (error) {
    console.error('[VERIFY] ❌ Error inserting document:', error.message);
    console.error('[VERIFY] Error details:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to insert test document',
      message: error.message,
      dbInfo,
      errorDetails: {
        name: error.name,
        code: error.code,
        keyPattern: error.keyPattern,
        keyValue: error.keyValue
      }
    });
  }
});

module.exports = {
  verifyMongoWrite
};

