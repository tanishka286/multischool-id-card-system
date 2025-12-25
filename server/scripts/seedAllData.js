/**
 * Comprehensive seed script to create all initial data in the database
 * This ensures all collections have data with all fields properly populated
 * Run with: node server/scripts/seedAllData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const School = require('../models/School');
const AllowedLogin = require('../models/AllowedLogin');
const Session = require('../models/Session');
const Class = require('../models/Class');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const LoginLog = require('../models/LoginLog');
const env = require('../config/env');

const seedAllData = async () => {
  try {
    console.log('[SEED] Connecting to MongoDB...');
    await mongoose.connect(env.mongoUri);
    console.log('[SEED] Connected to MongoDB successfully!\n');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    const superadminPassword = await bcrypt.hash('admin123', salt);
    const schooladminPassword = await bcrypt.hash('admin123', salt);
    const teacherPassword = await bcrypt.hash('teacher123', salt);

    // ========== CREATE SCHOOL ==========
    console.log('[SEED] Creating/updating school...');
    let school = await School.findOne({ name: 'Greenfield Public School' });
    if (!school) {
      school = await School.create({
        name: 'Greenfield Public School',
        address: '123 Education Street, City, State 12345',
        contactEmail: 'contact@greenfield.edu',
        status: 'active'
      });
      console.log(`  ✓ School created: ${school.name}`);
      console.log(`    - ID: ${school._id}`);
      console.log(`    - Address: ${school.address}`);
      console.log(`    - Email: ${school.contactEmail}`);
      console.log(`    - Status: ${school.status}`);
      console.log(`    - Created: ${school.createdAt}`);
      console.log(`    - Updated: ${school.updatedAt}\n`);
    } else {
      // Update to ensure all fields are present
      school.address = school.address || '123 Education Street, City, State 12345';
      school.contactEmail = school.contactEmail || 'contact@greenfield.edu';
      school.status = school.status || 'active';
      await school.save();
      console.log(`  ✓ School already exists: ${school.name}`);
      console.log(`    - All fields populated\n`);
    }

    // ========== CREATE ALLOWED LOGIN ==========
    console.log('[SEED] Creating/updating allowed login settings...');
    let allowedLogin = await AllowedLogin.findOne({ schoolId: school._id });
    if (!allowedLogin) {
      allowedLogin = await AllowedLogin.create({
        schoolId: school._id,
        allowSchoolAdmin: true,
        allowTeacher: true
      });
      console.log(`  ✓ AllowedLogin created`);
      console.log(`    - School ID: ${allowedLogin.schoolId}`);
      console.log(`    - Allow School Admin: ${allowedLogin.allowSchoolAdmin}`);
      console.log(`    - Allow Teacher: ${allowedLogin.allowTeacher}`);
      console.log(`    - Created: ${allowedLogin.createdAt}`);
      console.log(`    - Updated: ${allowedLogin.updatedAt}\n`);
    } else {
      allowedLogin.allowSchoolAdmin = true;
      allowedLogin.allowTeacher = true;
      await allowedLogin.save();
      console.log(`  ✓ AllowedLogin already exists - updated\n`);
    }

    // ========== CREATE USERS ==========
    console.log('[SEED] Creating/updating users...');
    
    // Superadmin
    let superadmin = await User.findOne({ email: 'super@admin.com' });
    if (!superadmin) {
      superadmin = await User.create({
        name: 'Super Admin',
        email: 'super@admin.com',
        username: 'superadmin',
        passwordHash: superadminPassword,
        role: 'Superadmin',
        status: 'active'
      });
      console.log(`  ✓ Superadmin created`);
    } else {
      superadmin.name = 'Super Admin';
      superadmin.status = 'active';
      await superadmin.save();
      console.log(`  ✓ Superadmin already exists - updated`);
    }
    console.log(`    - Name: ${superadmin.name}`);
    console.log(`    - Email: ${superadmin.email}`);
    console.log(`    - Username: ${superadmin.username}`);
    console.log(`    - Role: ${superadmin.role}`);
    console.log(`    - Status: ${superadmin.status}`);
    console.log(`    - School ID: ${superadmin.schoolId || 'N/A (Superadmin)'}`);
    console.log(`    - Created: ${superadmin.createdAt}`);
    console.log(`    - Updated: ${superadmin.updatedAt}\n`);

    // Schooladmin
    let schooladmin = await User.findOne({ email: 'admin@school.com' });
    if (!schooladmin) {
      schooladmin = await User.create({
        name: 'School Admin',
        email: 'admin@school.com',
        username: 'schooladmin',
        passwordHash: schooladminPassword,
        role: 'Schooladmin',
        schoolId: school._id,
        status: 'active'
      });
      console.log(`  ✓ Schooladmin created`);
    } else {
      schooladmin.name = 'School Admin';
      schooladmin.schoolId = school._id;
      schooladmin.status = 'active';
      await schooladmin.save();
      console.log(`  ✓ Schooladmin already exists - updated`);
    }
    console.log(`    - Name: ${schooladmin.name}`);
    console.log(`    - Email: ${schooladmin.email}`);
    console.log(`    - Username: ${schooladmin.username}`);
    console.log(`    - Role: ${schooladmin.role}`);
    console.log(`    - Status: ${schooladmin.status}`);
    console.log(`    - School ID: ${schooladmin.schoolId}`);
    console.log(`    - Created: ${schooladmin.createdAt}`);
    console.log(`    - Updated: ${schooladmin.updatedAt}\n`);

    // Teacher
    let teacher = await User.findOne({ email: 'teacher@school.com' });
    if (!teacher) {
      teacher = await User.create({
        name: 'Teacher User',
        email: 'teacher@school.com',
        username: 'teacher',
        passwordHash: teacherPassword,
        role: 'Teacher',
        schoolId: school._id,
        status: 'active'
      });
      console.log(`  ✓ Teacher created`);
    } else {
      teacher.name = 'Teacher User';
      teacher.schoolId = school._id;
      teacher.status = 'active';
      await teacher.save();
      console.log(`  ✓ Teacher already exists - updated`);
    }
    console.log(`    - Name: ${teacher.name}`);
    console.log(`    - Email: ${teacher.email}`);
    console.log(`    - Username: ${teacher.username}`);
    console.log(`    - Role: ${teacher.role}`);
    console.log(`    - Status: ${teacher.status}`);
    console.log(`    - School ID: ${teacher.schoolId}`);
    console.log(`    - Created: ${teacher.createdAt}`);
    console.log(`    - Updated: ${teacher.updatedAt}\n`);

    // ========== CREATE SESSION ==========
    console.log('[SEED] Creating/updating session...');
    const currentYear = new Date().getFullYear();
    const sessionName = `${currentYear}-${currentYear + 1}`;
    let session = await Session.findOne({ 
      sessionName: sessionName,
      schoolId: school._id 
    });
    
    if (!session) {
      const startDate = new Date(currentYear, 3, 1); // April 1
      const endDate = new Date(currentYear + 1, 2, 31); // March 31
      session = await Session.create({
        sessionName: sessionName,
        startDate: startDate,
        endDate: endDate,
        schoolId: school._id,
        activeStatus: true
      });
      console.log(`  ✓ Session created`);
    } else {
      session.activeStatus = true;
      await session.save();
      console.log(`  ✓ Session already exists - updated`);
    }
    console.log(`    - Name: ${session.sessionName}`);
    console.log(`    - Start Date: ${session.startDate}`);
    console.log(`    - End Date: ${session.endDate}`);
    console.log(`    - School ID: ${session.schoolId}`);
    console.log(`    - Active: ${session.activeStatus}`);
    console.log(`    - Created: ${session.createdAt}`);
    console.log(`    - Updated: ${session.updatedAt}\n`);

    // ========== CREATE CLASS ==========
    console.log('[SEED] Creating/updating class...');
    let classDoc = await Class.findOne({ 
      className: 'Class 10-A',
      schoolId: school._id 
    });
    
    if (!classDoc) {
      classDoc = await Class.create({
        className: 'Class 10-A',
        schoolId: school._id,
        sessionId: session._id,
        frozen: false
      });
      console.log(`  ✓ Class created`);
    } else {
      classDoc.sessionId = session._id;
      classDoc.frozen = false;
      await classDoc.save();
      console.log(`  ✓ Class already exists - updated`);
    }
    console.log(`    - Name: ${classDoc.className}`);
    console.log(`    - School ID: ${classDoc.schoolId}`);
    console.log(`    - Session ID: ${classDoc.sessionId}`);
    console.log(`    - Frozen: ${classDoc.frozen}`);
    console.log(`    - Created: ${classDoc.createdAt}`);
    console.log(`    - Updated: ${classDoc.updatedAt}\n`);

    // ========== CREATE TEACHER ==========
    console.log('[SEED] Creating/updating teacher...');
    let teacherDoc = await Teacher.findOne({ email: 'john.teacher@school.com' });
    
    if (!teacherDoc) {
      teacherDoc = await Teacher.create({
        name: 'John Teacher',
        mobile: '9876543210',
        email: 'john.teacher@school.com',
        photoUrl: '',
        classId: classDoc._id,
        schoolId: school._id,
        status: 'active'
      });
      console.log(`  ✓ Teacher document created`);
    } else {
      teacherDoc.classId = classDoc._id;
      teacherDoc.schoolId = school._id;
      teacherDoc.status = 'active';
      await teacherDoc.save();
      console.log(`  ✓ Teacher document already exists - updated`);
    }
    console.log(`    - Name: ${teacherDoc.name}`);
    console.log(`    - Email: ${teacherDoc.email}`);
    console.log(`    - Mobile: ${teacherDoc.mobile}`);
    console.log(`    - School ID: ${teacherDoc.schoolId}`);
    console.log(`    - Class ID: ${teacherDoc.classId}`);
    console.log(`    - Status: ${teacherDoc.status}`);
    console.log(`    - Created: ${teacherDoc.createdAt}`);
    console.log(`    - Updated: ${teacherDoc.updatedAt}\n`);

    // ========== CREATE STUDENT ==========
    console.log('[SEED] Creating/updating student...');
    let student = await Student.findOne({ admissionNo: 'STU001' });
    
    if (!student) {
      student = await Student.create({
        admissionNo: 'STU001',
        name: 'Alice Johnson',
        dob: new Date(2010, 5, 15),
        fatherName: 'Robert Johnson',
        motherName: 'Mary Johnson',
        mobile: '9876543211',
        address: '456 Student Street, City, State 12345',
        aadhaar: '123456789012',
        photoUrl: '',
        classId: classDoc._id,
        sessionId: session._id,
        schoolId: school._id
      });
      console.log(`  ✓ Student created`);
    } else {
      student.classId = classDoc._id;
      student.sessionId = session._id;
      student.schoolId = school._id;
      await student.save();
      console.log(`  ✓ Student already exists - updated`);
    }
    console.log(`    - Admission No: ${student.admissionNo}`);
    console.log(`    - Name: ${student.name}`);
    console.log(`    - DOB: ${student.dob}`);
    console.log(`    - Father: ${student.fatherName}`);
    console.log(`    - Mother: ${student.motherName}`);
    console.log(`    - Mobile: ${student.mobile}`);
    console.log(`    - Address: ${student.address}`);
    console.log(`    - School ID: ${student.schoolId}`);
    console.log(`    - Class ID: ${student.classId}`);
    console.log(`    - Session ID: ${student.sessionId}`);
    console.log(`    - Created: ${student.createdAt}`);
    console.log(`    - Updated: ${student.updatedAt}\n`);

    // ========== CREATE LOGIN LOG (Sample) ==========
    console.log('[SEED] Creating sample login log...');
    const loginLogCount = await LoginLog.countDocuments();
    if (loginLogCount === 0) {
      const sampleLog = await LoginLog.create({
        username: superadmin.username,
        role: superadmin.role,
        schoolId: null,
        ipAddress: '127.0.0.1'
      });
      console.log(`  ✓ Sample login log created`);
      console.log(`    - Username: ${sampleLog.username}`);
      console.log(`    - Role: ${sampleLog.role}`);
      console.log(`    - IP: ${sampleLog.ipAddress}`);
      console.log(`    - Timestamp: ${sampleLog.timestamp}`);
      console.log(`    - Created: ${sampleLog.createdAt}`);
      console.log(`    - Updated: ${sampleLog.updatedAt}\n`);
    } else {
      console.log(`  ✓ Login logs already exist (${loginLogCount} entries)\n`);
    }

    // ========== SUMMARY ==========
    console.log('='.repeat(60));
    console.log('[SEED] DATA SUMMARY');
    console.log('='.repeat(60));
    const counts = {
      schools: await School.countDocuments(),
      users: await User.countDocuments(),
      allowedLogins: await AllowedLogin.countDocuments(),
      sessions: await Session.countDocuments(),
      classes: await Class.countDocuments(),
      teachers: await Teacher.countDocuments(),
      students: await Student.countDocuments(),
      loginLogs: await LoginLog.countDocuments()
    };
    
    console.log(`  Schools: ${counts.schools}`);
    console.log(`  Users: ${counts.users}`);
    console.log(`  Allowed Logins: ${counts.allowedLogins}`);
    console.log(`  Sessions: ${counts.sessions}`);
    console.log(`  Classes: ${counts.classes}`);
    console.log(`  Teachers: ${counts.teachers}`);
    console.log(`  Students: ${counts.students}`);
    console.log(`  Login Logs: ${counts.loginLogs}`);
    console.log('='.repeat(60));
    
    console.log('\n[SEED] All data seeded successfully!');
    console.log('\n[SEED] Login credentials:');
    console.log('  Superadmin: super@admin.com / admin123');
    console.log('  Schooladmin: admin@school.com / admin123');
    console.log('  Teacher: teacher@school.com / teacher123');

    await mongoose.connection.close();
    console.log('\n[SEED] Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error seeding data:', error);
    console.error(error.stack);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed function
seedAllData();

