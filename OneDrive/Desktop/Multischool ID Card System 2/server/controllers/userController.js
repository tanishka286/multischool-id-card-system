const User = require('../models/User');
const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Super Admin only)
const getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find();
  
  res.status(200).json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Create new user
// @route   POST /api/v1/users
// @access  Private (Super Admin only)
const createUser = asyncHandler(async (req, res, next) => {
  const { name, email, username, password, role, schoolId, status } = req.body;
  
  // Validate required fields
  if (!name || !email || !username || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, username, password, and role are required'
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ email: email.toLowerCase() }, { username }] 
  });
  
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User with this email or username already exists'
    });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user data
  const userData = {
    name,
    email: email.toLowerCase(),
    username,
    passwordHash,
    role,
    schoolId: role !== 'Superadmin' ? schoolId : undefined,
    status: status || 'active'
  };

  console.log(`[USER] Creating user: ${username} (${role})`);
  const user = await User.create(userData);
  console.log(`[USER] User created successfully: ${user._id}`);
  
  // Remove passwordHash from response
  const userResponse = user.toObject();
  delete userResponse.passwordHash;
  
  res.status(201).json({
    success: true,
    data: userResponse
  });
});

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Super Admin only)
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};