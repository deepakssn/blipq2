const mongoose = require('mongoose');

const DomainSchema = new mongoose.Schema({
  domainName: {
    type: String,
    required: [true, 'Please add a domain name (e.g., example.com)'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
        /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/,
        'Please add a valid domain name (e.g., example.com or subdomain.example.co.uk)'
    ]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [250, 'Description cannot be more than 250 characters'],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  // To distinguish between general allowed domains and those for superAdmins if needed,
  // or if certain domains grant orgAdmin rights automatically upon verification.
  // For now, keeping it simple: this list is for general registration allowance.
  // type: {
  //   type: String,
  //   enum: ['general', 'superadmin_registration', 'auto_org_admin'],
  //   default: 'general'
  // },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true, // Should be a superAdmin
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date
  }
});

// Index for domainName for quick lookups
DomainSchema.index({ domainName: 1 });
DomainSchema.index({ isActive: 1 });

// Middleware to set updatedAt on updates
DomainSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Domain', DomainSchema);
