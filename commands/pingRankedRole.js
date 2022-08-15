const { SlashCommandBuilder } = require('@discordjs/builders');

const QueueConfig = require('../data/database/queueConfigStorage');

const queueSettings = require('../data/queueSettings');
const getQueueConfig = async function (guildId) {return await QueueConfig.findOne({_id: guildId}).catch(console.error);};

const generalUtilities = require('../utils/generalUtilities');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranked-ping')
        .setDescription('Ping the ranked role for a chance to get a queue together faster (only for impatient people)'),
    async execute(interaction) {
        const queueConfigData = await getQueueConfig(interaction.guild.id);
        const pingData = queueConfigData.rankedPing;
        if (!pingData.role) {
            await interaction.reply({
                ephemeral: true,
                content: 'This command has not been configured yet by the server admins, please ask them for help.'
            }).catch(console.error);
            return;
        }
        if ([null, 0].includes(pingData.currentCooldown) || pingData.currentCooldown <= new Date().getTime()) {
            // ping ranked role
            const time = new Date();
            const newCooldown = time.setHours(time.getHours() + pingData.cooldown);
            pingData.currentCooldown = newCooldown;
            await queueSettings.updateQueueDatabase(queueConfigData);
            await interaction.reply({
                ephemeral: false,
                content: `<@&${pingData.role}>\n> Cooldown reset: <t:${generalUtilities.generate.getTimestamp(newCooldown)}:R>`
            }).catch(console.error);
        }
        else {
            await interaction.reply({
                ephemeral: true,
                content: 'Ranked Ping cooldown expires <t:' + generalUtilities.generate.getTimestamp(pingData.currentCooldown) + ':R>'
            }).catch(console.error);
        }
    },
};