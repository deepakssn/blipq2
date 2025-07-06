const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const { sendVerificationEmail } = require('../utils/emailUtils');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Domain = require('../models/Domain'); // Moved Domain import to the top

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;
  let requestedRole = req.body.role; // Use a different variable for the input role

  const emailDomain = email.substring(email.lastIndexOf('@') + 1).toLowerCase();

  // Fetch active allowed domains from DB
  const activeDbDomains = await Domain.find({ domainName: emailDomain, isActive: true });
  const isDomainAllowedInDB = activeDbDomains.length > 0;

  // SUPERADMIN_DOMAINS from .env can still be used for initial superAdmin creation logic,
  // but they should also ideally be in the DB as 'active' for general validation.
  const superAdminEnvDomains = (process.env.SUPERADMIN_DOMAINS || '').toLowerCase().split(',');
  const isSuperAdminDomainEnv = superAdminEnvDomains.includes(emailDomain);

  let effectiveRole = 'user'; // Default role

  if (requestedRole) { // If a role is explicitly passed in request
    if (!['user', 'orgAdmin', 'superAdmin'].includes(requestedRole)) {
      return next(new ErrorResponse(`Invalid role specified: ${requestedRole}`, 400));
    }
    if (requestedRole === 'superAdmin') {
      // To be superAdmin, domain must be in SUPERADMIN_DOMAINS env var AND (ideally) in DB as active.
      // Or, this is a very first superadmin setup.
      // For now, let's say if requestedRole=superAdmin is requested, domain must match SUPERADMIN_DOMAINS env.
      if (!isSuperAdminDomainEnv) {
        return next(new ErrorResponse(`Domain ${emailDomain} is not configured for superAdmin role assignment.`, 403));
      }
      // And the domain should also be generally allowed (active in DB) or it's a bootstrap scenario.
      // If it's not in DB but is in SUPERADMIN_DOMAINS, this might be an initial seed user.
      if (!isDomainAllowedInDB && !isSuperAdminDomainEnv) { // Stricter: must be in DB too unless it's a super admin domain from env
          // This logic can be complex depending on seeding strategy.
          // For now, if isSuperAdminDomainEnv is true, we allow potential superAdmin role.
      }
      effectiveRole = 'superAdmin';
    } else if (requestedRole === 'orgAdmin') {
      // orgAdmin role should typically be assigned by a superAdmin post-registration.
      // Allowing self-assigned orgAdmin during registration is risky.
      // We will ignore self-assigned 'orgAdmin' and default to 'user' unless it's a superAdmin.
      // Or, for now, disallow 'orgAdmin' role in registration payload by non-superAdmins.
       return next(new ErrorResponse(`Role 'orgAdmin' cannot be self-assigned during registration. It must be granted by a superAdmin.`, 403));
    } else { // requestedRole === 'user'
      effectiveRole = 'user';
    }
  }

  // Final check for domain allowance for the determined role
  if (effectiveRole === 'superAdmin') {
    if (!isSuperAdminDomainEnv) { // Redundant if checked above, but for clarity
        return next(new ErrorResponse(`Domain ${emailDomain} is not allowed for superAdmin registration.`, 403));
    }
    // SuperAdmins might register even if their domain isn't in the general 'Domain' table initially, using .env.
    // However, their organization might be null then.
  } else { // For 'user' role (and implicitly 'orgAdmin' if we were to allow it based on domain type later)
    if (!isDomainAllowedInDB) {
        return next(new ErrorResponse(`Domain ${emailDomain} is not allowed for registration.`, 403));
    }
  }


  // Check if user already exists
  let existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorResponse('User already exists with this email.', 400));
  }
  existingUser = await User.findOne({ username });
  if (existingUser) {
    return next(new ErrorResponse('Username is already taken.', 400));
  }

  // Create user (isVerified will be false by default from schema)
  const user = new User({
    username,
    email,
    password,
    role: effectiveRole, // Assign determined or validated role
  });

  // Create email verification token (using method from User model)
  const verificationToken = user.getEmailVerificationToken();
  await user.save(); // Save user to get _id and to save the token fields

  try {
    await sendVerificationEmail(user.email, verificationToken, req);

    res.status(201).json({
      success: true,
      message: `User registered successfully. A verification email has been sent to ${user.email}. Please verify your account.`,
    });
  } catch (err) {
    console.error('Email sending error during registration:', err);
    // If email sending fails, we might want to:
    // 1. Delete the user to allow them to try registering again.
    // 2. Or, leave the user and allow a "resend verification email" option.
    // For now, let's assume the user is created but email failed.
    // They would need a resend mechanism.
    // Clear the tokens if email failed, so they can re-register or resend.
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    // Consider if user should be deleted or not upon email failure.
    // For simplicity now, we'll leave the user and let them try to verify later or request resend.
    // await User.findByIdAndDelete(user._id); // Option to delete user
    await user.save({ validateBeforeSave: false }); // Save cleared tokens

    return next(
      new ErrorResponse(
        'User registered, but failed to send verification email. Please try the "resend verification" option or contact support.',
        500 // Server error because email failed
      )
    );
  }
});


// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res, next) => {
  // Get token from params and hash it (as stored token is hashed)
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired verification token.', 400));
  }

  // Set user as verified
  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpires = undefined;

  // Set organization based on email domain
  user.setOrganizationFromEmail();

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now log in.',
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password'); // Explicitly select password

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if user is verified
  if (!user.isVerified) {
    // Optional: Resend verification email or prompt user
    // For now, just inform them.
    return next(
      new ErrorResponse(
        'Your account is not verified. Please check your email for a verification link.',
        401 // Unauthorized or 403 Forbidden could also be used
      )
    );
  }

  // User is valid and verified, create tokens
  sendTokenResponse(user, 200, res);
});


// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = user.getSignedJwtToken();
  const refreshToken = user.getRefreshToken(); // Assuming you have this method in User model

  const options = {
    expires: new Date(
      Date.now() + (parseInt(process.env.JWT_COOKIE_EXPIRE_DAYS, 10) || 30) * 24 * 60 * 60 * 1000 // Default to 30 days
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  // You can send tokens in cookies or in the response body.
  // Sending in response body is common for APIs consumed by mobile apps or SPAs.
  // Cookies are good for web apps. We'll send in body and optionally set cookies.

  res
    .status(statusCode)
    // .cookie('refreshToken', refreshToken, options) // Example for refresh token in cookie
    .json({
      success: true,
      accessToken,
      refreshToken, // Send refresh token in body as well
      user: { // Send some user info
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        organization: user.organization
      }
    });
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public (as it requires a valid refresh token)
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new ErrorResponse('Refresh token is required', 400));
  }

  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user by ID from refresh token
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse('Invalid refresh token (user not found)', 401));
    }

    // Optional: Check if user is still active/verified if needed
    if (!user.isVerified) {
        return next(new ErrorResponse('User account not verified', 401));
    }

    // Issue a new access token
    const newAccessToken = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });

  } catch (err) {
    // This will catch errors like invalid signature, token expired for the refresh token
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return next(new ErrorResponse('Invalid or expired refresh token', 401));
    }
    return next(err); // For other unexpected errors
  }
});

// @desc    Log user out / clear cookie (conceptual for API tokens in body)
// @route   POST /api/auth/logout
// @access  Private (requires a valid token to "logout")
exports.logout = asyncHandler(async (req, res, next) => {
  // For stateless JWTs, the client is responsible for deleting the token.
  // If tokens were stored in HttpOnly cookies, you would clear them here:
  // res.cookie('accessToken', 'none', {
  //   expires: new Date(Date.now() + 10 * 1000), // Expire in 10 secs
  //   httpOnly: true,
  // });
  // res.cookie('refreshToken', 'none', {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true,
  // });

  res.status(200).json({
    success: true,
    message: 'User logged out successfully (client should clear tokens).',
  });
});
