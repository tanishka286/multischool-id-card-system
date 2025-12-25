const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { 
  createClass, 
  getClasses, 
  freezeClass, 
  unfreezeClass 
} = require('../controllers/class.controller');

const router = express.Router();

// POST /api/v1/classes - Create a new class
router.post('/', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), createClass);

// GET /api/v1/classes - List classes for current school
router.get('/', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin', 'Teacher'), getClasses);

// PATCH /api/v1/classes/:id/freeze - Freeze a class
router.patch('/:id/freeze', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), freezeClass);

// PATCH /api/v1/classes/:id/unfreeze - Unfreeze a class
router.patch('/:id/unfreeze', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), unfreezeClass);

module.exports = router;