const { Events } = require('discord.js');
const Guild = require('../../database/models/Guild');
const ActivityLog = require('../../database/models/ActivityLog');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        try {
            console.log(`🤝 Joined guild: ${guild.name} (${guild.id})`);

            // Create guild entry in database
            const guildData = await Guild.findOneAndUpdate(
                { guildId: guild.id },
                {
                    guildId: guild.id,
                    name: guild.name,
                    icon: guild.icon,
                    ownerId: guild.ownerId,
                    memberCount: guild.memberCount,
                    joinedAt: new Date(),
                    settings: {
                        autorole: { enabled: false, roleId: null },
                        welcome: { enabled: false, channelId: null },
                        moderation: {
                            logChannel: null,
                            mutedRole: null,
                            autoMod: {
                                spamProtection: false,
                                linkFilter: false,
                                profanityFilter: false
                            }
                        }
                    }
                },
                { upsert: true, new: true }
            );

            // Log the guild join
            await ActivityLog.create({
                guildId: guild.id,
                action: 'GUILD_JOINED',
                userId: null,
                details: {
                    guildName: guild.name,
                    memberCount: guild.memberCount,
                    ownerId: guild.ownerId
                }
            });

            // Try to send welcome message to system channel
            try {
                const systemChannel = guild.systemChannel;
                if (systemChannel) {
                    const welcomeEmbed = {
                        color: 0x00ff00,
                        title: '🎉 Thanks for adding me!',
                        description: `Hello **${guild.name}**! I'm your new moderation bot.\n\n**Available Commands:**\n• \`/autorole\` - Manage autorole settings\n• \`/welcome\` - Configure welcome messages\n• \`/ban\` - Ban a user\n• \`/kick\` - Kick a user\n• \`/warn\` - Warn a user\n• \`/mute\` - Mute a user\n• \`/warnings\` - View user warnings\n• \`/unban\` - Unban a user\n\n**Web Dashboard:**\nVisit our web dashboard to configure settings and view statistics.\n\n**Support:**\nIf you need help, check the documentation or contact support.`,
                        fields: [
                            {
                                name: '🚀 Quick Setup',
                                value: 'Use `/autorole set @role` to set automatic role assignment\nUse `/welcome set #channel` to enable welcome messages',
                                inline: false
                            }
                        ],
                        footer: {
                            text: 'ModBot - Advanced Discord Moderation'
                        },
                        timestamp: new Date()
                    };

                    await systemChannel.send({ embeds: [welcomeEmbed] });
                }
            } catch (error) {
                console.warn(`Could not send welcome message to ${guild.name}: ${error.message}`);
            }

        } catch (error) {
            console.error('Error handling guild join:', error);
        }
    }
}; 