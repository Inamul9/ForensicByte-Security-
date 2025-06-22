const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: {
        type: String,
        required: true,
        unique: true // ❌ Removed index: true to fix warning
    },
    name: { type: String, required: true },
    icon: { type: String, default: null },
    ownerId: { type: String, required: true },
    memberCount: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    settings: {
        autorole: {
            enabled: { type: Boolean, default: false },
            roleId: { type: String, default: null },
            roleName: { type: String, default: null }
        },
        welcome: {
            enabled: { type: Boolean, default: false },
            channelId: { type: String, default: null },
            channelName: { type: String, default: null },
            message: { type: String, default: 'Welcome {user} to {server}! 🎉' }
        },
        moderation: {
            logChannel: { type: String, default: null },
            logChannelName: { type: String, default: null },
            mutedRole: { type: String, default: null },
            mutedRoleName: { type: String, default: null },
            autoMod: {
                spamProtection: { type: Boolean, default: false },
                linkFilter: { type: Boolean, default: false },
                profanityFilter: { type: Boolean, default: false },
                inviteFilter: { type: Boolean, default: false },
                massMentionFilter: { type: Boolean, default: false }
            },
            warningThreshold: { type: Number, default: 3 },
            muteThreshold: { type: Number, default: 5 },
            kickThreshold: { type: Number, default: 7 },
            banThreshold: { type: Number, default: 10 }
        },
        logging: {
            enabled: { type: Boolean, default: true },
            events: {
                memberJoin: { type: Boolean, default: true },
                memberLeave: { type: Boolean, default: true },
                messageDelete: { type: Boolean, default: true },
                messageEdit: { type: Boolean, default: true },
                roleChanges: { type: Boolean, default: true },
                channelChanges: { type: Boolean, default: true }
            }
        },
        commands: {
            prefix: { type: String, default: '!' },
            enabled: { type: [String], default: ['ban', 'kick', 'mute', 'warn', 'unban', 'warnings'] },
            disabled: { type: [String], default: [] }
        }
    },
    members: [{
        userId: String,
        username: String,
        joinedAt: { type: Date, default: Date.now },
        roles: [String]
    }],
    stats: {
        totalMessages: { type: Number, default: 0 },
        totalCommands: { type: Number, default: 0 },
        totalModActions: { type: Number, default: 0 },
        lastActivity: { type: Date, default: Date.now }
    }
}, {
    timestamps: true
});

// ✅ Indexes
guildSchema.index({ guildId: 1 });
guildSchema.index({ ownerId: 1 });
guildSchema.index({ 'members.userId': 1 });

// ✅ Virtual
guildSchema.virtual('activeMembers').get(function () {
    return this.members.length;
});

// ✅ Instance methods
guildSchema.methods.updateMemberCount = function (count) {
    this.memberCount = count;
    return this.save();
};

guildSchema.methods.addMember = function (userId, username, roles = []) {
    const existingMember = this.members.find(m => m.userId === userId);
    if (!existingMember) {
        this.members.push({ userId, username, roles, joinedAt: new Date() });
    }
    return this.save();
};

guildSchema.methods.removeMember = function (userId) {
    this.members = this.members.filter(m => m.userId !== userId);
    return this.save();
};

guildSchema.methods.updateMemberRoles = function (userId, roles) {
    const member = this.members.find(m => m.userId === userId);
    if (member) {
        member.roles = roles;
    }
    return this.save();
};

guildSchema.methods.getAutoroleSettings = function () {
    return this.settings.autorole;
};

guildSchema.methods.setAutoroleSettings = function (enabled, roleId, roleName) {
    this.settings.autorole = { enabled, roleId, roleName };
    return this.save();
};

guildSchema.methods.getWelcomeSettings = function () {
    return this.settings.welcome;
};

guildSchema.methods.setWelcomeSettings = function (enabled, channelId, channelName, message) {
    this.settings.welcome = {
        enabled,
        channelId,
        channelName,
        message: message || this.settings.welcome.message
    };
    return this.save();
};

guildSchema.methods.getModerationSettings = function () {
    return this.settings.moderation;
};

guildSchema.methods.setModerationSettings = function (settings) {
    this.settings.moderation = {
        ...this.settings.moderation,
        ...settings
    };
    return this.save();
};

guildSchema.methods.updateStats = function (type, count = 1) {
    switch (type) {
        case 'messages': this.stats.totalMessages += count; break;
        case 'commands': this.stats.totalCommands += count; break;
        case 'modActions': this.stats.totalModActions += count; break;
    }
    this.stats.lastActivity = new Date();
    return this.save();
};

// ✅ Static methods
guildSchema.statics.findByUser = function (userId) {
    return this.find({
        $or: [
            { ownerId: userId },
            { 'members.userId': userId }
        ]
    });
};

guildSchema.statics.findWithAutorole = function () {
    return this.find({ 'settings.autorole.enabled': true });
};

guildSchema.statics.findWithWelcome = function () {
    return this.find({ 'settings.welcome.enabled': true });
};

guildSchema.statics.getStats = function () {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalGuilds: { $sum: 1 },
                totalMembers: { $sum: '$memberCount' },
                totalMessages: { $sum: '$stats.totalMessages' },
                totalCommands: { $sum: '$stats.totalCommands' },
                totalModActions: { $sum: '$stats.totalModActions' }
            }
        }
    ]);
};

module.exports = mongoose.model('Guild', guildSchema);
