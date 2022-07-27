const { SlashCommandBuilder } = require('@discordjs/builders');
const queueData = require('../data/queueData');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('teams')
        .setDescription('Displays the current teams'),
    async execute(interaction) {
        
    },
};