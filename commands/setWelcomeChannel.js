const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const GuildSettings = require('../data/database/guildSettings');
const { cConsole } = require('../utils/utilityManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcomechannel')
        .setDescription('Set the welcome channel of the server')
        .addChannelOption(option => 
            option.setName('welcome')
            .setDescription('The channel to set as the welcome channel')
            .setRequired(true)
        ),
    async execute(interaction) {
        //check for admin
        if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
            interaction.reply('You do not have permission to use this command.');
            return
        }

        GuildSettings.findOne({ guildId: interaction.guild.id }, (error, settings) => {
            if (error) {
                cConsole.log(error);
                interaction.reply('ERROR\n```' + error + '```')
            }
            if (!settings) {
                settings = new GuildSettings({
                    guildId: interaction.guild.id,
                    welcomeChannelId: interaction.options.getChannel('welcome').id
                });
            }
            else {
                settings.welcomeChannelId = interaction.options.getChannel('welcome').id;
            }

            settings.save(error => {
                if (error) {
                    cConsole.log(error);
                    interaction.reply('ERROR\n```' + error + '```')
                }
                
                interaction.reply('Welcome channel has been set to <#'+ interaction.options.getChannel('welcome').id +'>');
            });
        })
    },
};