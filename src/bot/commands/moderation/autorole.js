const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Guild = require('../../../database/models/Guild');
const ActivityLog = require('../../../database/models/ActivityLog');
const logger = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Manage autorole settings for this server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the autorole for new members')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to automatically assign to new members')
                        .setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove the autorole setting')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Show current autorole settings')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        try {
            const { guild, user } = interaction;
            const subcommand = interaction.options.getSubcommand();

            // Check if user has permission to manage roles
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
                return interaction.reply({
                    content: '❌ You need the "Manage Roles" permission to use this command.',
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
                    const role = interaction.options.getRole('role');
                    
                    // Check if bot can manage this role
                    if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
                        return interaction.reply({
                            content: '❌ I need the "Manage Roles" permission to set autorole.',
                            ephemeral: true
                        });
                    }

                    if (role.position >= guild.members.me.roles.highest.position) {
                        return interaction.reply({
                            content: '❌ I cannot assign a role that is higher than or equal to my highest role.',
                            ephemeral: true
                        });
                    }

                    // Update autorole settings
                    guildSettings.settings.autorole = {
                        enabled: true,
                        roleId: role.id,
                        roleName: role.name
                    };
                    await guildSettings.save();

                    // Log the action
                    await ActivityLog.create({
                        guildId: guild.id,
                        action: 'AUTOROLE_SET',
                        userId: user.id,
                        details: {
                            roleId: role.id,
                            roleName: role.name,
                            setBy: user.tag
                        }
                    });

                    await interaction.reply({
                        content: `✅ Autorole set to **${role.name}**! New members will automatically receive this role.`,
                        ephemeral: true
                    });
                    break;
                }

                case 'remove': {
                    const wasEnabled = guildSettings.settings.autorole.enabled;
                    const roleName = guildSettings.settings.autorole.roleName;

                    // Remove autorole settings
                    guildSettings.settings.autorole = {
                        enabled: false,
                        roleId: null,
                        roleName: null
                    };
                    await guildSettings.save();

                    // Log the action
                    if (wasEnabled) {
                        await ActivityLog.create({
                            guildId: guild.id,
                            action: 'AUTOROLE_REMOVED',
                            userId: user.id,
                            details: {
                                roleName: roleName,
                                removedBy: user.tag
                            }
                        });
                    }

                    await interaction.reply({
                        content: wasEnabled 
                            ? `✅ Autorole **${roleName}** has been removed. New members will no longer receive automatic roles.`
                            : 'ℹ️ No autorole was set.',
                        ephemeral: true
                    });
                    break;
                }

                case 'info': {
                    const autorole = guildSettings.settings.autorole;
                    
                    if (autorole.enabled && autorole.roleId) {
                        const role = guild.roles.cache.get(autorole.roleId);
                        
                        if (role) {
                            await interaction.reply({
                                embeds: [{
                                    color: role.color || 0x00ff00,
                                    title: '🎭 Autorole Settings',
                                    description: `**Role:** ${role.toString()}\n**Enabled:** ✅ Yes`,
                                    fields: [
                                        {
                                            name: 'Role ID',
                                            value: role.id,
                                            inline: true
                                        },
                                        {
                                            name: 'Role Color',
                                            value: `#${role.hexColor}`,
                                            inline: true
                                        },
                                        {
                                            name: 'Members with Role',
                                            value: role.members.size.toString(),
                                            inline: true
                                        }
                                    ],
                                    timestamp: new Date().toISOString()
                                }],
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                content: '⚠️ Autorole is set but the role no longer exists. Please set a new autorole.',
                                ephemeral: true
                            });
                        }
                    } else {
                        await interaction.reply({
                            embeds: [{
                                color: 0xff6b6b,
                                title: '🎭 Autorole Settings',
                                description: '❌ No autorole is currently set.',
                                fields: [
                                    {
                                        name: 'How to set autorole',
                                        value: 'Use `/autorole set @role` to set an autorole for new members.'
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
            logger.error('Error in autorole command:', error);
            await interaction.reply({
                content: '❌ An error occurred while managing autorole settings. Please try again.',
                ephemeral: true
            });
        }
    }
}; 