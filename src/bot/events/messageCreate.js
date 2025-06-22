const { Events, PermissionFlagsBits } = require('discord.js');
const Guild = require('../../database/models/Guild');
const ActivityLog = require('../../database/models/ActivityLog');
const Warning = require('../../database/models/Warning');

// Expanded profanity list (you can add more words as needed)
const PROFANITY_LIST = [
    'badword1', 'badword2', 'badword3', 'curse1', 'curse2', 'curse3',
    'swear1', 'swear2', 'swear3', 'profanity1', 'profanity2', 'profanity3'
];
const LINK_REGEX = /(https?:\/\/|www\.)[\w\-]+(\.[\w\-]+)+\S*/i;
const INVITE_REGEX = /discord\.gg\/[a-zA-Z0-9]+/i;

// In-memory spam tracker: { guildId: { userId: [timestamps] } }
const spamTracker = {};
const SPAM_TIME_WINDOW = 7000; // ms
const SPAM_MESSAGE_LIMIT = 5;

// User violation tracker: { guildId: { userId: { violations: number, lastViolation: timestamp } } }
const violationTracker = {};

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot || !message.guild) return;
        const guildId = message.guild.id;
        const userId = message.author.id;
        const settings = client.settingsCache ? client.settingsCache[guildId] : null;
        if (!settings || !settings.moderation) return;

        // Initialize violation tracker for this guild
        if (!violationTracker[guildId]) {
            violationTracker[guildId] = {};
        }
        if (!violationTracker[guildId][userId]) {
            violationTracker[guildId][userId] = { violations: 0, lastViolation: 0 };
        }

        // Logging utility
        async function logModeration(action, details) {
            await ActivityLog.create({
                guildId,
                action,
                userId,
                details: {
                    ...details,
                    channel: message.channel.id,
                    messageId: message.id
                }
            });
            
            // Log to channel if set
            if (settings.moderation.logChannel) {
                const logChannel = message.guild.channels.cache.get(settings.moderation.logChannel);
                if (logChannel && logChannel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                    await logChannel.send({
                        embeds: [{
                            color: 0xffa500,
                            title: `Moderation: ${action}`,
                            description: details.reason || 'Auto-moderation action',
                            fields: [
                                { name: 'User', value: `<@${userId}> (${userId})`, inline: true },
                                { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
                                { name: 'Message', value: `[Jump to](${message.url})`, inline: false }
                            ],
                            timestamp: new Date().toISOString()
                        }]
                    });
                }
            }
        }

        // Handle violation and apply punishment
        async function handleViolation(violationType, reason) {
            violationTracker[guildId][userId].violations++;
            violationTracker[guildId][userId].lastViolation = Date.now();
            
            const violations = violationTracker[guildId][userId].violations;
            const member = message.guild.members.cache.get(userId);
            
            if (!member) return;

            // Apply punishment based on thresholds
            if (violations >= settings.moderation.banThreshold) {
                // Ban user
                try {
                    await member.ban({ reason: `Auto-moderation: ${reason} (${violations} violations)` });
                    await logModeration('AUTOMOD_BAN', { 
                        reason: `${reason} (${violations} violations)`,
                        content: message.content 
                    });
                } catch (error) {
                    console.error('Failed to ban user:', error);
                }
            } else if (violations >= settings.moderation.kickThreshold) {
                // Kick user
                try {
                    await member.kick(`Auto-moderation: ${reason} (${violations} violations)`);
                    await logModeration('AUTOMOD_KICK', { 
                        reason: `${reason} (${violations} violations)`,
                        content: message.content 
                    });
                } catch (error) {
                    console.error('Failed to kick user:', error);
                }
            } else if (violations >= settings.moderation.muteThreshold) {
                // Mute user
                if (settings.moderation.mutedRole) {
                    try {
                        await member.roles.add(settings.moderation.mutedRole, `Auto-moderation: ${reason} (${violations} violations)`);
                        await logModeration('AUTOMOD_MUTE', { 
                            reason: `${reason} (${violations} violations)`,
                            content: message.content,
                            duration: '10 minutes'
                        });
                        
                        // Remove mute after 10 minutes
                        setTimeout(async () => {
                            try {
                                await member.roles.remove(settings.moderation.mutedRole, 'Auto-moderation mute expired');
                            } catch (error) {
                                console.error('Failed to remove mute:', error);
                            }
                        }, 10 * 60 * 1000);
                    } catch (error) {
                        console.error('Failed to mute user:', error);
                    }
                }
            } else if (violations >= settings.moderation.warningThreshold) {
                // Warn user
                try {
                    await Warning.create({
                        guildId,
                        userId,
                        moderatorId: client.user.id,
                        reason: `Auto-moderation: ${reason} (${violations} violations)`,
                        timestamp: new Date()
                    });
                    
                    await logModeration('AUTOMOD_WARN', { 
                        reason: `${reason} (${violations} violations)`,
                        content: message.content 
                    });
                    
                    // Send warning message to user
                    try {
                        await message.author.send(`You have been warned in ${message.guild.name} for: ${reason} (${violations} violations)`);
                    } catch (dmError) {
                        // User has DMs disabled, that's okay
                    }
                } catch (error) {
                    console.error('Failed to warn user:', error);
                }
            }
        }

        // Profanity filter
        if (settings.moderation.autoMod?.profanityFilter) {
            const lower = message.content.toLowerCase();
            if (PROFANITY_LIST.some(word => lower.includes(word))) {
                await message.delete().catch(() => {});
                await handleViolation('profanity', 'Profanity detected');
                return;
            }
        }

        // Anti-link
        if (settings.moderation.autoMod?.linkFilter) {
            if (LINK_REGEX.test(message.content)) {
                await message.delete().catch(() => {});
                await handleViolation('link', 'Link detected');
                return;
            }
        }

        // Anti-invite
        if (settings.moderation.autoMod?.inviteFilter) {
            if (INVITE_REGEX.test(message.content)) {
                await message.delete().catch(() => {});
                await handleViolation('invite', 'Discord invite detected');
                return;
            }
        }

        // Anti-spam
        if (settings.moderation.autoMod?.spamProtection) {
            if (!spamTracker[guildId]) spamTracker[guildId] = {};
            if (!spamTracker[guildId][userId]) spamTracker[guildId][userId] = [];
            
            const now = Date.now();
            spamTracker[guildId][userId] = spamTracker[guildId][userId].filter(ts => now - ts < SPAM_TIME_WINDOW);
            spamTracker[guildId][userId].push(now);
            
            if (spamTracker[guildId][userId].length > SPAM_MESSAGE_LIMIT) {
                await message.delete().catch(() => {});
                await handleViolation('spam', 'Spam detected');
                spamTracker[guildId][userId] = [];
                return;
            }
        }

        // Mass mention filter
        if (settings.moderation.autoMod?.massMentionFilter) {
            const mentionCount = (message.content.match(/<@!?\d+>/g) || []).length;
            if (mentionCount > 5) {
                await message.delete().catch(() => {});
                await handleViolation('mass_mention', `Mass mention detected (${mentionCount} mentions)`);
                return;
            }
        }
    }
}; 