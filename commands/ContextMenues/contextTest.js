const { SlashCommandBuilder, ContextMenuCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('ping')
        .setType(2),
    async execute(interaction) {
        // console.log(interaction)
        await interaction.reply('Pong!');
    },
};