const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction } = require('discord.js');

const QueueDatabase = require('../../data/database/queueDataStorage');
const guildConfigStorage = require('../../data/database/guildConfigStorage')
const playerData = require('../../data/playerData');

const botUpdate = require('../../events/botUpdate');

const generalUtilities = require('../../utils/generalUtilities');
const cConsole = require('../../utils/customConsoleLog');
const { getCommandPermissions } = require('../../utils/userPermissions');

const getGuildQueueData = async function (guildId) {return await QueueDatabase.findOne({_id: guildId}).catch(console.error);};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Blacklist a user to prevent them from entering any ranked queue')
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user to blacklist')
            .setRequired(true)
        )
        .addIntegerOption(option => option
            .setName('days')
            .setDescription('The number of days to blacklist this user')
            .setRequired(false)
        )
        .addIntegerOption(option => option
            .setName('hours')
            .setDescription('The number of hours to blacklist this user')
            .setRequired(false)
        )
        .addIntegerOption(option => option
            .setName('minutes')
            .setDescription('The number of minutes to blacklist this user')
            .setRequired(false)
        )
        .addIntegerOption(option => option
            .setName('seconds')
            .setDescription('The number of seconds to blacklist this user')
            .setRequired(false)
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
        
        const guildConfig = await guildConfigStorage.findOne({_id: interaction.guild.id}).catch(console.error);

        const targetUser = interaction.options.getUser('user');
        const targetPlayerData = await playerData.getPlayerDataById(targetUser.id);
        const duration = {
            days: interaction.options.getInteger('days'),
            hours: interaction.options.getInteger('hours'),
            minutes: interaction.options.getInteger('minutes'),
            seconds: interaction.options.getInteger('seconds'),
        }
        const date = new Date();
        const durationTime = new Date(
            date.getFullYear(), 
            date.getMonth(), 
            date.getDate() + duration.days,
            date.getHours() + duration.hours,
            date.getMinutes() + duration.minutes,
            date.getSeconds() + duration.seconds
        );
        

        // const getGuildQueueData = async function () {return await QueueDatabase.findOne({_id: interaction.guild.id}).catch(console.error);};
        if (!await getGuildQueueData(interaction.guild.id)) {
            await QueueDatabase.insertMany({_id: interaction.guild.id});
            // guildQueueData = await QueueDatabase.findOne({_id: interaction.guild.id}).catch(console.error);
        }

        const guildQueueData = await getGuildQueueData(interaction.guild.id);

        const guildBlacklist = await guildQueueData.userBlacklist;
        console.log(targetUser);
        guildBlacklist[targetUser.id] = {playerData: targetPlayerData, userData: targetUser.toJSON(), duration: durationTime};

        guildQueueData.__v = guildQueueData.__v + 1;
        await QueueDatabase.updateOne({_id: interaction.guild.id}, guildQueueData);

        new botUpdate.UpdateTimer(targetUser.id, durationTime.getTime(), this.removeUserFromBlacklist.bind(this, targetUser.id, interaction.guild.id));

        await interaction.reply({
            ephemeral: true,
            content: `<@${targetUser.id}> has been added to the blacklist.\nBlacklist experation: <t:${generalUtilities.generate.getTimestamp(durationTime)}:R>`
        }).catch(console.error);
    },
    async removeUserFromBlacklist(id, guildId) {
        const guildQueueData = await getGuildQueueData(guildId);
        delete guildQueueData.userBlacklist[id];
        
        await QueueDatabase.updateOne({_id: guildId}, guildQueueData).catch(console.error);
        cConsole.log('removed user from blacklist\n' + id + '\n');
    }
};