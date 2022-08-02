const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('servercofig')
        .setDescription('Configure the settings of this server')
        .addSubcommand(subcommand => subcommand
            .setName('set-admin-role')
            .setDescription('The role that is allowed to use the bots Admin commands')
            .addRoleOption(option => option
                .setName('admin-role')
                .setDescription('The role to set')
                .setRequired(true)
            )
        ),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};