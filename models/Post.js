const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    images: {
        type: [String], // Array of image URLs
        validate: [arrayLimit, '{PATH} exceeds the limit of 10 images']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    location: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    visibility: {
        type: String,
        enum: ['org', 'global'],
        default: 'global',
        required: true
    },
    org: { // Store the email domain for 'org' visibility posts
        type: String,
        trim: true,
        lowercase: true,
        // Required if visibility is 'org'
        required: function() { return this.visibility === 'org'; }
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    viewCount: {
        type: Number,
        default: 0,
        min: 0
    },
    likeCount: {
        type: Number,
        default: 0,
        min: 0
    },
    bookmarks: {
        type: [Schema.Types.ObjectId], // Array of User ObjectIds
        ref: 'User'
    }
}, { timestamps: true });

function arrayLimit(val) {
    return val.length <= 10;
}

// Indexes
postSchema.index({ title: 'text', description: 'text' }); // For text search
postSchema.index({ category: 1 });
postSchema.index({ location: 1 });
postSchema.index({ createdBy: 1 });
postSchema.index({ org: 1, visibility: 1 }); // For organization-specific posts
postSchema.index({ visibility: 1 });
postSchema.index({ price: 1 });
postSchema.index({ likeCount: -1 }); // For sorting by popularity
postSchema.index({ viewCount: -1 }); // For sorting by views

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
