/**
 * Seed script to create initial users in the database
 * Run with: node server/scripts/seedUsers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
const AllowedLogin = require('../models/AllowedLogin');
const env = require('../config/env');

const seedUsers = async () => {
  try {
    console.log('[SEED] Connecting to MongoDB...');
    await mongoose.connect(env.mongoUri);
    console.log('[SEED] Connected to MongoDB successfully!');

    // Check if complete data already exists
    const existingUsers = await User.find();
    const existingSchools = await School.find();
    const existingAllowedLogins = await AllowedLogin.find();
    
    // Check if we have all required data
    const hasSuperadmin = existingUsers.some(u => u.role === 'Superadmin');
    const hasSchooladmin = existingUsers.some(u => u.role === 'Schooladmin');
    const hasTeacher = existingUsers.some(u => u.role === 'Teacher');
    const hasSchool = existingSchools.length > 0;
    const hasAllowedLogin = existingAllowedLogins.length > 0;
    
    if (hasSuperadmin && hasSchooladmin && hasTeacher && hasSchool && hasAllowedLogin) {
      console.log(`[SEED] Found complete existing data:`);
      console.log(`  - ${existingUsers.length} user(s) (Superadmin, Schooladmin, Teacher)`);
      console.log(`  - ${existingSchools.length} school(s)`);
      console.log(`  - ${existingAllowedLogins.length} allowed login(s)`);
      console.log('[SEED] All required data exists. Skipping seed.');
      await mongoose.connection.close();
      return;
    }
    
    // If we have partial data, we'll complete it
    if (existingUsers.length > 0 || existingSchools.length > 0) {
      console.log(`[SEED] Found partial existing data:`);
      console.log(`  - ${existingUsers.length} user(s)`);
      console.log(`  - ${existingSchools.length} school(s)`);
      console.log('[SEED] Will create missing data...');
    }

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const superadminPassword = await bcrypt.hash('admin123', salt);
    const schooladminPassword = await bcrypt.hash('admin123', salt);
    const teacherPassword = await bcrypt.hash('teacher123', salt);

    console.log('[SEED] Checking/creating school...');
    // Find or create a demo school
    let school = await School.findOne({ name: 'Greenfield Public School' });
    if (!school) {
      school = await School.create({
        name: 'Greenfield Public School',
        address: '123 Education Street, City, State 12345',
        contactEmail: 'contact@greenfield.edu',
        status: 'active'
      });
      console.log(`[SEED] ✓ School created: ${school.name} (${school._id})`);
    } else {
      console.log(`[SEED] ✓ School already exists: ${school.name} (${school._id})`);
    }

    console.log('[SEED] Checking/creating allowed login settings...');
    // Find or create AllowedLogin for the school
    let allowedLogin = await AllowedLogin.findOne({ schoolId: school._id });
    if (!allowedLogin) {
      allowedLogin = await AllowedLogin.create({
        schoolId: school._id,
        allowSchoolAdmin: true,
        allowTeacher: true
      });
      console.log(`[SEED] ✓ AllowedLogin created for school: ${school.name}`);
    } else {
      console.log(`[SEED] ✓ AllowedLogin already exists for school: ${school.name}`);
    }

    console.log('[SEED] Checking/creating users...');
    // Create users only if they don't exist
    const usersToCreate = [];
    
    // Check and create Superadmin
    let superadmin = await User.findOne({ email: 'super@admin.com' });
    if (!superadmin) {
      usersToCreate.push({
        name: 'Super Admin',
        email: 'super@admin.com',
        username: 'superadmin',
        passwordHash: superadminPassword,
        role: 'Superadmin',
        status: 'active'
      });
    } else {
      console.log(`[SEED] ✓ Superadmin already exists: ${superadmin.username}`);
    }
    
    // Check and create Schooladmin
    let schooladmin = await User.findOne({ email: 'admin@school.com' });
    if (!schooladmin) {
      usersToCreate.push({
        name: 'School Admin',
        email: 'admin@school.com',
        username: 'schooladmin',
        passwordHash: schooladminPassword,
        role: 'Schooladmin',
        schoolId: school._id,
        status: 'active'
      });
    } else {
      console.log(`[SEED] ✓ Schooladmin already exists: ${schooladmin.username}`);
    }
    
    // Check and create Teacher
    let teacher = await User.findOne({ email: 'teacher@school.com' });
    if (!teacher) {
      usersToCreate.push({
        name: 'Teacher User',
        email: 'teacher@school.com',
        username: 'teacher',
        passwordHash: teacherPassword,
        role: 'Teacher',
        schoolId: school._id,
        status: 'active'
      });
    } else {
      console.log(`[SEED] ✓ Teacher already exists: ${teacher.username}`);
    }

    let createdUsers = [];
    if (usersToCreate.length > 0) {
      createdUsers = await User.insertMany(usersToCreate);
    }
    
    console.log('\n[SEED] Data summary:');
    console.log(`  ✓ School: ${school.name}`);
    console.log(`  ✓ AllowedLogin settings`);
    if (createdUsers.length > 0) {
      console.log(`  ✓ Created ${createdUsers.length} new user(s):`);
      createdUsers.forEach(user => {
        console.log(`    - ${user.username} (${user.email}) - ${user.role}`);
      });
    }
    
    // Show all users
    const allUsers = await User.find();
    console.log(`\n[SEED] Total users in database: ${allUsers.length}`);
    allUsers.forEach(user => {
      console.log(`  - ${user.username} (${user.email}) - ${user.role}`);
    });

    console.log('\n[SEED] Default login credentials:');
    console.log('  Superadmin:');
    console.log('    Email: super@admin.com');
    console.log('    Password: admin123');
    console.log('  Schooladmin:');
    console.log('    Email: admin@school.com');
    console.log('    Password: admin123');
    console.log('  Teacher:');
    console.log('    Email: teacher@school.com');
    console.log('    Password: teacher123');

    await mongoose.connection.close();
    console.log('\n[SEED] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error seeding data:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedUsers();

