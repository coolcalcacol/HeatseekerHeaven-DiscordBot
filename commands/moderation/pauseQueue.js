const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, Permissions } = require('discord.js');

const guildConfigStorage = require('../../data/database/guildConfigStorage');
const generalData = require('../../data/generalData');
const cConsole = require('../../utils/customConsoleLog');
const { getCommandPermissions } = require('../../utils/userPermissions');

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
        const permission = await getCommandPermissions(
            interaction, 
            {
                creator: true,
                owner: true,
                admin: true,
                superAdmin: true,
                adminPermission: false
            }
        );
        if (!permission) { return; }
        // const guildId = interaction.guild.id;

        const state = interaction.options.getBoolean('state');
        generalData.generalQueueSettings.pauseQueue = state;

        await interaction.reply({
            ephemeral: true,
            content: `You succesfully ${(state) ? 'paused' : 'unpaused'} the queue`
        }).catch(console.error);
    },
};