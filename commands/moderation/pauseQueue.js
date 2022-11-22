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
        const guildId = interaction.guild.id;
        // if (interaction != null) {
        //     const guildConfig = await guildConfigStorage.findOne({_id: guildId}).catch(console.error);
        //     var hasAdminRole = false;
        //     if (guildConfig) {
        //         for (const adminRole in guildConfig.adminRoles) {
        //             const roleId = guildConfig.adminRoles[adminRole].id;
        //             if (interaction.member._roles.includes(roleId)) { hasAdminRole = true; break;}
        //         }
        //     }
        //     if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR]) && !hasAdminRole) {
        //         await interaction.reply({
        //             ephemeral: true,
        //             content: 'You do not have permission to use this command.',
        //         }).catch(console.error);
        //         cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use this command`);
        //         return;
        //     }
        // }
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

        const state = interaction.options.getBoolean('state');
        generalData.generalQueueSettings.pauseQueue = state;

        await interaction.reply({
            ephemeral: true,
            content: `You succesfully ${(state) ? 'paused' : 'unpaused'} the queue`
        }).catch(console.error);
    },
};