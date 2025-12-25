# Login Credentials for Multischool ID Card System

## 🔐 Test User Credentials

Use these credentials to access all three role sections of the application:

---

### 👑 **Superadmin** (Full System Access)
- **Email:** `super@admin.com`
- **Password:** `admin123`
- **Access:** 
  - Manage all schools
  - Manage all school admins
  - Manage all teachers across all schools
  - Manage all students across all schools
  - Template management for all schools
  - Bulk operations for all schools

---

### 🏫 **Schooladmin** (School-Level Access)
- **Email:** `admin@school.com`
- **Password:** `admin123`
- **Access:**
  - Manage students in their school
  - Manage teachers in their school
  - Manage classes and sessions for their school
  - Template management for their school
  - Bulk operations for their school
  - School: **Greenfield Public School**

---

### 👨‍🏫 **Teacher** (Limited Access)
- **Email:** `teacher@school.com`
- **Password:** `teacher123`
- **Access:**
  - View students in their assigned class
  - View their own profile
  - Limited bulk operations
  - School: **Greenfield Public School**
  - Assigned to: **Class 10-A**

---

## 📝 Notes

- All passwords are hashed using bcrypt in the database
- All users are set to `active` status
- The seed script creates these users automatically
- Schooladmin and Teacher are associated with **Greenfield Public School**
- Superadmin has no school association (manages all schools)

## 🚀 Quick Start

1. Start your backend server: `node server.js`
2. Start your frontend server: `npm run dev` (or `vite`)
3. Navigate to the login page
4. Use any of the credentials above to test different role access

---

**Last Updated:** After running `seedAllData.js` script

