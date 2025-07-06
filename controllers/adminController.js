const Domain = require('../models/Domain');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const AuditLog = require('../models/AuditLog');
const FlaggedPost = require('../models/FlaggedPost');
const Post = require('../models/Post'); // Import Post model

// @desc    Add a new allowed domain
// @route   POST /api/admin/domains
// @access  Private (superAdmin only)
exports.addAllowedDomain = asyncHandler(async (req, res, next) => {
  const { domainName, description } = req.body;

  if (!domainName) {
    return next(new ErrorResponse('Domain name is required.', 400));
  }

  // Check if domain already exists
  const existingDomain = await Domain.findOne({ domainName: domainName.toLowerCase() });
  if (existingDomain) {
    return next(new ErrorResponse(`Domain '${domainName}' already exists.`, 400));
  }

  const domain = await Domain.create({
    domainName: domainName.toLowerCase(),
    description,
    addedBy: req.user.id, // Logged-in superAdmin
  });

  res.status(201).json({
    success: true,
    data: domain,
  });
});

// @desc    Get all allowed domains (paginated)
// @route   GET /api/admin/domains
// @access  Private (superAdmin only)
exports.getAllowedDomains = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const isActiveFilter = req.query.isActive; // e.g. ?isActive=true or ?isActive=false

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  let query = {};
  if (isActiveFilter !== undefined) {
      query.isActive = isActiveFilter === 'true';
  }

  const total = await Domain.countDocuments(query);
  const domains = await Domain.find(query)
    .populate('addedBy', 'username email') // Populate who added the domain
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  const pagination = {};
  if (endIndex < total) {
    pagination.next = { page: page + 1, limit };
  }
  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit };
  }

  res.status(200).json({
    success: true,
    count: domains.length,
    totalDomains: total,
    pagination,
    data: domains,
  });
});

// @desc    Update an allowed domain (description, isActive)
// @route   PUT /api/admin/domains/:id
// @access  Private (superAdmin only)
exports.updateAllowedDomain = asyncHandler(async (req, res, next) => {
    const { description, isActive } = req.body;
    const domainId = req.params.id;

    let domain = await Domain.findById(domainId);

    if (!domain) {
        return next(new ErrorResponse(`Domain not found with ID ${domainId}`, 404));
    }

    if (description !== undefined) {
        domain.description = description;
    }
    if (isActive !== undefined) {
        domain.isActive = isActive;
    }
    // domainName change is generally not allowed or is a more complex operation (delete and re-add)

    await domain.save();

    res.status(200).json({
        success: true,
        data: domain,
    });
});


// @desc    Remove/Delete an allowed domain
// @route   DELETE /api/admin/domains/:id
// @access  Private (superAdmin only)
// Note: Consider soft delete (setting isActive=false) vs hard delete.
// Hard delete is simpler for now. Soft delete is done by PUT to isActive=false.
exports.deleteAllowedDomain = asyncHandler(async (req, res, next) => {
    const domainId = req.params.id;
    const domain = await Domain.findById(domainId);

    if (!domain) {
        return next(new ErrorResponse(`Domain not found with ID ${domainId}`, 404));
    }

    // Potentially check if any users are registered with this domain before deleting.
    // Or if this domain is critical (e.g., a superAdmin registration domain).
    // For now, direct delete.

    await domain.deleteOne();

    res.status(200).json({
        success: true,
        message: `Domain '${domain.domainName}' deleted successfully.`,
        data: {}
    });
});

// @desc    Assign orgAdmin role to a user
// @route   PUT /api/admin/users/:userId/assign-org-admin
// @access  Private (superAdmin only)
exports.assignOrgAdminRole = asyncHandler(async (req, res, next) => {
    const userIdToUpdate = req.params.userId;

    const userToUpdate = await User.findById(userIdToUpdate);

    if (!userToUpdate) {
        return next(new ErrorResponse(`User not found with ID ${userIdToUpdate}`, 404));
    }

    // Prevent superAdmins from being demoted or changed via this specific endpoint
    if (userToUpdate.role === 'superAdmin') {
        return next(new ErrorResponse('Cannot change the role of a superAdmin using this endpoint.', 400));
    }

    // User must be verified and belong to an organization to become an orgAdmin
    if (!userToUpdate.isVerified) {
        return next(new ErrorResponse(`User ${userToUpdate.username} must be verified to become an orgAdmin.`, 400));
    }
    if (!userToUpdate.organization) {
        return next(new ErrorResponse(`User ${userToUpdate.username} must belong to an organization to become an orgAdmin.`, 400));
    }

    // If user is already an orgAdmin, no change needed
    if (userToUpdate.role === 'orgAdmin') {
        return res.status(200).json({
            success: true,
            message: `User ${userToUpdate.username} is already an orgAdmin.`,
            data: userToUpdate,
        });
    }

    const oldRole = userToUpdate.role;
    userToUpdate.role = 'orgAdmin';
    await userToUpdate.save();

    // Audit log
    await AuditLog.createLog({
        user: req.user.id, // superAdmin performing the action
        action: 'ASSIGN_ORG_ADMIN_ROLE_SUCCESS',
        targetType: 'User',
        targetId: userToUpdate._id,
        organization: req.user.organization, // superAdmin's org, or null
        details: {
            targetUserId: userToUpdate._id,
            targetUsername: userToUpdate.username,
            assignedRole: 'orgAdmin',
            previousRole: oldRole,
            performedBy: req.user.username
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        statusCode: 200
    });

    res.status(200).json({
        success: true,
        message: `Role 'orgAdmin' assigned to user ${userToUpdate.username} for organization ${userToUpdate.organization}.`,
        data: {
            _id: userToUpdate._id,
            username: userToUpdate.username,
            email: userToUpdate.email,
            role: userToUpdate.role,
            organization: userToUpdate.organization
        }
    });
});

// @desc    Get flagged posts (paginated, filterable by status, organization)
// @route   GET /api/admin/flagged-posts
// @access  Private (superAdmin, orgAdmin for their org)
const FlaggedPost = require('../models/FlaggedPost'); // Ensure FlaggedPost model is imported

exports.getFlaggedPosts = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status, organizationId, postId, flaggedById, authorId } = req.query; // More filters

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let query = {};

    // Role-based access to flagged posts
    if (req.user.role === 'orgAdmin') {
        if (!req.user.organization) {
            return next(new ErrorResponse('Organization admin not associated with an organization.', 400));
        }
        // OrgAdmins can only see flagged posts from their own organization
        query.postOrganization = req.user.organization;
        if (organizationId && organizationId !== req.user.organization) {
             return next(new ErrorResponse('OrgAdmins can only view flagged posts from their own organization.', 403));
        }
    } else if (req.user.role === 'superAdmin' && organizationId) {
        // SuperAdmin can filter by a specific post's organization if provided
        query.postOrganization = organizationId;
    }
    // If superAdmin and no organizationId, they see flagged posts from all orgs.

    if (status) query.status = status;
    if (postId) query.post = postId;
    if (flaggedById) query.flaggedBy = flaggedById;
    if (authorId) query.postAuthor = authorId;


    const total = await FlaggedPost.countDocuments(query);
    const flaggedPosts = await FlaggedPost.find(query)
        .populate('post', 'title content visibility author')
        .populate('flaggedBy', 'username email')
        .populate('reviewedBy', 'username email')
        .populate('postAuthor', 'username email organization')
        .sort({ status: 1, createdAt: -1 }) // Show pending first, then by date
        .skip(startIndex)
        .limit(limit);

    const pagination = {};
    if (endIndex < total) {
        pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
        pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
        success: true,
        count: flaggedPosts.length,
        totalFlaggedPosts: total,
        pagination,
        data: flaggedPosts,
    });
});

// @desc    Review a flagged post (update status, add notes, potentially action post)
// @route   PUT /api/admin/flagged-posts/:flagId/review
// @access  Private (superAdmin, orgAdmin for their org)
exports.reviewFlaggedPost = asyncHandler(async (req, res, next) => {
    const flagId = req.params.flagId;
    const { status, adminNotes, actionOnPost } = req.body; // actionOnPost: e.g., 'remove_post', 'archive_post', 'change_visibility_org', 'no_action'

    if (!status || !['resolved_action_taken', 'resolved_dismissed', 'under_review'].includes(status)) {
        return next(new ErrorResponse("Invalid status provided. Must be 'under_review', 'resolved_action_taken', or 'resolved_dismissed'.", 400));
    }

    const flaggedPostEntry = await FlaggedPost.findById(flagId).populate('post');

    if (!flaggedPostEntry) {
        return next(new ErrorResponse(`Flagged post entry not found with ID ${flagId}`, 404));
    }

    // Authorization: Ensure admin is superAdmin or orgAdmin of the post's organization
    if (req.user.role === 'orgAdmin' && flaggedPostEntry.postOrganization !== req.user.organization) {
        return next(new ErrorResponse('OrgAdmins can only review flagged posts from their own organization.', 403));
    }

    // Prevent re-reviewing an already resolved flag unless specific logic allows it
    if (flaggedPostEntry.status.startsWith('resolved_')) {
        // return next(new ErrorResponse(`Flagged post ${flagId} has already been resolved.`, 400));
        // Or allow updating notes on an already resolved item
    }


    flaggedPostEntry.status = status;
    flaggedPostEntry.reviewedBy = req.user.id;
    flaggedPostEntry.reviewedAt = Date.now();
    if (adminNotes) {
        flaggedPostEntry.adminNotes = adminNotes;
    }

    let postActionMessage = "";

    // Handle actions on the original post if specified
    if (status === 'resolved_action_taken' && actionOnPost && flaggedPostEntry.post) {
        const originalPost = await Post.findById(flaggedPostEntry.post._id); // Re-fetch to be safe
        if (originalPost) {
            switch (actionOnPost) {
                case 'remove_post': // This could mean setting status to 'removed' or actual deletion
                    originalPost.status = 'removed'; // Soft delete
                    await originalPost.save();
                    postActionMessage = `Original post status set to 'removed'.`;
                    break;
                case 'archive_post':
                    originalPost.status = 'archived';
                    await originalPost.save();
                    postActionMessage = `Original post status set to 'archived'.`;
                    break;
                case 'change_visibility_org':
                    originalPost.visibility = 'organization';
                    await originalPost.save();
                    postActionMessage = `Original post visibility changed to 'organization'.`;
                    break;
                // Add more actions as needed: e.g., notify author, suspend user etc.
                default:
                    postActionMessage = `No specific action taken on post regarding '${actionOnPost}'.`;
            }
        } else {
             postActionMessage = `Original post ${flaggedPostEntry.post._id} not found for action.`;
        }
    }


    await flaggedPostEntry.save();

    // Audit Log for review action
    await AuditLog.createLog({
        user: req.user.id,
        action: 'REVIEW_FLAGGED_POST',
        targetType: 'FlaggedPost',
        targetId: flaggedPostEntry._id,
        organization: req.user.organization,
        details: {
            flaggedPostId: flaggedPostEntry._id,
            originalPostId: flaggedPostEntry.post ? flaggedPostEntry.post._id : null,
            newStatus: status,
            adminNotesProvided: !!adminNotes,
            actionTakenOnPost: actionOnPost || 'none',
            reviewedBy: req.user.username
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        statusCode: 200
    });


    res.status(200).json({
        success: true,
        message: `Flagged post review updated. ${postActionMessage}`.trim(),
        data: flaggedPostEntry,
    });
});


// @desc    Get audit logs (paginated, filterable)
// @route   GET /api/admin/audit-logs
// @access  Private (superAdmin, orgAdmin for their org)
exports.getAuditLogs = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { userId, action, targetType, targetId, organizationId, startDate, endDate, ipAddress } = req.query;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    let query = {};

    // Role-based access to logs
    if (req.user.role === 'orgAdmin') {
        if (!req.user.organization) {
            return next(new ErrorResponse('Organization admin not associated with an organization.', 400));
        }
        // OrgAdmins can only see logs related to their own organization
        query.organization = req.user.organization;
        // If they try to query for another org, override it or deny. For now, force their org.
        if (organizationId && organizationId !== req.user.organization) {
             return next(new ErrorResponse('OrgAdmins can only view logs for their own organization.', 403));
        }
    } else if (req.user.role === 'superAdmin' && organizationId) {
        // SuperAdmin can filter by a specific organization if provided
        query.organization = organizationId;
    }
    // If superAdmin and no organizationId, they see logs from all orgs (or no org context).

    if (userId) query.user = userId;
    if (action) query.action = { $regex: action, $options: 'i' }; // Case-insensitive partial match
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;
    if (ipAddress) query.ipAddress = ipAddress;

    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999)); // Include whole end day
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
        .populate('user', 'username email') // Populate user who performed action
        .sort({ timestamp: -1 }) // Newest logs first
        .skip(startIndex)
        .limit(limit);

    const pagination = {};
    if (endIndex < total) {
        pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
        pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
        success: true,
        count: logs.length,
        totalLogs: total,
        pagination,
        data: logs,
    });
});


// @desc    Revoke orgAdmin role from a user (set back to 'user')
// @route   PUT /api/admin/users/:userId/revoke-org-admin
// @access  Private (superAdmin only)
exports.revokeOrgAdminRole = asyncHandler(async (req, res, next) => {
    const userIdToUpdate = req.params.userId;

    const userToUpdate = await User.findById(userIdToUpdate);

    if (!userToUpdate) {
        return next(new ErrorResponse(`User not found with ID ${userIdToUpdate}`, 404));
    }

    // Prevent superAdmins from being demoted
    if (userToUpdate.role === 'superAdmin') {
        return next(new ErrorResponse('Cannot change the role of a superAdmin.', 400));
    }

    // If user is not currently an orgAdmin, no change needed (or inform)
    if (userToUpdate.role !== 'orgAdmin') {
        return res.status(200).json({
            success: true,
            message: `User ${userToUpdate.username} is not currently an orgAdmin. Their role remains ${userToUpdate.role}.`,
            data: userToUpdate,
        });
    }

    const oldRole = userToUpdate.role;
    userToUpdate.role = 'user'; // Demote to 'user'
    await userToUpdate.save();

    // Audit log
    await AuditLog.createLog({
        user: req.user.id, // superAdmin performing the action
        action: 'REVOKE_ORG_ADMIN_ROLE_SUCCESS',
        targetType: 'User',
        targetId: userToUpdate._id,
        organization: req.user.organization, // superAdmin's org, or null
        details: {
            targetUserId: userToUpdate._id,
            targetUsername: userToUpdate.username,
            revokedRole: 'orgAdmin',
            newRole: 'user',
            previousRole: oldRole,
            performedBy: req.user.username
        },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        statusCode: 200
    });

    res.status(200).json({
        success: true,
        message: `Role 'orgAdmin' revoked from user ${userToUpdate.username}. User is now a regular 'user'.`,
        data: {
            _id: userToUpdate._id,
            username: userToUpdate.username,
            email: userToUpdate.email,
            role: userToUpdate.role,
            organization: userToUpdate.organization
        }
    });
});
