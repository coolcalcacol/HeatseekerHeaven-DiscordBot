const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');
const cConsole = require('../../utils/customConsoleLog');
const { getCommandPermissions } = require('../../utils/userPermissions');
const { token } = require('../../config/private.json');
const generalData = require('../../data/generalData');
const queueConfigStorage = require('../../data/database/queueConfigStorage');
const queueSettings = require('../../data/queueSettings');
const guildConfigStorage = require('../../data/database/guildConfigStorage');
const clientSendMessage = require('../../utils/clientSendMessage');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('force-restart')
        .setDescription('Restarts the bot')
        .addStringOption(option => option
            .setName('reason')
            .setDescription('The reason to restart the bot')
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
                owner: false,
                admin: false,
                superAdmin: true,
                adminPermission: false
            }
        );
        if (!permission) { return; }
        
        const queueConfig = await queueSettings.getQueueDatabaseById(interaction.guild.id);
        const guildData = await guildConfigStorage.findOne({_id: interaction.guild.id}).catch(console.error);
        if (queueConfig.channelSettings.logChannel) {
            let adminRoleMention = '';
            for (const role in guildData.adminRoles) {
                adminRoleMention += role + ' ';
            }
            clientSendMessage.sendMessageTo(queueConfig.channelSettings.logChannel, [
                // `||${adminRoleMention}||`,
                `**The bot is being __Restarted__** by <@${interaction.user.id}>`,
                `user ID: \`${interaction.user.id}\``,
                `User Name: \`${interaction.user.username}#${interaction.user.discriminator}\``,
                `> Reason: \`${interaction.options.getString('reason')}\``
            ].join('\n'));
        }

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