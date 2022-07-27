const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const QueueDatabase = require('../data/database/queueDataStorage');
const queueSettings = require('../data/queueSettings');
const playerData = require('../data/playerData');
const generalData = require('../data/generalData');
const cConsole = require('../utils/customConsoleLog');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('queueconfig')
        .setDescription('Define how the queue system should act')
        .addSubcommand(subcommand => subcommand
                .setName('set-channel')
                .setDescription('Set a channel for ranked match making')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of queue')
                        .setRequired(true)
                            .addChoice('1v1', 'ones')
                            .addChoice('2v2', 'twos')
                            .addChoice('3v3', 'threes')
                            .addChoice('Report Channel', 'reportChannel')
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to be used for the queue')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand => subcommand
            .setName('mmrsettings')
            .setDescription('Set some MMR related values for the MMR equation')
            .addNumberOption(option => option
                .setName('startingmmr')
                .setDescription('This is the number that the equation starts on [DEFAULT = 15]')
            )
            .addNumberOption(option => option
                .setName('basegain')
                .setDescription('This is the number that the equation starts on [DEFAULT = 15]')
            )
            .addNumberOption(option => option
                .setName('minstart')
                .setDescription('If MMR is less then this value, the player looses less points [DEFAULT = 100]')
            )
            .addNumberOption(option => option
                .setName('mincap')
                .setDescription('Mmr cant get below this value (Value must be >= 0 and < minStart) [DEFAULT = 0]')
            )
            .addNumberOption(option => option
                .setName('maxstart')
                .setDescription('If MMR is greater then this value, the player gains less points [DEFAULT = 1500]')
            )
            .addNumberOption(option => option
                .setName('maxcap')
                .setDescription('Mmr cant get above this value (Value must be > maxStart) [DEFAULT = 2500]')
            )
            .addNumberOption(option => option
                .setName('onesmultiplier')
                .setDescription('When Global MMR is calculated, the 1v1 MMR is miltiplied by this value [DEFAULT = 0.5]')
            )
            .addNumberOption(option => option
                .setName('twosmultiplier')
                .setDescription('When Global MMR is calculated, the 2v2 MMR is miltiplied by this value [DEFAULT = 0.85]')
            )
            .addNumberOption(option => option
                .setName('threesmultiplier')
                .setDescription('When Global MMR is calculated, the 3v3 MMR is miltiplied by this value [DEFAULT = 1]')
            )
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
            interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
            return
        }
        
        const guildId = interaction.guild.id;
        const queueSettingsData = await queueSettings.getQueueDatabaseById(guildId, true)

        switch (interaction.options.getSubcommand()) {
            case 'set-channel': {
                const targetChannel = await interaction.options.getString('type');
                try {
                    queueSettingsData.channelSettings[targetChannel] = interaction.options.getChannel('channel').id;
                } catch (err) {console.error(err);}
                await queueSettings.updateQueueDatabase(queueSettingsData, true)
                    .catch(console.error);

                await interaction.reply({
                    ephemeral: true,
                    content: '<#' + interaction.options.getChannel('channel') + '>' +
                    ' is now set as the **' + targetChannel + '** channel'
                });
            } break;
            case 'mmrsettings': {
                const eq = queueSettingsData.mmrSettings;
                eq.startingMmr = interaction.options.getNumber('startingmmr') ? interaction.options.getNumber('startingmmr') : eq.startingMmr;
                eq.baseGain = interaction.options.getNumber('basegain') ? interaction.options.getNumber('basegain') : eq.baseGain;
                eq.minStart = interaction.options.getNumber('minstart') ? interaction.options.getNumber('minstart') : eq.minStart;
                eq.minCap = interaction.options.getNumber('mincap') ? interaction.options.getNumber('mincap') : eq.minCap;
                eq.maxStart = interaction.options.getNumber('maxstart') ? interaction.options.getNumber('maxstart') : eq.maxStart;
                eq.maxCap = interaction.options.getNumber('maxcap') ? interaction.options.getNumber('maxcap') : eq.maxCap;
                eq.onesMultiplier = interaction.options.getNumber('onesmultiplier') ? interaction.options.getNumber('onesmultiplier') : eq.onesMultiplier;
                eq.twosMultiplier = interaction.options.getNumber('twosmultiplier') ? interaction.options.getNumber('twosmultiplier') : eq.twosMultiplier;
                eq.threesMultiplier = interaction.options.getNumber('threesmultiplier') ? interaction.options.getNumber('threesmultiplier') : eq.threesMultiplier;

                var replyContent = '__**New MMR values have been set**__\n> Adjusted Values:\n```js\n{';

                queueSettingsData.mmrSettings = eq;
                await queueSettings.updateQueueDatabase(queueSettingsData, true)
                    .catch(console.error);

                await interaction.reply({
                    ephemeral: true,
                    content: 'New MMR values have been set'
                });
            } break;
            case 'clearplayerdata': {
                await playerData.clearPlayerData();
                await interaction.reply({
                    content: 'Data hase been cleared',
                    ephemeral: true
                })
            }
            break;
            default: break;
        }

        if (generalData.logOptions.queueConfigCommands) {
            cConsole.log(
                '[style=bold][style=underscore]Queue data settings adjusted[/>]\n' + 
                '\n---- [style=underscore]Document[/>] ----\n' + queueSettingsData
            )
        }
        await interaction.followUp({
            ephemeral: true,
            content: '__**New Config Document**__:\n```js\n' + queueSettingsData + '```',
        });
    },
};