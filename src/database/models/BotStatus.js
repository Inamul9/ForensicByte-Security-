const mongoose = require('mongoose');

const botStatusSchema = new mongoose.Schema({
    botId: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['online', 'offline', 'idle', 'dnd'],
        default: 'offline'
    },
    guildCount: {
        type: Number,
        default: 0
    },
    userCount: {
        type: Number,
        default: 0
    },
    uptime: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    version: {
        type: String,
        default: '1.0.0'
    },
    commands: {
        total: {
            type: Number,
            default: 0
        },
        used: {
            type: Number,
            default: 0
        }
    },
    performance: {
        memoryUsage: {
            type: Number,
            default: 0
        },
        cpuUsage: {
            type: Number,
            default: 0
        },
        ping: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

botStatusSchema.index({ botId: 1 });
botStatusSchema.index({ status: 1 });

module.exports = mongoose.model('BotStatus', botStatusSchema); 