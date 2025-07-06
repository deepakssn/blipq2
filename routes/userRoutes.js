const express = require('express');
const { getMe, updateProfile, getAllUsers } = require('../controllers/userController'); // Added getAllUsers
const { protect, authorize } = require('../middlewares/authMiddleware'); // Import protect and authorize middleware

const router = express.Router();

// User specific routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin/OrgAdmin routes for user management
router.get('/', protect, authorize('superAdmin', 'orgAdmin'), getAllUsers); // Get all users (admin/orgAdmin)


module.exports = router;
