const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { 
  createStudent, 
  getStudents, 
  updateStudent, 
  deleteStudent 
} = require('../controllers/student.controller');

const router = express.Router();

// POST /api/v1/students - Create a student
router.post('/', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), createStudent);

// GET /api/v1/students - List students for current school
router.get('/', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin', 'Teacher'), getStudents);

// PATCH /api/v1/students/:id - Update student details (BLOCK updates if class is frozen)
router.patch('/:id', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), updateStudent);

// DELETE /api/v1/students/:id - Delete a student
router.delete('/:id', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), deleteStudent);

module.exports = router;