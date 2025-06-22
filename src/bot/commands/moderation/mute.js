const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logActivity } = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user (timeout)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the mute (e.g., 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    permissions: [PermissionFlagsBits.ModerateMembers],

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if user is trying to mute themselves
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot mute yourself!',
                ephemeral: true
            });
        }

        // Check if user is trying to mute the bot
        if (targetUser.id === client.user.id) {
            return interaction.reply({
                content: '❌ You cannot mute the bot!',
                ephemeral: true
            });
        }

        // Parse duration
        const durationMs = parseDuration(duration);
        if (!durationMs) {
            return interaction.reply({
                content: '❌ Invalid duration format. Use: 1s, 1m, 1h, 1d (max 28 days)',
                ephemeral: true
            });
        }

        // Check if duration is within Discord's limits (28 days)
        if (durationMs > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
                content: '❌ Mute duration cannot exceed 28 days.',
                ephemeral: true
            });
        }

        // Check if target user is manageable
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        if (!targetMember.moderatable) {
            return interaction.reply({
                content: '❌ I cannot mute this user. They may have higher permissions than me.',
                ephemeral: true
            });
        }

        try {
            // Timeout the user
            await targetMember.timeout(durationMs, `${reason} | Muted by ${interaction.user.tag}`);

            // Create mute embed
            const muteEmbed = new EmbedBuilder()
                .setColor('#808080')
                .setTitle('🔇 User Muted')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Muted by', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Duration', value: formatDuration(durationMs), inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Date', value: new Date().toLocaleString(), inline: true }
                )
                .setFooter({ text: 'Moderation Action' })
                .setTimestamp();

            // Send confirmation
            await interaction.reply({
                embeds: [muteEmbed],
                ephemeral: false
            });

            // Log the action
            await logActivity('USER_MUTED', reason, targetUser.id, interaction.guildId);

            // Send DM to muted user (if possible)
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#808080')
                    .setTitle('You have been muted')
                    .setDescription(`You have been muted in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Duration', value: formatDuration(durationMs), inline: true },
                        { name: 'Reason', value: reason, inline: false },
                        { name: 'Muted by', value: interaction.user.tag, inline: true },
                        { name: 'Date', value: new Date().toLocaleString(), inline: true }
                    )
                    .setFooter({ text: 'You will be unmuted automatically when the duration expires' })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`Could not send DM to ${targetUser.tag}: ${dmError.message}`);
            }

        } catch (error) {
            console.error('Error muting user:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to mute the user.',
                ephemeral: true
            });
        }
    }
};

// Helper function to parse duration string
function parseDuration(duration) {
    const regex = /^(\d+)(s|m|h|d)$/;
    const match = duration.toLowerCase().match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

// Helper function to format duration
function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day(s)`;
    if (hours > 0) return `${hours} hour(s)`;
    if (minutes > 0) return `${minutes} minute(s)`;
    return `${seconds} second(s)`;
} 