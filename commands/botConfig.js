const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botconfig')
        .setDescription('Configure the settings of this bot')
        .addSubcommand(subcommand => subcommand
            .setName('set-guild-id')
            .setDescription('Set the Default Guild Id to this Guild ID')
        ),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};