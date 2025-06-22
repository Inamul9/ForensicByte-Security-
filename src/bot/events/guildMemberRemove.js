const { Events } = require('discord.js');
const Guild = require('../../database/models/Guild');
const ActivityLog = require('../../database/models/ActivityLog');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        try {
            const guild = member.guild;
            const user = member.user;

            // Log the member leave
            console.log(`Member left: ${user.tag} from ${guild.name}`);

            // Get guild settings from database
            let guildSettings = await Guild.findOne({ guildId: guild.id });
            
            if (guildSettings) {
                // Remove member from database
                await guildSettings.removeMember(user.id);

                // Update member count
                await guildSettings.updateMemberCount(guild.memberCount);

                // Log member leave activity
                await ActivityLog.create({
                    guildId: guild.id,
                    action: 'MEMBER_LEFT',
                    userId: user.id,
                    details: {
                        user: user.tag,
                        userId: user.id,
                        joinedAt: member.joinedAt,
                        memberCount: guild.memberCount,
                        roles: member.roles.cache.map(role => role.name).filter(name => name !== '@everyone')
                    }
                });

                // Update guild stats
                await guildSettings.updateStats('messages', 0); // Just update last activity
            }

        } catch (error) {
            console.error('Error handling guild member remove event:', error);
        }
    }
}; 