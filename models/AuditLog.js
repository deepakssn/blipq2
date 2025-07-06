const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { // User who performed the action. Can be null if action is pre-auth (e.g. failed login attempt)
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    index: true,
  },
  action: { // e.g., 'USER_LOGIN', 'CREATE_POST', 'UPDATE_DOMAIN', 'ASSIGN_ROLE'
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true,
  },
  targetType: { // Optional: The type of entity affected e.g., 'Post', 'User', 'Domain'
    type: String,
    trim: true,
    // enum: ['Post', 'User', 'Domain', 'Auth', 'System'] // Example enum
  },
  targetId: { // Optional: The ID of the entity affected
    type: mongoose.Schema.ObjectId,
    refPath: 'targetType', // Dynamically references based on targetType
  },
  organization: { // Optional: Organization context of the user or action
    type: String,
    trim: true,
    index: true,
  },
  details: { // Additional information, like changed fields, parameters, error messages
    type: mongoose.Schema.Types.Mixed, // Allows for flexible object storage
  },
  ipAddress: {
    type: String,
  },
  userAgent: { // Browser/client info
    type: String,
  },
  statusCode: { // HTTP status code of the response related to this action
      type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Compound index for common filtering
AuditLogSchema.index({ organization: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ user: 1, action: 1, timestamp: -1 });


// Helper function to create log (can be called from middleware or services)
// Static method on the schema
AuditLogSchema.statics.createLog = async function(logData) {
    try {
        // Sanitize or select details to log if necessary
        const logEntry = {
            user: logData.user || null,
            action: logData.action,
            targetType: logData.targetType,
            targetId: logData.targetId,
            organization: logData.organization,
            details: logData.details || {},
            ipAddress: logData.ipAddress,
            userAgent: logData.userAgent,
            statusCode: logData.statusCode,
            timestamp: logData.timestamp || Date.now()
        };
        await this.create(logEntry);
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Decide how to handle logging failure (e.g., log to console, another service)
        // Avoid letting audit log failure break the main application flow if possible.
    }
};


module.exports = mongoose.model('AuditLog', AuditLogSchema);
