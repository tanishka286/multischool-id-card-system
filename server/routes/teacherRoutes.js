const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { 
  createTeacher, 
  getTeachers, 
  updateTeacher, 
  deleteTeacher 
} = require('../controllers/teacher.controller');

const router = express.Router();

// POST /api/v1/teachers - Create a teacher
router.post('/', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), createTeacher);

// GET /api/v1/teachers - List teachers for current school
router.get('/', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin', 'Teacher'), getTeachers);

// PATCH /api/v1/teachers/:id - Update teacher details
router.patch('/:id', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin', 'Teacher'), updateTeacher);

// DELETE /api/v1/teachers/:id - Delete a teacher
router.delete('/:id', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), deleteTeacher);

module.exports = router;