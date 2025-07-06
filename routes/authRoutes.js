const express = require('express');
const { register, verifyEmail, login, refreshToken, logout } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditLogMiddleware'); // Import auditLog middleware

const router = express.Router();

// For login, we might want more specific details in the audit log,
// e.g. if login was successful or failed, and which user attempted.
// The generic middleware will log the attempt. Successful login could be logged from controller.
// For now, let's add a generic log for the attempt.
router.post('/login', auditLog('USER_LOGIN_ATTEMPT', (req) => ({ targetType: 'Auth', details: { email: req.body.email } })), login);

router.post('/register', register); // Could add auditLog('USER_REGISTER_ATTEMPT')
router.get('/verify-email/:token', verifyEmail); // auditLog('EMAIL_VERIFY_ATTEMPT')
router.post('/refresh-token', refreshToken); // auditLog('TOKEN_REFRESH_ATTEMPT')
router.post('/logout', protect, auditLog('USER_LOGOUT'), logout);

module.exports = router;
