const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const flagSchema = new Schema({
    postId: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    flaggedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'reviewed', 'resolved', 'dismissed'],
        default: 'open',
        required: true
    }
}, { timestamps: true });

// Indexes
flagSchema.index({ postId: 1 });
flagSchema.index({ flaggedBy: 1 });
flagSchema.index({ status: 1 });
flagSchema.index({ postId: 1, flaggedBy: 1 }, { unique: true }); // Optional: prevent users from flagging the same post multiple times.

const Flag = mongoose.model('Flag', flagSchema);

module.exports = Flag;
