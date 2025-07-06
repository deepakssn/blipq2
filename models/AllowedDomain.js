const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const allowedDomainSchema = new Schema({
    domain: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    addedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: { createdAt: true, updatedAt: false } }); // Only createdAt timestamp

// Indexes
allowedDomainSchema.index({ domain: 1 }, { unique: true });
allowedDomainSchema.index({ addedBy: 1 });

const AllowedDomain = mongoose.model('AllowedDomain', allowedDomainSchema);

module.exports = AllowedDomain;
