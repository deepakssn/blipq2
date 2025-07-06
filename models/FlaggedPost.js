const mongoose = require('mongoose');

const FlaggedPostSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    required: true,
    index: true,
  },
  postAuthor: { // Denormalized for easier querying/filtering by admin for org posts
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  postOrganization: { // Denormalized from post/author for easier filtering by orgAdmin
      type: String,
      index: true
  },
  flaggedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for flagging the post.'],
    trim: true,
    maxlength: [500, 'Reason cannot be more than 500 characters'],
    minlength: [10, 'Reason must be at least 10 characters long'],
  },
  // Optional: A category for the flag reason, if you want to standardize
  // reasonCategory: {
  //   type: String,
  //   enum: ['spam', 'offensive', 'misinformation', 'illegal', 'other'],
  //   required: true
  // },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'resolved_action_taken', 'resolved_dismissed'],
    default: 'pending',
    index: true,
  },
  adminNotes: { // Notes added by an admin during review
    type: String,
    trim: true,
  },
  reviewedAt: {
    type: Date,
  },
  reviewedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', // Admin who reviewed it
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user cannot flag the same post multiple times if it's still pending for that user.
// This depends on the desired behavior. If multiple flags for different reasons are allowed, this index needs adjustment.
// For now, let's assume one pending flag per user per post.
FlaggedPostSchema.index({ post: 1, flaggedBy: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'pending' } });

FlaggedPostSchema.index({ status: 1, createdAt: -1 }); // For admins to query pending flags

module.exports = mongoose.model('FlaggedPost', FlaggedPostSchema);
