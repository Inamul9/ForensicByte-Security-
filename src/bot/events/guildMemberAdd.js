const { Events } = require('discord.js');
const Guild = require('../../database/models/Guild');
const ActivityLog = require('../../database/models/ActivityLog');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        try {
            const guild = member.guild;
            const user = member.user;

            // Log the member join
            console.log(`Member joined: ${user.tag} in ${guild.name}`);

            // Use settings cache if available
            let guildSettings = client.settingsCache ? client.settingsCache[guild.id] : null;
            if (!guildSettings) {
                // Fallback: fetch from database and update cache
                const dbGuild = await Guild.findOne({ guildId: guild.id });
                if (dbGuild) {
                    guildSettings = dbGuild.settings;
                    if (client.settingsCache) client.settingsCache[guild.id] = dbGuild.settings;
                }
            }
            if (!guildSettings) return;

            // Add member to database
            await Guild.findOneAndUpdate(
                { guildId: guild.id },
                { $addToSet: { members: { userId: user.id, username: user.username, roles: member.roles.cache.map(role => role.id) } }, $set: { memberCount: guild.memberCount } }
            );

            // Handle autorole
            if (guildSettings.autorole && guildSettings.autorole.enabled && guildSettings.autorole.roleId) {
                try {
                    const autorole = guild.roles.cache.get(guildSettings.autorole.roleId);
                    if (autorole) {
                        await member.roles.add(autorole);
                        console.log(`Autorole assigned: ${autorole.name} to ${user.tag} in ${guild.name}`);
                        await ActivityLog.create({
                            guildId: guild.id,
                            action: 'AUTOROLE_ASSIGNED',
                            userId: user.id,
                            details: {
                                roleId: autorole.id,
                                roleName: autorole.name,
                                user: user.tag,
                                assignedBy: 'Bot (Auto)'
                            }
                        });
                    } else {
                        console.warn(`Autorole not found: ${guildSettings.autorole.roleId} in ${guild.name}`);
                    }
                } catch (error) {
                    console.error(`Error assigning autorole to ${user.tag} in ${guild.name}:`, error);
                }
            }

            // Handle welcome message
            if (guildSettings.welcome && guildSettings.welcome.enabled && guildSettings.welcome.channelId) {
                try {
                    const welcomeChannel = guild.channels.cache.get(guildSettings.welcome.channelId);
                    if (welcomeChannel && welcomeChannel.isTextBased()) {
                        const welcomeMessage = guildSettings.welcome.message
                            .replace('{user}', user.toString())
                            .replace('{username}', user.username)
                            .replace('{server}', guild.name)
                            .replace('{memberCount}', guild.memberCount);
                        await welcomeChannel.send({
                            content: welcomeMessage,
                            embeds: [{
                                color: 0x00ff00,
                                title: '🎉 Welcome!',
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
                                timestamp: new Date().toISOString()
                            }]
                        });
                        console.log(`Welcome message sent for ${user.tag} in ${guild.name}`);
                    }
                } catch (error) {
                    console.error(`Error sending welcome message for ${user.tag} in ${guild.name}:`, error);
                }
            }

            // Log member join activity
            await ActivityLog.create({
                guildId: guild.id,
                action: 'MEMBER_JOINED',
                userId: user.id,
                details: {
                    user: user.tag,
                    userId: user.id,
                    accountAge: Date.now() - user.createdTimestamp,
                    memberCount: guild.memberCount
                }
            });

            // Update guild stats
            await Guild.findOneAndUpdate(
                { guildId: guild.id },
                { $set: { 'stats.lastActivity': new Date() } }
            );

        } catch (error) {
            console.error('Error handling guild member add event:', error);
        }
    }
}; 