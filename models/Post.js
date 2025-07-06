const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters'],
  },
  content: {
    type: String,
    required: [true, 'Please add content'],
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: { // Denormalized from User author for easier querying of org-specific posts
    type: String,
    required: true, // Should be set when post is created based on author's org
    index: true,
  },
  visibility: {
    type: String,
    enum: ['organization', 'global'],
    default: 'organization',
    required: true,
  },
  imageUrl: {
    type: String, // URL to the image
    match: [
        /^(ftp|http|https):\/\/[^ "]+$/,
        'Please use a valid URL for imageUrl'
    ],
    default: null,
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  bookmarks: [{ // Users who bookmarked this post
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  viewCount: {
    type: Number,
    default: 0,
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
  tags: [{ // Optional: for categorizing or searching posts
      type: String,
      trim: true
  }],
  status: { // Optional: for moderation or lifecycle management
      type: String,
      enum: ['active', 'archived', 'pending_review', 'removed'],
      default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

// Middleware to set updatedAt on save (update)
PostSchema.pre('save', function (next) {
  if (this.isModified() && !this.isNew) { // Only set updatedAt if document is modified and not new
    this.updatedAt = Date.now();
    if (this.isModified('content') || this.isModified('title')) { // Or other fields you deem constitute an "edit"
        this.isEdited = true;
    }
  }
  next();
});

// Indexing for frequently queried fields
PostSchema.index({ author: 1 });
PostSchema.index({ visibility: 1 });
PostSchema.index({ tags: 1 }); // If using tags
PostSchema.index({ organization: 1, visibility: 1 }); // Compound for org-specific visible posts


// Method to check if a user has liked a post
PostSchema.methods.isLikedBy = function(userId) {
    return this.likes.some(likeId => likeId.equals(userId));
};

// Method to check if a user has bookmarked a post
PostSchema.methods.isBookmarkedBy = function(userId) {
    return this.bookmarks.some(bookmarkId => bookmarkId.equals(userId));
};


module.exports = mongoose.model('Post', PostSchema);
