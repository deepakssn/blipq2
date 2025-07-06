const express = require('express');
const {
  createPost,
  getPostById,
  updatePost,
  deletePost,
  toggleLikePost,
  toggleBookmarkPost,
  getGlobalPosts,
  getOrganizationPosts,
  flagPost             // Added
} = require('../controllers/postController');
const { protect } = require('../middlewares/authMiddleware');
const auditLog = require('../middlewares/auditLogMiddleware');

const router = express.Router();

// All routes below this point will use 'protect' middleware
router.use(protect);

router.route('/')
  .post(auditLog('CREATE_POST', (req, res) => {
    // After post creation, res.locals.createdPostId could be set by controller
    // For now, we don't have the ID at this stage of middleware application for 'finish' event
    // But we can log the attempt. Specific ID logging might need controller integration.
    // Or, if the response body contains the created post ID, we could parse it, but that's fragile.
    // Let's log basic info for now.
    return { targetType: 'Post' }; // Controller can add more details if needed via a direct AuditLog.createLog call
  }), createPost);

router.route('/:id')
  .get(getPostById)
  .put(updatePost)
  .delete(deletePost);

// Post interaction routes
router.put('/:id/like', toggleLikePost);
router.put('/:id/bookmark', toggleBookmarkPost);

// Routes for getting posts by visibility
router.get('/type/global', getGlobalPosts);
router.get('/type/organization', getOrganizationPosts);

// Flag a post
router.post('/:id/flag', auditLog('FLAG_POST_ATTEMPT', (req) => ({ targetType: 'Post', targetId: req.params.id })), flagPost);


module.exports = router;
