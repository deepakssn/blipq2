const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const Domain = require('../models/Domain'); // Import Domain model

// @desc    Get current logged-in user (profile)
// @route   GET /api/users/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  // req.user is set by the 'protect' middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    // This case should ideally not happen if protect middleware is working correctly
    // and user hasn't been deleted between token issuance and this request.
    return next(new ErrorResponse(`User not found with ID ${req.user.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: user, // User model by default excludes password
  });
});

// @desc    Update user profile details (username, password)
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { username, password, email } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId);

  if (!user) {
    // Should not happen if 'protect' middleware is effective
    return next(new ErrorResponse(`User not found`, 404));
  }

  // Update username if provided and different
  if (username && username !== user.username) {
    // Check if new username is already taken by another user
    const existingUser = await User.findOne({ username: username });
    if (existingUser && existingUser._id.toString() !== userId) {
        return next(new ErrorResponse(`Username '${username}' is already taken.`, 400));
    }
    user.username = username;
  }

  // Update email if provided and different
  // IMPORTANT: Changing email typically requires a re-verification process.
  // For this iteration, if email is changed, we will mark the user as unverified
  // and trigger a new verification email.
  if (email && email !== user.email) {
    // Check if new email is already taken by another user
    const existingUser = await User.findOne({ email: email });
    if (existingUser && existingUser._id.toString() !== userId) {
        return next(new ErrorResponse(`Email '${email}' is already registered.`, 400));
    }

    // Check domain if email is changed
    const newEmailDomain = email.substring(email.lastIndexOf('@') + 1).toLowerCase();
    const activeDbDomain = await Domain.findOne({ domainName: newEmailDomain, isActive: true });
    const isNewDomainAllowedInDB = !!activeDbDomain;

    const superAdminEnvDomains = (process.env.SUPERADMIN_DOMAINS || '').toLowerCase().split(',');
    const isNewDomainSuperAdminEnv = superAdminEnvDomains.includes(newEmailDomain);

    let isValidDomainChange = false;
    if (user.role === 'superAdmin') {
        // SuperAdmins can change to an email domain if it's a SUPERADMIN_DOMAIN (from env)
        // OR if it's a generally allowed domain in the DB.
        if (isNewDomainSuperAdminEnv || isNewDomainAllowedInDB) {
            isValidDomainChange = true;
        }
    } else { // 'orgAdmin' or 'user'
        // Regular users/orgAdmins can only change to an email domain that is generally allowed in DB.
        // They cannot change to a superAdminEnvDomain unless it's also in the DB as allowed.
        if (isNewDomainAllowedInDB) {
            isValidDomainChange = true;
        }
    }

    if (!isValidDomainChange) {
        return next(new ErrorResponse(`Cannot change email to domain '${newEmailDomain}'. It is not allowed or not active.`, 400));
    }

    // If email is changed, user needs to re-verify.
    // Also, generate new verification token and attempt to send email.
    user.email = email;
    user.isVerified = false;
    user.setOrganizationFromEmail(); // Update organization based on new email

    const verificationToken = user.getEmailVerificationToken(); // Assumes User model has this method
    // user.save() will be called later, which saves the token too.

    try {
        // We need 'req' to build the full URL for sendVerificationEmail
        // This function signature might need adjustment if req is not naturally available
        // For now, assuming we can pass 'req' or construct URL differently.
        // Let's call a generic send email for now, or make a note to refactor how verification URL is built.
        // The sendVerificationEmail utility needs req for protocol and host.
        // This is a good candidate for a TODO or slight refactor if req isn't easily passed.
        // For now, we'll attempt it, assuming 'req' is accessible or can be passed.
        // This part is tricky as sendVerificationEmail is in utils and might not have req.
        // Let's call user.save() here to save the token, then try to send email.
        await user.save({ validateBeforeSave: false }); // Save user with new email and verification token

        // Attempt to send new verification email (This part needs careful review of dependencies for 'req')
        // For now, we will just mark as unverified. The user would need to use a "resend verification" flow.
        // TODO: Properly integrate sending a new verification email when user changes their email address.
        // This might involve:
        // 1. Modifying sendVerificationEmail to not strictly depend on 'req' if possible (e.g. base URL from config)
        // 2. Having a UserActivationService that handles these things.
        console.log(`User ${user.username} changed email. New verification token generated. Manual re-send of verification email needed for now.`);

    } catch (emailError) {
        console.error(`Failed to send new verification email for ${user.email}: ${emailError.message}`);
        // Don't fail the profile update if email sending fails, but log it.
        // The user is already marked as unverified.
    }
  }


  // Update password if provided
  if (password) {
    if (password.length < 6) {
        return next(new ErrorResponse('Password must be at least 6 characters long.', 400));
    }
    user.password = password; // The pre-save hook in User model will hash it
  }

  // Save the updated user
  // The pre-save hook for password hashing will run if password was changed.
  const originalEmailBeforeUpdate = user.email; // Store original email before any changes

  try {
    await user.save(); // Main save operation for all accumulated changes
  } catch (error) {
    // Handle potential errors from save, like validation errors if any apply
    return next(error);
  }

  let message = 'Profile updated successfully.';
  // Check if email was actually changed and user is now unverified
  if (user.email !== originalEmailBeforeUpdate && !user.isVerified) {
    message = 'Profile updated. Your email address was changed and now requires re-verification. (Feature to automatically send new verification email is pending implementation).';
  }


  res.status(200).json({
    success: true,
    message: message,
    data: { // Return some basic info, not the full user object if password was selected
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        organization: user.organization
    }
  });
});

// @desc    Get all users (Admin)
// @route   GET /api/users
// @access  Private/Admin (superAdmin, orgAdmin)
exports.getAllUsers = asyncHandler(async (req, res, next) => {
  let query;

  if (req.user.role === 'superAdmin') {
    // SuperAdmin can see all users
    query = User.find();
  } else if (req.user.role === 'orgAdmin') {
    // OrgAdmin can only see users in their own organization
    if (!req.user.organization) {
        // This case should ideally not happen if orgAdmin always has an organization
        return next(new ErrorResponse('Organization admin does not have an assigned organization.', 400));
    }
    query = User.find({ organization: req.user.organization });
  } else {
    // This case should be caught by the authorize middleware, but as a safeguard:
    return next(new ErrorResponse('Not authorized to view all users.', 403));
  }

  // Select fields to return (e.g., exclude password by default, which schema already does)
  // Add pagination later if needed
  const users = await query;

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});
