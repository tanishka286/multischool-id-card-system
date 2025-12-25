const mongoose = require('mongoose');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');

// @desc    Health check endpoint
// @route   GET /health
// @access  Public
const healthCheck = asyncHandler(async (req, res) => {
  const health = {
    status: "OK",
    timestamp: new Date().toISOString(),
    database: {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
    }
  };

  // If database is connected, get collection counts
  if (mongoose.connection.readyState === 1) {
    try {
      const userCount = await User.countDocuments();
      const loginLogCount = await LoginLog.countDocuments();
      
      health.database.collections = {
        users: userCount,
        loginlogs: loginLogCount
      };
      
      health.database.name = mongoose.connection.name;
      health.database.host = mongoose.connection.host;
    } catch (error) {
      health.database.error = error.message;
    }
  } else {
    health.database.error = 'Database not connected';
  }

  res.status(200).json(health);
});

module.exports = {
  healthCheck,
};