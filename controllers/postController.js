const Post = require('../models/Post');
const User = require('../models/User'); // Needed to get author's organization
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private (User must be logged in)
exports.createPost = asyncHandler(async (req, res, next) => {
  const { title, content, visibility, imageUrl, tags } = req.body;
  const authorId = req.user.id;

  // Get author's organization
  const author = await User.findById(authorId).select('organization role');
  if (!author || !author.organization) {
    // All verified users should have an organization set from their email domain.
    // If superAdmin is posting and doesn't have one (e.g. registered before org logic or with non-org email),
    // this could be an issue. For now, we require it.
    // A superAdmin could post 'global' posts not tied to their own org if their org field is null/flexible.
    // For now, let's assume all users, including superAdmins, have an organization if they are to post org-visible content.
    // Global posts from superAdmins might not strictly need an org.
    if (visibility === 'organization' && !author.organization) {
         return next(new ErrorResponse('User must have an organization to create organization-visible posts.', 400));
    }
    // If a superAdmin posts a global post, their specific org might not be relevant for that post's 'organization' field.
    // Let's assign the author's org if present, otherwise handle based on visibility.
  }

  let postOrganization = author.organization;
  if (visibility === 'global' && author.role === 'superAdmin' && !author.organization) {
      // If a superAdmin has no org (e.g. system account) and posts globally, org can be a placeholder or null
      // For consistency, let's use a placeholder or ensure superAdmins also have an org.
      // For now, we'll stick to the rule that an org is needed if visibility is 'organization'.
      // If global, and author has no org, the post's org might be null or a special value.
      // Let's assume for now, global posts from anyone will still carry the author's org if available.
      // If author.organization is null (e.g. superAdmin from non-org domain), then postOrganization will be null.
      // This means global posts from such an admin won't be tied to a specific org.
      // This seems fine.
  } else if (!author.organization && visibility === 'organization') {
      return next(new ErrorResponse('Cannot create an organization-visible post without an assigned organization.', 400));
  }


  if (!title || !content) {
    return next(new ErrorResponse('Title and content are required.', 400));
  }

  const post = await Post.create({
    title,
    content,
    author: authorId,
    organization: postOrganization, // Set based on author or specific logic for global posts by certain roles
    visibility: visibility || 'organization', // Default to organization
    imageUrl,
    tags,
  });

  res.status(201).json({
    success: true,
    data: post,
  });
});

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (Author or Admin)
exports.updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  // Authorization: Check if user is the author or an admin
  const isAuthor = post.author.toString() === req.user.id;
  const isSuperAdmin = req.user.role === 'superAdmin';
  const isOrgAdminInSameOrg =
    req.user.role === 'orgAdmin' &&
    req.user.organization === post.organization;

  if (!isAuthor && !isSuperAdmin && !isOrgAdminInSameOrg) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to update this post.`, 403)
    );
  }

  // Fields that can be updated
  const { title, content, visibility, imageUrl, tags, status } = req.body;

  if (title) post.title = title;
  if (content) post.content = content;
  if (imageUrl) post.imageUrl = imageUrl; // Add validation if needed
  if (tags) post.tags = tags;

  // Visibility and Status changes might have specific rules or admin-only restrictions
  if (visibility) {
    // Only superAdmin can change a post's visibility to 'global' if it's from another org?
    // Or can authors make their own posts global?
    // Current User model requires author to have an org for org-visible posts.
    // If author changes visibility, ensure it's valid for their role/org.
    // For now, allow author or authorized admin to change it.
    // If changing to 'organization', ensure the post.organization is still valid or update if needed (complex).
    // Let's assume post.organization does not change with visibility updates by author for now.
    post.visibility = visibility;
  }

  if (status) { // Status changes usually by admins or specific user actions (e.g. author archiving)
    if (!isSuperAdmin && !isOrgAdminInSameOrg && status !== 'archived' /* allow author to archive */) {
         return next(new ErrorResponse('Only admins can change post status (except for author archiving).', 403));
    }
    post.status = status;
  }

  // The pre-save hook in Post model will set `updatedAt` and `isEdited`
  await post.save();

  res.status(200).json({
    success: true,
    data: post,
  });
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Author or Admin)
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  // Authorization: Check if user is the author or an admin
  const isAuthor = post.author.toString() === req.user.id;
  const isSuperAdmin = req.user.role === 'superAdmin';
  const isOrgAdminInSameOrg =
    req.user.role === 'orgAdmin' &&
    req.user.organization === post.organization;

  if (!isAuthor && !isSuperAdmin && !isOrgAdminInSameOrg) {
    return next(
      new ErrorResponse(`User ${req.user.id} is not authorized to delete this post.`, 403)
    );
  }

  await post.deleteOne(); // Changed from post.remove() for Mongoose v6+ compatibility

  res.status(200).json({
    success: true,
    data: {}, // Or a message: { message: "Post deleted successfully" }
  });
});


// @desc    Get a single post by ID
// @route   GET /api/posts/:id
// @access  Public (or Private if all posts require login to view) - Let's assume Private for now
exports.getPostById = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id).populate('author', 'username email organization');

  if (!post) {
    return next(
      new ErrorResponse(`Post not found with id of ${req.params.id}`, 404)
    );
  }

  // Authorization: Check if user can view this post based on visibility
  // If post is 'organization' visible, user must belong to that organization OR be a superAdmin.
  // If post is 'global', anyone logged in can view.
  // req.user is available from 'protect' middleware which should be applied to this route.

  if (post.visibility === 'organization') {
    if (!req.user || (req.user.organization !== post.organization && req.user.role !== 'superAdmin')) {
      return next(
        new ErrorResponse(
          `Not authorized to view this post. It is restricted to organization: ${post.organization}.`,
          403
        )
      );
    }
  }
  // Global posts are viewable by any authenticated user.

  // Increment view count (simple increment, can be made more robust to avoid double counting from same user in short time)
  // Only increment if the user viewing is not the author? Optional.
  if (post.author.toString() !== req.user.id) {
    post.viewCount = (post.viewCount || 0) + 1;
    // Save is done below if other operations also modify the post, or separately if only view count changes.
    // For simplicity, we'll save it here.
    // Consider if this save should be conditional or if other parts of the request handling also save.
    // await post.save({ validateBeforeSave: false });
  }
  // Re-evaluating: viewCount increment should be atomic or handled carefully if post is fetched for other reasons.
  // For now, let's do it before sending response, and after auth checks.
  // The save will be part of the post.save() call for viewCount specifically.
  if (!post.viewCount) post.viewCount = 0;
  post.viewCount++;
  await Post.findByIdAndUpdate(req.params.id, { viewCount: post.viewCount });


  res.status(200).json({
    success: true,
    data: post, // This post data might not have the latest viewCount if not re-fetched.
                // Let's return the post object we have, viewCount on it is updated.
  });
});

// @desc    Like/Unlike a post
// @route   PUT /api/posts/:id/like  (Using PUT as it's idempotent for a user's like status)
// @access  Private
exports.toggleLikePost = asyncHandler(async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = await Post.findById(postId);

  if (!post) {
    return next(new ErrorResponse(`Post not found with id of ${postId}`, 404));
  }

  // Check visibility before allowing like (same logic as getPostById)
  if (post.visibility === 'organization') {
    if (!req.user || (req.user.organization !== post.organization && req.user.role !== 'superAdmin')) {
      return next(new ErrorResponse(`Not authorized to interact with this post.`, 403));
    }
  }

  const isLiked = post.likes.some(likeId => likeId.equals(userId));

  if (isLiked) {
    // Unlike the post
    post.likes = post.likes.filter(likeId => !likeId.equals(userId));
  } else {
    // Like the post
    post.likes.push(userId);
  }

  await post.save();

  res.status(200).json({
    success: true,
    data: {
        likesCount: post.likes.length,
        isLikedByCurrentUser: !isLiked // The new state
    },
  });
});

// @desc    Flag a post
// @route   POST /api/posts/:id/flag
// @access  Private
const FlaggedPost = require('../models/FlaggedPost'); // Import FlaggedPost model

exports.flagPost = asyncHandler(async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.user.id;
  const { reason } = req.body;

  if (!reason) {
    return next(new ErrorResponse('A reason for flagging is required.', 400));
  }
  if (reason.length < 10 || reason.length > 500) {
    return next(new ErrorResponse('Reason must be between 10 and 500 characters.', 400));
  }

  const postToFlag = await Post.findById(postId).populate('author', 'organization');;

  if (!postToFlag) {
    return next(new ErrorResponse(`Post not found with id of ${postId}`, 404));
  }

  // Prevent user from flagging their own post
  if (postToFlag.author._id.equals(userId)) {
    return next(new ErrorResponse('You cannot flag your own post.', 400));
  }

  // Check visibility before allowing flag (similar to like/bookmark)
  if (postToFlag.visibility === 'organization') {
    if (!req.user || (req.user.organization !== postToFlag.organization && req.user.role !== 'superAdmin')) {
      return next(new ErrorResponse(`Not authorized to interact with this post.`, 403));
    }
  }

  // Check if this user has already flagged this post and it's still pending
  const existingPendingFlag = await FlaggedPost.findOne({
    post: postId,
    flaggedBy: userId,
    status: 'pending',
  });

  if (existingPendingFlag) {
    return next(new ErrorResponse('You have already flagged this post, and it is pending review.', 400));
  }

  const flaggedPost = await FlaggedPost.create({
    post: postId,
    postAuthor: postToFlag.author._id,
    postOrganization: postToFlag.organization, // Denormalized from the post itself
    flaggedBy: userId,
    reason: reason,
    // status is 'pending' by default
  });

  // Optional: Change post status to 'pending_review' if it's the first flag or meets a threshold
  // if (postToFlag.status === 'active') {
  //    const flagCount = await FlaggedPost.countDocuments({ post: postId, status: 'pending' });
  //    if (flagCount >= SOME_THRESHOLD || flagCount === 1) { // e.g. first flag or 3 flags
  //        postToFlag.status = 'pending_review';
  //        await postToFlag.save();
  //    }
  // }

  res.status(201).json({
    success: true,
    message: 'Post flagged successfully. It will be reviewed by an administrator.',
    data: flaggedPost,
  });
});

// @desc    Get all global posts (paginated)
// @route   GET /api/posts/type/global
// @access  Private (any authenticated user can see global posts)
exports.getGlobalPosts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const query = {
    visibility: 'global',
    status: 'active', // Only show active posts
  };

  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .populate('author', 'username organization')
    .sort({ createdAt: -1 }) // Sort by newest first
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: posts.length,
    totalPosts: total,
    pagination,
    data: posts,
  });
});

// @desc    Get all posts for the user's organization (paginated)
// @route   GET /api/posts/type/organization
// @access  Private (user must belong to an organization)
exports.getOrganizationPosts = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const userOrganization = req.user.organization;

  if (!userOrganization && req.user.role !== 'superAdmin') {
    // If user is not superAdmin and has no organization, they can't see organization posts.
    return next(new ErrorResponse('User does not belong to an organization.', 400));
  }

  const query = {
    visibility: 'organization',
    status: 'active', // Only show active posts
  };

  // If user is superAdmin, they can optionally filter by a specific organization via query param
  // Otherwise, they see their own organization's posts (if they have one) or all org posts (if they don't and query for all).
  // For now, let's keep it simple: orgAdmins/users see their org. SuperAdmins could see all org posts or filter.
  // If a superAdmin wants to see *a specific* org's posts:
  if (req.user.role === 'superAdmin' && req.query.orgId) {
    query.organization = req.query.orgId;
  } else if (userOrganization) { // For regular users or admins without a specific orgId query
    query.organization = userOrganization;
  } else if (req.user.role === 'superAdmin' && !req.query.orgId) {
    // SuperAdmin wants all organization-visible posts from all orgs
    // No additional organization filter needed for query in this case.
  } else {
    // User has no org and is not superAdmin, or superAdmin is trying to query without orgId and has no default org.
    // This case should be handled by the initial check, but as a safeguard:
    return res.status(200).json({ // Return empty if no org context
        success: true,
        count: 0,
        totalPosts: 0,
        pagination: {},
        data: [],
    });
  }


  const total = await Post.countDocuments(query);
  const posts = await Post.find(query)
    .populate('author', 'username organization')
    .sort({ createdAt: -1 }) // Sort by newest first
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }
  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: posts.length,
    totalPosts: total,
    pagination,
    data: posts,
  });
});


// @desc    Bookmark/Unbookmark a post
// @route   PUT /api/posts/:id/bookmark (Using PUT for idempotency of bookmark status)
// @access  Private
exports.toggleBookmarkPost = asyncHandler(async (req, res, next) => {
  const postId = req.params.id;
  const userId = req.user.id;

  const post = await Post.findById(postId);

  if (!post) {
    return next(new ErrorResponse(`Post not found with id of ${postId}`, 404));
  }

  // Check visibility before allowing bookmark (same logic as getPostById)
  if (post.visibility === 'organization') {
    if (!req.user || (req.user.organization !== post.organization && req.user.role !== 'superAdmin')) {
      return next(new ErrorResponse(`Not authorized to interact with this post.`, 403));
    }
  }

  const isBookmarked = post.bookmarks.some(bookmarkId => bookmarkId.equals(userId));

  if (isBookmarked) {
    // Unbookmark the post
    post.bookmarks = post.bookmarks.filter(bookmarkId => !bookmarkId.equals(userId));
  } else {
    // Bookmark the post
    post.bookmarks.push(userId);
  }

  await post.save();

  res.status(200).json({
    success: true,
    data: {
        bookmarksCount: post.bookmarks.length, // Optional to return count
        isBookmarkedByCurrentUser: !isBookmarked // The new state
    },
  });
});
