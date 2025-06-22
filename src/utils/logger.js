const ActivityLog = require('../database/models/ActivityLog');

/**
 * Log an activity to the database
 * @param {string} action - The action being logged
 * @param {string} details - Details about the action
 * @param {string} userId - User ID (optional)
 * @param {string} guildId - Guild ID (optional)
 * @param {Object} metadata - Additional metadata (optional)
 */
async function logActivity(action, details, userId = null, guildId = null, metadata = {}) {
    try {
        await ActivityLog.create({
            action,
            details,
            userId,
            guildId,
            metadata,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

/**
 * Get recent activities for a guild
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of activities to return
 * @returns {Array} Array of activity logs
 */
async function getGuildActivities(guildId, limit = 50) {
    try {
        return await ActivityLog.find({ guildId })
            .sort({ timestamp: -1 })
            .limit(limit);
    } catch (error) {
        console.error('Error getting guild activities:', error);
        return [];
    }
}

/**
 * Get user activities
 * @param {string} userId - User ID
 * @param {number} limit - Number of activities to return
 * @returns {Array} Array of activity logs
 */
async function getUserActivities(userId, limit = 50) {
    try {
        return await ActivityLog.find({ userId })
            .sort({ timestamp: -1 })
            .limit(limit);
    } catch (error) {
        console.error('Error getting user activities:', error);
        return [];
    }
}

/**
 * Get moderation activities for a guild
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of activities to return
 * @returns {Array} Array of moderation activity logs
 */
async function getModerationActivities(guildId, limit = 50) {
    try {
        const moderationActions = [
            'USER_BANNED',
            'USER_KICKED',
            'USER_WARNED',
            'USER_MUTED',
            'USER_UNBANNED',
            'USER_UNMUTED',
            'WARNING_REMOVED'
        ];

        return await ActivityLog.find({
            guildId,
            action: { $in: moderationActions }
        })
        .sort({ timestamp: -1 })
        .limit(limit);
    } catch (error) {
        console.error('Error getting moderation activities:', error);
        return [];
    }
}

/**
 * Get bot statistics
 * @returns {Object} Bot statistics
 */
async function getBotStats() {
    try {
        const stats = await ActivityLog.aggregate([
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 },
                    lastOccurrence: { $max: '$timestamp' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        return stats;
    } catch (error) {
        console.error('Error getting bot stats:', error);
        return [];
    }
}

/**
 * Clean old activity logs
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {number} Number of deleted logs
 */
async function cleanOldLogs(daysToKeep = 30) {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const result = await ActivityLog.deleteMany({
            timestamp: { $lt: cutoffDate }
        });

        console.log(`Cleaned ${result.deletedCount} old activity logs`);
        return result.deletedCount;
    } catch (error) {
        console.error('Error cleaning old logs:', error);
        return 0;
    }
}

module.exports = {
    logActivity,
    getGuildActivities,
    getUserActivities,
    getModerationActivities,
    getBotStats,
    cleanOldLogs
}; 