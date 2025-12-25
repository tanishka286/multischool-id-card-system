const express = require('express');
const { verifyMongoWrite } = require('../controllers/verificationController');

const router = express.Router();

/**
 * TEMPORARY VERIFICATION ROUTE - REMOVE AFTER VERIFICATION
 * 
 * GET /api/v1/verify-mongo
 * 
 * This route tests MongoDB Atlas writes by inserting a test document.
 * Remove this route and controller after verifying data appears in Compass.
 */
router.route('/').get(verifyMongoWrite);

module.exports = router;

