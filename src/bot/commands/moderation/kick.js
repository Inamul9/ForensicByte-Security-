const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logActivity } = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    permissions: [PermissionFlagsBits.KickMembers],

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if user is trying to kick themselves
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot kick yourself!',
                ephemeral: true
            });
        }

        // Check if user is trying to kick the bot
        if (targetUser.id === client.user.id) {
            return interaction.reply({
                content: '❌ You cannot kick the bot!',
                ephemeral: true
            });
        }

        // Check if target user is kickable
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        if (!targetMember.kickable) {
            return interaction.reply({
                content: '❌ I cannot kick this user. They may have higher permissions than me.',
                ephemeral: true
            });
        }

        try {
            // Create kick embed
            const kickEmbed = new EmbedBuilder()
                .setColor('#ffa500')
                .setTitle('👢 User Kicked')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Kicked by', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Date', value: new Date().toLocaleString(), inline: true }
                )
                .setFooter({ text: 'Moderation Action' })
                .setTimestamp();

            // Kick the user
            await targetMember.kick(`${reason} | Kicked by ${interaction.user.tag}`);

            // Send confirmation
            await interaction.reply({
                embeds: [kickEmbed],
                ephemeral: false
            });

            // Log the action
            await logActivity('USER_KICKED', reason, targetUser.id, interaction.guildId);

            // Send DM to kicked user (if possible)
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ffa500')
                    .setTitle('You have been kicked')
                    .setDescription(`You have been kicked from **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Reason', value: reason, inline: false },
                        { name: 'Kicked by', value: interaction.user.tag, inline: true },
                        { name: 'Date', value: new Date().toLocaleString(), inline: true }
                    )
                    .setFooter({ text: 'You can rejoin the server if you have an invite link' })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`Could not send DM to ${targetUser.tag}: ${dmError.message}`);
            }

        } catch (error) {
            console.error('Error kicking user:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to kick the user.',
                ephemeral: true
            });
        }
    }
}; 