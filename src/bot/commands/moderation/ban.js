const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logActivity } = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    permissions: [PermissionFlagsBits.BanMembers],

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const deleteMessageDays = interaction.options.getInteger('days') || 0;

        // Check if user is trying to ban themselves
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot ban yourself!',
                ephemeral: true
            });
        }

        // Check if user is trying to ban the bot
        if (targetUser.id === client.user.id) {
            return interaction.reply({
                content: '❌ You cannot ban the bot!',
                ephemeral: true
            });
        }

        // Check if target user is bannable
        const targetMember = await interaction.guild.members.fetch(targetUser.id);
        if (!targetMember.bannable) {
            return interaction.reply({
                content: '❌ I cannot ban this user. They may have higher permissions than me.',
                ephemeral: true
            });
        }

        try {
            // Create ban embed
            const banEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔨 User Banned')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Banned by', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Date', value: new Date().toLocaleString(), inline: true }
                )
                .setFooter({ text: 'Moderation Action' })
                .setTimestamp();

            // Ban the user
            await interaction.guild.members.ban(targetUser, {
                reason: `${reason} | Banned by ${interaction.user.tag}`,
                deleteMessageDays: deleteMessageDays
            });

            // Send confirmation
            await interaction.reply({
                embeds: [banEmbed],
                ephemeral: false
            });

            // Log the action
            await logActivity('USER_BANNED', reason, targetUser.id, interaction.guildId);

            // Send DM to banned user (if possible)
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('You have been banned')
                    .setDescription(`You have been banned from **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Reason', value: reason, inline: false },
                        { name: 'Banned by', value: interaction.user.tag, inline: true },
                        { name: 'Date', value: new Date().toLocaleString(), inline: true }
                    )
                    .setFooter({ text: 'If you believe this was a mistake, contact a server administrator' })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`Could not send DM to ${targetUser.tag}: ${dmError.message}`);
            }

        } catch (error) {
            console.error('Error banning user:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to ban the user.',
                ephemeral: true
            });
        }
    }
}; 