const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const cConsole = require('../utils/customConsoleLog');
const databaseUtilities = require('../utils/databaseUtilities');
const embedUtilities = require('../utils/embedUtilities');
const queueData = require('../data/queueData.js');
const queueSettings = require('../data/queueSettings');

const userWhitelist = [
    // '479936093047750659', // 888% [Bypass]
    '280432147695665163', // Joshh
    '599339755662082057', // Darn
    '688819598686289952', // Lxyer
    '287657356312051724', // yur
    '399024946631802891', // Wesh
    '138115007983517697', // klex
    '295244765547462656', // Acc70
    // '614257446654967813', // orangecod [lEFT THE SERVER]
    '465960027400830980', // Stockfish 13
    // '267442458638417921', // NoLimitGoten [lEFT THE SERVER]
    '371465297477238784', // lydipai
    '437259152574906368', // SuperSpaceMonke
    '492497679570436117', // CSmith_Games
    '95630080893521920',  // kaelan
    '568449733228756993', // Bramble
    // '382279435828723716', // FinnayBusiness [Bypass]
    '178625919559270409', // ncj
    '510636937489416196', // Nate
]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fillqueue')
        .setDescription('Fills the queue with random people to test the queue system')
        .addNumberOption(option => option
            .setName('queueamount')
            .setDescription('Enter the numbers of players added to the queue')
            .setRequired(false)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
            interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
            return
        }

        const lobby = await queueSettings.getRankedLobbyById(interaction.channel, interaction.guild.id);
        if (!['ones', 'twos', 'threes'].includes(lobby)) {
            await interaction.reply({
                content: 'Something went wrong.... This is probably not the right channel for this command.', 
                ephemeral: true
            });
            return;
        }
        var queueAmount = interaction.options.getNumber('queueamount');
        if (queueAmount == 0 || queueAmount == null) {queueAmount = 6;}

        const queueSettingsData = await queueSettings.getQueueDatabaseById(interaction.guild.id).catch(console.error);
        await queueData.actions.fillQueueWithPlayers(userWhitelist, lobby, queueAmount, queueSettingsData);
        
        await interaction.client.emit('queueEvent', interaction, 'add');
        await interaction.reply({
            embeds: embedUtilities.presets.queueStatusEmbed(lobby, 'add', interaction)
        });
    },
};