const AuditLog = require('../models/AuditLog');

const auditLog = (action, targetTypeResolver = null) => async (req, res, next) => {
  // Call next() first to process the request and get response status
  // We need a way to capture response status code. res.on('finish', ...) is common.

  const originalSend = res.send;
  let responseBody = null; // To capture response body if needed, carefully due to size

  // res.send = function (body) {
  //   responseBody = body; // Capture response body
  //   originalSend.call(this, body);
  // };

  res.on('finish', async () => {
    try {
      const logData = {
        user: req.user ? req.user.id : null, // User from protect middleware
        action: action || `${req.method}_${req.path.replace(/\//g, '_').toUpperCase()}`, // Default action if not provided
        organization: req.user ? req.user.organization : null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        statusCode: res.statusCode,
        details: {
          method: req.method,
          path: req.path,
          originalUrl: req.originalUrl,
          params: req.params,
          query: req.query,
          // body: req.body, // Be careful logging full request body due to PII/sensitivity
          // responseBody: responseBody // Also be careful with response body
        },
        timestamp: new Date()
      };

      // Resolve targetType and targetId if a resolver function is provided
      if (typeof targetTypeResolver === 'function') {
        const targetInfo = targetTypeResolver(req, res); // res might not be useful here
        if (targetInfo) {
          logData.targetType = targetInfo.targetType;
          logData.targetId = targetInfo.targetId;
          if (targetInfo.details) {
            logData.details = { ...logData.details, ...targetInfo.details };
          }
        }
      } else if (req.params && req.params.id) { // Basic attempt to get targetId from params
          logData.targetId = req.params.id;
          // targetType would need more context here, often related to the route itself
          // e.g. if on /api/posts/:id, targetType is 'Post'
      }


      // Redact sensitive information from req.body if logging it
      if (req.body) {
        const sensitiveFields = ['password', 'newPassword', 'confirmPassword', 'token', 'refreshToken'];
        const redactedBody = { ...req.body };
        sensitiveFields.forEach(field => {
          if (redactedBody[field]) redactedBody[field] = '[REDACTED]';
        });
        logData.details.body = redactedBody;
      }

      await AuditLog.createLog(logData);

    } catch (error) {
      console.error('Error in audit logging middleware:', error);
      // Do not let audit logging failures affect the main request flow
    }
  });

  next(); // Continue to the actual route handler
};

// Specific loggers can be created using this generic one, or called directly
// Example: const logLoginAttempt = auditLog('USER_LOGIN_ATTEMPT');

module.exports = auditLog;
