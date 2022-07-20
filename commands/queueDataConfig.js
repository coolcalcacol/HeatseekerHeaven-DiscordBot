const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const QueueDatabase = require('../data/database/queueDataStorage');
const cConsole = require('../utils/customConsoleLog');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('queueconfig')
        .setDescription('Replies with Pong!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setrankedchannel')
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
        .addSubcommand(subcommand =>
            subcommand
                .setName('getmatchid')
                .setDescription('Get the current match ID')
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
            interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
            return
        }
        
        switch (interaction.options.getSubcommand()) {
            case 'setrankedchannel': {
                var type = interaction.options.getString('type');
                var onesInput = '';
                var twosInput = '';
                var threesInput = '';
                var reportChannelInput = '';
                switch (type) {
                    case 'ones': onesInput = interaction.options.getChannel('channel').id; type = '1v1'; break;
                    case 'twos': twosInput = interaction.options.getChannel('channel').id; type = '2v2'; break;
                    case 'threes': threesInput = interaction.options.getChannel('channel').id; type = '3v3'; break;
                    case 'reportChannel': reportChannelInput = interaction.options.getChannel('channel').id; type = 'matchReport'; break;
                    default: break;
                }

                var query = QueueDatabase.find({});
                var queueData = (await query.select())[0];
                var channelSettings = {};
                if (queueData != null) {
                    channelSettings = queueData.channelSettings
                }
                
                QueueDatabase.findOne({ channelSettings: channelSettings}, (error, data) => {
                    if (error) {
                        console.log(error);
                        interaction.reply('ERROR\n```' + error + '```')
                    }

                    if (!data) {
                        // Data doesnt exist yet, create the first data document
                        data = new QueueDatabase({
                            matchId: 0,
                            channelSettings: {
                                onesChannel: onesInput,
                                twosChannel: twosInput,
                                threesChannel: threesInput,
                                matchReportChannel: reportChannelInput,
                            }
                        });
                        cConsole.log('New data document created.\n' + data);
                    }
                    else {
                        // Overwrite the date to the current input
                        data.channelSettings[interaction.options.getString('type') + 'Channel'] = interaction.options.getChannel('channel').id;
                        cConsole.log(
                            '[style=bold][style=underscore]Queue data channel settings adjusted[/>]\n' + 
                            type + ' channel is now set to ' + 
                            data.channelSettings[interaction.options.getString('type') + 'Channel'] + 
                            '\n---- [style=underscore]Document[/>] ----\n' + data
                        )
                    }
                    
                    // Save the newly created/edited data to the database
                    data.save(error => {
                        if (error) {
                            cConsole.log(error);
                            interaction.reply('ERROR\n```' + error + '```')
                        }
                        return data.matchId + '$';
                    });
                });
                await interaction.reply(
                    '<#' + interaction.options.getChannel('channel') + '>' +
                    ' is now set as the **' + type + '** ranked channel'
                );
            }
            break;
            case 'getmatchid': {
                var query = QueueDatabase.find({})
                await interaction.reply({
                    content: 'The current match ID is: `' + (await query.select())[0].matchId + '`',
                    ephemeral: false
                })
            }
            break;
            default:
                break;
        }
    },
};