const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const generalData = require('../../data/generalData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause-queue')
        .setDescription('Prevent users from entering in queue')
        .addBooleanOption(option => option
            .setName('state')
            .setDescription('True: pause the queue | False: unpause the queue')
            .setRequired(true)
        ),
    /** 
     * @param {CommandInteraction} interaction
    */
    async execute(interaction) {
        const state = interaction.options.getBoolean('state');
        generalData.generalQueueSettings.pauseQueue = state;

        await interaction.reply({
            ephemeral: true,
            content: `You succesfully ${(state) ? 'paused' : 'unpaused'} the queue`
        }).catch(console.error);
    },
};