const mongoose = require('mongoose');

const warningSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    moderatorId: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    },
    // Additional metadata
    channelId: {
        type: String,
        default: null
    },
    messageId: {
        type: String,
        default: null
    },
    // Appeal information
    appealed: {
        type: Boolean,
        default: false
    },
    appealReason: {
        type: String,
        default: null
    },
    appealTimestamp: {
        type: Date,
        default: null
    },
    appealStatus: {
        type: String,
        enum: ['pending', 'approved', 'denied', null],
        default: null
    },
    appealModerator: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
warningSchema.index({ guildId: 1, userId: 1 });
warningSchema.index({ guildId: 1, timestamp: -1 });
warningSchema.index({ userId: 1, active: 1 });

// Virtual for formatted timestamp
warningSchema.virtual('formattedTimestamp').get(function() {
    return this.timestamp.toLocaleString();
});

// Virtual for formatted appeal timestamp
warningSchema.virtual('formattedAppealTimestamp').get(function() {
    return this.appealTimestamp ? this.appealTimestamp.toLocaleString() : null;
});

// Method to get warning count for a user in a guild
warningSchema.statics.getWarningCount = function(guildId, userId) {
    return this.countDocuments({
        guildId: guildId,
        userId: userId,
        active: true
    });
};

// Method to get all warnings for a user in a guild
warningSchema.statics.getUserWarnings = function(guildId, userId) {
    return this.find({
        guildId: guildId,
        userId: userId
    }).sort({ timestamp: -1 });
};

// Method to get recent warnings in a guild
warningSchema.statics.getRecentWarnings = function(guildId, limit = 10) {
    return this.find({
        guildId: guildId
    }).sort({ timestamp: -1 }).limit(limit);
};

// Method to deactivate a warning
warningSchema.methods.deactivate = function() {
    this.active = false;
    return this.save();
};

// Method to appeal a warning
warningSchema.methods.appeal = function(reason) {
    this.appealed = true;
    this.appealReason = reason;
    this.appealTimestamp = new Date();
    this.appealStatus = 'pending';
    return this.save();
};

// Method to handle appeal
warningSchema.methods.handleAppeal = function(status, moderatorId) {
    this.appealStatus = status;
    this.appealModerator = moderatorId;
    if (status === 'approved') {
        this.active = false;
    }
    return this.save();
};

module.exports = mongoose.model('Warning', warningSchema); 