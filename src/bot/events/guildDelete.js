const { Events } = require('discord.js');
const Guild = require('../../database/models/Guild');
const ActivityLog = require('../../database/models/ActivityLog');

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        try {
            console.log(`👋 Left guild: ${guild.name} (${guild.id})`);

            // Log the guild leave
            await ActivityLog.create({
                guildId: guild.id,
                action: 'GUILD_LEFT',
                userId: null,
                details: {
                    guildName: guild.name,
                    memberCount: guild.memberCount
                }
            });

            // You might want to remove the guild from database or mark it as inactive
            // For now, we'll keep it in the database for historical data

        } catch (error) {
            console.error('Error handling guild leave:', error);
        }
    }
}; 