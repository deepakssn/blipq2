const express = require('express');
const {
    addAllowedDomain,
    getAllowedDomains,
    updateAllowedDomain,
    deleteAllowedDomain,
    assignOrgAdminRole,
    revokeOrgAdminRole,
    getAuditLogs,
    getFlaggedPosts,     // Added
    reviewFlaggedPost    // Added
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// All routes in this file are for superAdmins or designated admin roles.
// We apply 'protect' for authentication first.
router.use(protect);

// Domain Management Routes (superAdmin only)
router.route('/domains')
    .post(authorize('superAdmin'), addAllowedDomain)
    .get(authorize('superAdmin'), getAllowedDomains);

router.route('/domains/:id')
    .put(authorize('superAdmin'), updateAllowedDomain)
    .delete(authorize('superAdmin'), deleteAllowedDomain);

// User Role Management Routes (superAdmin only)
router.put('/users/:userId/assign-org-admin', authorize('superAdmin'), assignOrgAdminRole);
router.put('/users/:userId/revoke-org-admin', authorize('superAdmin'), revokeOrgAdminRole);

// Audit Log Route (superAdmin can see all, orgAdmin their own org)
router.get('/audit-logs', authorize('superAdmin', 'orgAdmin'), getAuditLogs);

// Flagged Post Management Routes (superAdmin can see all, orgAdmin their own org's flagged posts)
router.get('/flagged-posts', authorize('superAdmin', 'orgAdmin'), getFlaggedPosts);
router.put('/flagged-posts/:flagId/review', authorize('superAdmin', 'orgAdmin'), reviewFlaggedPost);

module.exports = router;
