const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queueadmin')
        .setDescription('Admin commands to manage the queues')
        .addSubcommand(subCommand => subCommand
            .setName('cancel')
            .addStringOption(option => option
                .setName('game-id')
                .setDescription('The ID of the game you want to cancel')
                .setRequired(true)
            )
        )
        .addSubcommand(subCommand => subCommand
            .setName('remove-user')
            .addStringOption(option => option
                .setName('game-id')
                .setDescription('The ID of the game you want to cancel')
                .setRequired(true)
            )
        ),
    async execute(interaction) {
        await interaction.reply('Pong!');
    },
};