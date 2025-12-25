const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const { 
  createSession, 
  getSessions, 
  activateSession, 
  deactivateSession 
} = require('../controllers/session.controller');

const router = express.Router();

// POST /api/v1/sessions - Create a new academic session
router.post('/', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), createSession);

// GET /api/v1/sessions - Fetch all sessions for the user's school
router.get('/', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin', 'Teacher'), getSessions);

// PATCH /api/v1/sessions/:id/activate - Mark the selected session as active
router.patch('/:id/activate', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), activateSession);

// PATCH /api/v1/sessions/:id/deactivate - Archive/deactivate a session
router.patch('/:id/deactivate', authMiddleware, roleMiddleware('Superadmin', 'Schooladmin'), deactivateSession);

module.exports = router;