const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // Else if (req.cookies.token) { // Alternative: Set token from cookie
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route (no token)', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token, excluding password
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
        // This case handles if a token is valid but the user has been deleted
        return next(new ErrorResponse('User not found for this token', 404));
    }

    // Check if user is verified (optional, depends on if you want to re-check on every request)
    // if (!req.user.isVerified) {
    //     return next(new ErrorResponse('User account not verified', 401));
    // }


    next();
  } catch (err) {
    // This will catch errors like invalid signature, token expired, etc.
    if (err.name === 'JsonWebTokenError') {
        return next(new ErrorResponse('Not authorized to access this route (invalid token)', 401));
    }
    if (err.name === 'TokenExpiredError') {
        return next(new ErrorResponse('Not authorized to access this route (token expired)', 401));
    }
    // For other errors, pass them along
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // req.user should be set by the 'protect' middleware before this runs
    if (!req.user) {
        // This should ideally not happen if 'protect' runs first and is required.
        return next(new ErrorResponse('User not found, authorization check failed', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role '${req.user.role}' is not authorized to access this route. Allowed roles: ${roles.join(', ')}.`,
          403 // Forbidden
        )
      );
    }
    next();
  };
};
