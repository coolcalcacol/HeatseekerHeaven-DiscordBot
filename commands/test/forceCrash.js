const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const generalData = require('../../data/generalData');
const { creatorId } = require('../../config/private.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forcecrash')
        .setDescription('Crashes the bot for test purposes'),
    async execute(interaction) {
        if (interaction != null && !interaction.user.id === creatorId) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to use this command.',
            }).catch(console.error);
            cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use this command`);
            return;
        }
        await interaction.reply({
            ephemeral: true,
            content: 'I dont feel so good...'
        }).catch(console.error);
        const oof = generalData.client.guilds.blalala('awd');
        console.log(oof);
    },
};