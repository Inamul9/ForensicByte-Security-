const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const Warning = require('../../../database/models/Warning');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    permissions: [PermissionFlagsBits.ModerateMembers],

    async execute(interaction, client) {
        const targetUser = interaction.options.getUser('user');

        try {
            // Get user's warnings
            const warnings = await Warning.find({
                guildId: interaction.guildId,
                userId: targetUser.id,
                active: true
            }).sort({ timestamp: -1 });

            if (warnings.length === 0) {
                const noWarningsEmbed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ No Active Warnings')
                    .setDescription(`${targetUser.tag} has no active warnings.`)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();

                return interaction.reply({ embeds: [noWarningsEmbed] });
            }

            // Create warnings embed
            const warningsEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`⚠️ Warnings for ${targetUser.tag}`)
                .setThumbnail(targetUser.displayAvatarURL())
                .setFooter({ text: `Total active warnings: ${warnings.length}` })
                .setTimestamp();

            // Add warning fields (limit to 25 due to Discord embed limits)
            const warningsToShow = warnings.slice(0, 25);
            warningsToShow.forEach((warning, index) => {
                const moderator = interaction.guild.members.cache.get(warning.moderatorId);
                const moderatorName = moderator ? moderator.user.tag : 'Unknown Moderator';
                
                warningsEmbed.addFields({
                    name: `Warning #${index + 1}`,
                    value: `**Reason:** ${warning.reason}\n**Moderator:** ${moderatorName}\n**Date:** ${warning.timestamp.toLocaleString()}`,
                    inline: false
                });
            });

            if (warnings.length > 25) {
                warningsEmbed.addFields({
                    name: 'Note',
                    value: `Showing first 25 warnings. Total: ${warnings.length}`,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [warningsEmbed] });

        } catch (error) {
            console.error('Error fetching warnings:', error);
            await interaction.reply({
                content: '❌ An error occurred while fetching warnings.',
                ephemeral: true
            });
        }
    }
}; 