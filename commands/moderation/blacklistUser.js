const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');

const QueueDatabase = require('../../data/database/queueDataStorage');
const playerData = require('../../data/playerData');
const generalUtilities = require('../../utils/generalUtilities');

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
    async execute(interaction) {
        if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to use this command.',
            }).catch(console.error);
            cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use this command`);
            return;
        }

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
        

        const getGuildQueueData = async function () {return await QueueDatabase.findOne({_id: interaction.guild.id}).catch(console.error);};
        if (!await getGuildQueueData()) {
            await QueueDatabase.insertMany({_id: interaction.guild.id});
            // guildQueueData = await QueueDatabase.findOne({_id: interaction.guild.id}).catch(console.error);
        }

        const guildQueueData = await getGuildQueueData();

        const guildBlacklist = await guildQueueData.userBlacklist;
        guildBlacklist[targetPlayerData._id] = {playerData: targetPlayerData, duration: durationTime};

        guildQueueData.__v = guildQueueData.__v + 1;
        await QueueDatabase.updateOne({_id: interaction.guild.id}, guildQueueData);

        await interaction.reply({
            ephemeral: true,
            content: `${targetPlayerData.userData.mention} has been added to the blacklist.\nBlacklist experation: <t:${generalUtilities.generate.getTimestamp(durationTime)}:R>`
        }).catch(console.error);
    },
};