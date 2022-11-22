const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Permissions } = require('discord.js');

const QueueDatabase = require('../../data/database/queueDataStorage');
const guildConfigStorage = require('../../data/database/guildConfigStorage')
const playerData = require('../../data/playerData');

const cConsole = require('../../utils/customConsoleLog');
const generalUtilities = require('../../utils/generalUtilities');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('display-blacklist')
        .setDescription('Displays the list of blacklisted users'),
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

        const guildConfig = await guildConfigStorage.findOne({_id: interaction.guild.id}).catch(console.error);

        const getGuildQueueData = async function () {return await QueueDatabase.findOne({_id: interaction.guild.id}).catch(console.error);};
        if (!await getGuildQueueData()) {
            await QueueDatabase.insertMany({_id: interaction.guild.id});
            // guildQueueData = await QueueDatabase.findOne({_id: interaction.guild.id}).catch(console.error);
        }
        const guildQueueData = await getGuildQueueData();
        const guildBlacklist = guildQueueData.userBlacklist;

        var lineBreak = '───────────────';

        var nameFields = '';
        var durationFields = '';
        for (const user in guildBlacklist) {
            if (user == 'placeholder') continue;
            const target = guildBlacklist[user];
            nameFields += target.playerData.userData.mention + '\n' + lineBreak + '\n';
            durationFields += `<t:${generalUtilities.generate.getTimestamp(target.duration)}:R>\n${lineBreak}\n` 
        }
        if (nameFields == '') {
            nameFields = ' - ';
            durationFields = ' - '
        }

        const embed = new MessageEmbed({
            title: 'User Blacklist',
            color: '#ff5354',
            fields: [
                {name: 'User', value: nameFields, inline: true},
                {name: 'Experation', value: durationFields, inline: true},
            ]
        });

        await interaction.reply({
            ephemeral: false,
            embeds: [embed]
        }).catch(console.error);
    },
};