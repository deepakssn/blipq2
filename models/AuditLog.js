const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
    userId: { // Can be null if action is system-generated or by an unauthenticated user (if applicable)
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    email: { // Denormalized for easier querying without populating user, especially if user is deleted
        type: String,
        trim: true,
        lowercase: true
    },
    domain: { // Denormalized for easier querying
        type: String,
        trim: true,
        lowercase: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    targetId: { // ID of the entity being acted upon (e.g., Post ID, User ID)
        type: Schema.Types.ObjectId,
        index: true
    },
    metadata: { // Flexible field for additional information, like IP address, old/new values, etc.
        type: Schema.Types.Mixed
    },
    timestamp: { // Specific timestamp for the audit event, separate from document creation time
        type: Date,
        default: Date.now,
        index: true
    }
}, { timestamps: { createdAt: true, updatedAt: false } }); // Document createdAt, but main time is 'timestamp'

// Indexes
// Compound indexes can be added based on common query patterns, e.g.:
// auditLogSchema.index({ action: 1, timestamp: -1 });
// auditLogSchema.index({ userId: 1, action: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
