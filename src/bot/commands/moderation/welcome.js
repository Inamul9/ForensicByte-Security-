const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Guild = require('../../../database/models/Guild');
const ActivityLog = require('../../../database/models/ActivityLog');
const logger = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Manage welcome message settings for this server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the welcome channel and message')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send welcome messages in')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('Custom welcome message (use {user}, {username}, {server}, {memberCount})')
                        .setRequired(false))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove welcome message settings')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test the welcome message')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Show current welcome settings')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            const { guild, user } = interaction;
            const subcommand = interaction.options.getSubcommand();

            // Check if user has permission to manage guild
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({
                    content: '❌ You need the "Manage Server" permission to use this command.',
                    ephemeral: true
                });
            }

            // Get or create guild settings
            let guildSettings = await Guild.findOne({ guildId: guild.id });
            
            if (!guildSettings) {
                guildSettings = new Guild({
                    guildId: guild.id,
                    name: guild.name,
                    icon: guild.icon,
                    ownerId: guild.ownerId,
                    memberCount: guild.memberCount,
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
                });
                await guildSettings.save();
            }

            switch (subcommand) {
                case 'set': {
                    const channel = interaction.options.getChannel('channel');
                    const customMessage = interaction.options.getString('message');

                    // Check if channel is text-based
                    if (!channel.isTextBased()) {
                        return interaction.reply({
                            content: '❌ Please select a text channel for welcome messages.',
                            ephemeral: true
                        });
                    }

                    // Check if bot has permission to send messages in the channel
                    if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                        return interaction.reply({
                            content: '❌ I need permission to send messages in that channel.',
                            ephemeral: true
                        });
                    }

                    // Update welcome settings
                    guildSettings.settings.welcome = {
                        enabled: true,
                        channelId: channel.id,
                        channelName: channel.name,
                        message: customMessage || 'Welcome {user} to {server}! 🎉'
                    };
                    await guildSettings.save();

                    // Log the action
                    await ActivityLog.create({
                        guildId: guild.id,
                        action: 'WELCOME_SET',
                        userId: user.id,
                        details: {
                            channelId: channel.id,
                            channelName: channel.name,
                            message: customMessage || 'Default message',
                            setBy: user.tag
                        }
                    });

                    await interaction.reply({
                        content: `✅ Welcome messages enabled in ${channel.toString()}!\n\n**Message:** ${customMessage || 'Welcome {user} to {server}! 🎉'}`,
                        ephemeral: true
                    });
                    break;
                }

                case 'remove': {
                    const wasEnabled = guildSettings.settings.welcome.enabled;
                    const channelName = guildSettings.settings.welcome.channelName;

                    // Remove welcome settings
                    guildSettings.settings.welcome = {
                        enabled: false,
                        channelId: null,
                        channelName: null,
                        message: 'Welcome {user} to {server}! 🎉'
                    };
                    await guildSettings.save();

                    // Log the action
                    if (wasEnabled) {
                        await ActivityLog.create({
                            guildId: guild.id,
                            action: 'WELCOME_REMOVED',
                            userId: user.id,
                            details: {
                                channelName: channelName,
                                removedBy: user.tag
                            }
                        });
                    }

                    await interaction.reply({
                        content: wasEnabled 
                            ? `✅ Welcome messages disabled. They were previously sent in #${channelName}.`
                            : 'ℹ️ Welcome messages were not enabled.',
                        ephemeral: true
                    });
                    break;
                }

                case 'test': {
                    const welcome = guildSettings.settings.welcome;
                    
                    if (!welcome.enabled || !welcome.channelId) {
                        return interaction.reply({
                            content: '❌ Welcome messages are not enabled. Use `/welcome set` to enable them.',
                            ephemeral: true
                        });
                    }

                    const channel = guild.channels.cache.get(welcome.channelId);
                    if (!channel) {
                        return interaction.reply({
                            content: '❌ Welcome channel no longer exists. Please set a new welcome channel.',
                            ephemeral: true
                        });
                    }

                    const testMessage = welcome.message
                        .replace('{user}', user.toString())
                        .replace('{username}', user.username)
                        .replace('{server}', guild.name)
                        .replace('{memberCount}', guild.memberCount);

                    try {
                        await channel.send({
                            content: testMessage,
                            embeds: [{
                                color: 0x00ff00,
                                title: '🎉 Welcome! (Test Message)',
                                description: `Welcome ${user.toString()} to **${guild.name}**!`,
                                thumbnail: {
                                    url: user.displayAvatarURL({ dynamic: true })
                                },
                                fields: [
                                    {
                                        name: '👥 Member Count',
                                        value: `You are member #${guild.memberCount}`,
                                        inline: true
                                    },
                                    {
                                        name: '📅 Account Created',
                                        value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                                        inline: true
                                    }
                                ],
                                footer: {
                                    text: 'This is a test welcome message'
                                },
                                timestamp: new Date().toISOString()
                            }]
                        });

                        await interaction.reply({
                            content: `✅ Test welcome message sent to ${channel.toString()}!`,
                            ephemeral: true
                        });
                    } catch (error) {
                        await interaction.reply({
                            content: '❌ Failed to send test message. Check my permissions in the welcome channel.',
                            ephemeral: true
                        });
                    }
                    break;
                }

                case 'info': {
                    const welcome = guildSettings.settings.welcome;
                    
                    if (welcome.enabled && welcome.channelId) {
                        const channel = guild.channels.cache.get(welcome.channelId);
                        
                        if (channel) {
                            await interaction.reply({
                                embeds: [{
                                    color: 0x00ff00,
                                    title: '🎉 Welcome Settings',
                                    description: `**Channel:** ${channel.toString()}\n**Enabled:** ✅ Yes`,
                                    fields: [
                                        {
                                            name: 'Channel ID',
                                            value: channel.id,
                                            inline: true
                                        },
                                        {
                                            name: 'Message',
                                            value: welcome.message,
                                            inline: false
                                        },
                                        {
                                            name: 'Variables',
                                            value: '`{user}` - User mention\n`{username}` - Username\n`{server}` - Server name\n`{memberCount}` - Member count',
                                            inline: false
                                        }
                                    ],
                                    timestamp: new Date().toISOString()
                                }],
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                content: '⚠️ Welcome messages are enabled but the channel no longer exists. Please set a new welcome channel.',
                                ephemeral: true
                            });
                        }
                    } else {
                        await interaction.reply({
                            embeds: [{
                                color: 0xff6b6b,
                                title: '🎉 Welcome Settings',
                                description: '❌ Welcome messages are not enabled.',
                                fields: [
                                    {
                                        name: 'How to enable welcome messages',
                                        value: 'Use `/welcome set #channel [message]` to enable welcome messages.'
                                    }
                                ],
                                timestamp: new Date().toISOString()
                            }],
                            ephemeral: true
                        });
                    }
                    break;
                }
            }

        } catch (error) {
            logger.error('Error in welcome command:', error);
            await interaction.reply({
                content: '❌ An error occurred while managing welcome settings. Please try again.',
                ephemeral: true
            });
        }
    }
}; 