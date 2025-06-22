const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: false
    },
    userId: {
        type: String,
        required: false
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    channelId: {
        type: String,
        default: null
    },
    messageId: {
        type: String,
        default: null
    },
    moderatorId: {
        type: String,
        default: null
    },
    targetUserId: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

activityLogSchema.index({ guildId: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema); 