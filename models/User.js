const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    domain: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['user', 'orgAdmin', 'superAdmin'],
        default: 'user',
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    passwordHash: {
        type: String,
        required: true
    }
}, { timestamps: true });

// Pre-save hook to extract domain from email
userSchema.pre('save', function(next) {
    if (this.isModified('email') || this.isNew) {
        this.domain = this.email.substring(this.email.lastIndexOf("@") + 1);
    }
    next();
});

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ domain: 1 });
userSchema.index({ role: 1 }); // Index for role-based queries

const User = mongoose.model('User', userSchema);

module.exports = User;
