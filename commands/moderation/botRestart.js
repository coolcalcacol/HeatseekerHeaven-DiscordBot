const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const cConsole = require('../../utils/customConsoleLog');
const { getCommandPermissions } = require('../../utils/userPermissions');
const { token } = require('../../config/private.json');
const generalData = require('../../data/generalData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('force-restart')
        .setDescription('Restarts the bot'),

    /** 
     * @param {CommandInteraction} interaction
    */
    async execute(interaction) {
        const permission = await getCommandPermissions(
            interaction, 
            {
                creator: true,
                owner: false,
                admin: false,
                superAdmin: true,
                adminPermission: false
            }
        );
        if (!permission) { return; }
        
        cConsole.log('[fg=red]Restarting bot...[/>]', {autoColorize: false});
        await interaction.reply({
            ephemeral: true,
            content: 'Restarting bot...',
        })
        .then(() => { interaction.client.destroy() })
        .catch(console.error);

        cConsole.log('[bg=red][fg=white]Process Exit (0)...[/>]', {autoColorize: false});
        process.exit(0);

        await interaction.client.login(token);
        console.log('Bot restarted');
    },
};