const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logActivity } = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The user ID to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the unban')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    permissions: [PermissionFlagsBits.BanMembers],

    async execute(interaction, client) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            // Check if user ID is valid
            if (!/^\d+$/.test(userId)) {
                return interaction.reply({
                    content: '❌ Please provide a valid user ID.',
                    ephemeral: true
                });
            }

            // Get banned users
            const bans = await interaction.guild.bans.fetch();
            const bannedUser = bans.get(userId);

            if (!bannedUser) {
                return interaction.reply({
                    content: '❌ This user is not banned from this server.',
                    ephemeral: true
                });
            }

            // Unban the user
            await interaction.guild.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);

            // Create unban embed
            const unbanEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔓 User Unbanned')
                .setThumbnail(bannedUser.user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${bannedUser.user.tag} (${userId})`, inline: true },
                    { name: 'Unbanned by', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Date', value: new Date().toLocaleString(), inline: true }
                )
                .setFooter({ text: 'Moderation Action' })
                .setTimestamp();

            // Send confirmation
            await interaction.reply({
                embeds: [unbanEmbed],
                ephemeral: false
            });

            // Log the action
            await logActivity('USER_UNBANNED', reason, userId, interaction.guildId);

        } catch (error) {
            console.error('Error unbanning user:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to unban the user.',
                ephemeral: true
            });
        }
    }
}; 