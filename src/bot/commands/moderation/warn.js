const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logActivity } = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    permissions: [PermissionFlagsBits.ModerateMembers],

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if user is trying to warn themselves
        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ You cannot warn yourself!',
                ephemeral: true
            });
        }

        // Check if user is trying to warn the bot
        if (targetUser.id === client.user.id) {
            return interaction.reply({
                content: '❌ You cannot warn the bot!',
                ephemeral: true
            });
        }

        try {
            // Save warning to database
            const Warning = require('../../../database/models/Warning');
            const warning = await Warning.create({
                guildId: interaction.guildId,
                userId: targetUser.id,
                moderatorId: interaction.user.id,
                reason: reason,
                timestamp: new Date()
            });

            // Get warning count for this user
            const warningCount = await Warning.countDocuments({
                guildId: interaction.guildId,
                userId: targetUser.id
            });

            // Create warn embed
            const warnEmbed = new EmbedBuilder()
                .setColor('#ffff00')
                .setTitle('⚠️ User Warned')
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                    { name: 'Warned by', value: `${interaction.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Warning #', value: `${warningCount}`, inline: true },
                    { name: 'Date', value: new Date().toLocaleString(), inline: true }
                )
                .setFooter({ text: 'Moderation Action' })
                .setTimestamp();

            // Send confirmation
            await interaction.reply({
                embeds: [warnEmbed],
                ephemeral: false
            });

            // Log the action
            await logActivity('USER_WARNED', reason, targetUser.id, interaction.guildId);

            // Send DM to warned user (if possible)
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ffff00')
                    .setTitle('You have been warned')
                    .setDescription(`You have received a warning in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Reason', value: reason, inline: false },
                        { name: 'Warned by', value: interaction.user.tag, inline: true },
                        { name: 'Warning #', value: `${warningCount}`, inline: true },
                        { name: 'Date', value: new Date().toLocaleString(), inline: true }
                    )
                    .setFooter({ text: 'Please follow the server rules to avoid further warnings' })
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`Could not send DM to ${targetUser.tag}: ${dmError.message}`);
            }

        } catch (error) {
            console.error('Error warning user:', error);
            await interaction.reply({
                content: '❌ An error occurred while trying to warn the user.',
                ephemeral: true
            });
        }
    }
}; 