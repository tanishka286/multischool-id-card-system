const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const AllowedLogin = require('../models/AllowedLogin');
const LoginLog = require('../models/LoginLog');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Load environment variables
require('dotenv').config();

// Initialize Google OAuth client
const googleClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// Helper function to extract IP address
const getClientIp = (req) => {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
         (req.headers['x-real-ip'] || null) ||
         '127.0.0.1'; // Fallback for localhost
};

// @desc    Login user
// @route   POST /auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log(`[AUTH] Login attempt for email: ${email}`);

    // Validate input
    if (!email || !password) {
      console.log(`[AUTH] Login failed: Missing email or password`);
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).populate('schoolId');
    if (!user) {
      console.log(`[AUTH] Login failed: User not found for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log(`[AUTH] User found: ${user.username} (${user.role})`);

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Check if login is allowed based on role and school
    if (user.role.toLowerCase() !== 'superadmin') {
      if (!user.schoolId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      const allowedLogin = await AllowedLogin.findOne({ schoolId: user.schoolId._id });
      if (!allowedLogin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (user.role === 'Schooladmin' && !allowedLogin.allowSchoolAdmin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (user.role === 'Teacher' && !allowedLogin.allowTeacher) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user._id,
        role: user.role,
        schoolId: user.schoolId ? user.schoolId._id : null
      }
    };

    // Verify JWT secret exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable not defined');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET not defined'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    // Get client IP address
    const clientIp = getClientIp(req);
    console.log(`[AUTH] Login successful for user: ${user.username} (${user.role}) from IP: ${clientIp}`);

    // Log successful login to database
    try {
      const loginLog = await LoginLog.create({
      username: user.username,
      role: user.role,
      schoolId: user.schoolId && user.schoolId._id ? user.schoolId._id : null,
        ipAddress: clientIp
      });
      console.log(`[AUTH] Login log created in MongoDB: ${loginLog._id}`);
      console.log(`[AUTH] Login log data:`, {
        username: loginLog.username,
        role: loginLog.role,
        schoolId: loginLog.schoolId,
        ipAddress: loginLog.ipAddress,
        timestamp: loginLog.timestamp
      });
    } catch (logError) {
      // Log error but don't fail the login
      console.error(`[AUTH] Failed to create login log:`, logError.message);
    }

    // Return user data without passwordHash
    console.log(`[AUTH] Returning user data for: ${user.email} (${user.role})`);
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        schoolId: user.schoolId ? user.schoolId._id : null,
        schoolName: user.schoolId ? user.schoolId.name : null,
        status: user.status
      }
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return more specific error based on error type
    if (error.name === 'JsonWebTokenError') {
      return res.status(500).json({
        success: false,
        message: 'Token generation error'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @desc    Get current user
// @route   GET /auth/me
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    console.log(`[AUTH] Get current user request for user ID: ${req.user.id}`);
    const user = await User.findById(req.user.id).populate('schoolId').select('-passwordHash');
    
    if (!user) {
      console.log(`[AUTH] User not found for ID: ${req.user.id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`[AUTH] Returning user data for: ${user.email} (${user.role})`);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        schoolId: user.schoolId ? user.schoolId._id : null,
        schoolName: user.schoolId ? user.schoolId.name : null,
        status: user.status
      }
    });
  } catch (error) {
    console.error('[AUTH] Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting user'
    });
  }
});

// @desc    Google OAuth callback
// @route   POST /auth/google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required'
      });
    }

    if (!googleClient) {
      return res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured on the server'
      });
    }

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error('[AUTH] Google token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    const googlePayload = ticket.getPayload();
    const { email, name, picture } = googlePayload;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email not found in Google token'
      });
    }

    console.log(`[AUTH] Google sign-in attempt for email: ${email}`);

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() }).populate('schoolId');
    
    if (!user) {
      // Create new user with Google account
      // Default to Teacher role for new Google users (can be changed by admin)
      console.log(`[AUTH] Creating new user from Google: ${email}`);
      
      // Try to find a school to assign (use first active school, or create one)
      const School = require('../models/School');
      let school = await School.findOne({ status: 'active' });
      
      if (!school) {
        // Create a default school for Google users
        school = await School.create({
          name: 'Default School',
          address: 'Address not provided',
          contactEmail: email,
          status: 'active'
        });
        
        // Create AllowedLogin for the school
        await AllowedLogin.create({
          schoolId: school._id,
          allowSchoolAdmin: true,
          allowTeacher: true
        });
      }

      // Generate a random password hash (Google users don't use password)
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        username: email.split('@')[0] + '_' + Date.now().toString().slice(-6),
        passwordHash: passwordHash,
        role: 'Teacher', // Default role for Google users
        schoolId: school._id,
        status: 'active'
      });

      console.log(`[AUTH] New user created from Google: ${user.username} (${user.role})`);
    } else {
      console.log(`[AUTH] Existing user found: ${user.username} (${user.role})`);
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive'
      });
    }

    // Check if login is allowed (for non-superadmin users)
    if (user.role.toLowerCase() !== 'superadmin') {
      if (!user.schoolId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid account configuration'
        });
      }
      
      const allowedLogin = await AllowedLogin.findOne({ schoolId: user.schoolId._id });
      if (!allowedLogin) {
        return res.status(401).json({
          success: false,
          message: 'Login not allowed for this school'
        });
      }

      if (user.role === 'Schooladmin' && !allowedLogin.allowSchoolAdmin) {
        return res.status(401).json({
          success: false,
          message: 'School admin login is currently disabled'
        });
      }

      if (user.role === 'Teacher' && !allowedLogin.allowTeacher) {
        return res.status(401).json({
          success: false,
          message: 'Teacher login is currently disabled'
        });
      }
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user._id,
        role: user.role,
        schoolId: user.schoolId ? user.schoolId._id : null
      }
    };

    // Verify JWT secret exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable not defined');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: JWT_SECRET not defined'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });

    // Get client IP address
    const getClientIp = (req) => {
      return req.ip || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress || 
             (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : null) ||
             (req.headers['x-real-ip'] || null) ||
             '127.0.0.1';
    };

    const clientIp = getClientIp(req);
    console.log(`[AUTH] Google login successful for user: ${user.username} (${user.role}) from IP: ${clientIp}`);

    // Log successful login to database
    try {
      const loginLog = await LoginLog.create({
        username: user.username,
        role: user.role,
        schoolId: user.schoolId && user.schoolId._id ? user.schoolId._id : null,
        ipAddress: clientIp
      });
      console.log(`[AUTH] Login log created in MongoDB: ${loginLog._id}`);
    } catch (logError) {
      console.error(`[AUTH] Failed to create login log:`, logError.message);
    }

    // Return user data without passwordHash
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        schoolId: user.schoolId ? user.schoolId._id : null,
        schoolName: user.schoolId ? user.schoolId.name : null,
        status: user.status
      }
    });
  } catch (error) {
    console.error('[AUTH] Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during Google authentication'
    });
  }
});

module.exports = router;