const { SlashCommandBuilder, ChannelT} = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const QueueConfig = require('../data/database/queueConfigStorage');
const playerData = require('../data/playerData');
const generalData = require('../data/generalData');
const queueSettings = require('../data/queueSettings');

const cConsole = require('../utils/customConsoleLog');
const clientSendMessage = require('../utils/clientSendMessage');
const generalUtilities = require('../utils/generalUtilities');
const { getCommandPermissions } = require('../utils/userPermissions');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('queueconfig')
        .setDescription('Define how the queue system should act')
        .addSubcommand(subcommand => subcommand // set-channel
                .setName('set-channel')
                .setDescription('Set a channel for ranked match making')
                .addStringOption(option => option // type
                    .setName('type')
                    .setDescription('The type of queue')
                    .setRequired(true)
                        .addChoice('1v1', 'onesChannel')
                        .addChoice('2v2', 'twosChannel')
                        .addChoice('3v3', 'threesChannel')
                        .addChoice('Report Channel', 'matchReportChannel')
                        .addChoice('Auto Queue VC 1v1', 'autoQueue1VC')
                        .addChoice('Auto Queue VC 2v2', 'autoQueue2VC')
                        .addChoice('Auto Queue VC 3v3', 'autoQueue3VC')
                        .addChoice('Team Channel Category', 'teamChannelCategory')
                        .addChoice('Log Channel', 'logChannel')
                )
                .addChannelOption(option => option // channel
                    .setName('channel')
                    .setDescription('The channel to be used for the queue')
                    .setRequired(true)
                )
        )
        .addSubcommand(subcommand => subcommand // mmr-settings
            .setName('mmr-settings')
            .setDescription('Set some MMR related values for the MMR equation')
            .addNumberOption(option => option // startingmmr
                .setName('starting-mmr')
                .setDescription('This is the number that the equation starts on [DEFAULT = 1000]')
            )
            .addNumberOption(option => option // base-gain
                .setName('base-gain')
                .setDescription('This is the number that the equation starts on [DEFAULT = 50]')
            )
            .addNumberOption(option => option // onesmultiplier
                .setName('ones-multiplier')
                .setDescription('When Global MMR is calculated, the 1v1 MMR is miltiplied by this value [DEFAULT = 0.2]')
            )
            .addNumberOption(option => option // twosmultiplier
                .setName('twos-multiplier')
                .setDescription('When Global MMR is calculated, the 2v2 MMR is miltiplied by this value [DEFAULT = 0.3]')
            )
            .addNumberOption(option => option // threesmultiplier
                .setName('threes-multiplier')
                .setDescription('When Global MMR is calculated, the 3v3 MMR is miltiplied by this value [DEFAULT = 0.5]')
            )
            .addNumberOption(option => option // minstart
                .setName('min-start')
                .setDescription('If MMR is less then this value, the player looses less points [DEFAULT = 100]')
            )
            .addNumberOption(option => option // mincap
                .setName('min-cap')
                .setDescription('Mmr cant get below this value (Value must be >= 0 and < minStart) [DEFAULT = 0]')
            )
            .addNumberOption(option => option // maxstart
                .setName('max-start')
                .setDescription('If MMR is greater then this value, the player gains less points [DEFAULT = 1500]')
            )
            .addNumberOption(option => option // maxcap
                .setName('max-cap')
                .setDescription('Mmr cant get above this value (Value must be > maxStart) [DEFAULT = 2500]')
            )
        )
        .addSubcommand(subcommand => subcommand // set-roles
                .setName('set-roles')
                .setDescription('Set some relevant roles')
                .addStringOption(option => option // type
                    .setName('type')
                    .setDescription('The type of role')
                    .setRequired(true)
                        .addChoice('In active game', 'inActiveGameRole')
                        .addChoice('Region EU', 'regionEU')
                        .addChoice('Region US', 'regionUS')
                )
                .addRoleOption(option => option // role
                    .setName('role')
                    .setDescription('The role to be used')
                    .setRequired(true)
                )
        )
        .addSubcommand(subcommand => subcommand // set-region-roles
                .setName('set-region-roles')
                .setDescription('Define the region roles')
                .addStringOption(option => option // region
                    .setName('region')
                    .setDescription('The region accronym (EU, US, USE, etc.)')
                    .setRequired(true)
                        .addChoice('EU', 'EU')
                        .addChoice('US', 'US')
                        .addChoice('USE', 'USE')
                        .addChoice('USW', 'USW')
                        .addChoice('SAM', 'SAM')
                        .addChoice('MENA', 'MENA')
                        .addChoice('SSA', 'SSA')
                        .addChoice('OCE', 'OCE')
                )
                .addStringOption(option => option // region
                    .setName('region-display')
                    .setDescription('The region display name (Europe, United States, etc.)')
                    .setRequired(true)
                )
                .addRoleOption(option => option // role
                    .setName('role')
                    .setDescription('The role to be used')
                    .setRequired(true)
                )
                .addStringOption(option => option // region
                    .setName('region-neighbours')
                    .setDescription('The region neighbours seperated by a commas (EU, US, USE, etc.)')
                    .setRequired(true)
                )
                .addBooleanOption(option => option
                    .setName('tie-breaker')
                    .setDescription('Should this region break a tie?')
                    .setRequired(false)
                )
        )
        .addSubcommand(subcommand => subcommand // set-rank-role
            .setName('set-rank-role')
            .setDescription('Set a channel for ranked match making')
            .addRoleOption(option => option // role
                .setName('role')
                .setDescription('The role to be used for this rank')
                .setRequired(true)
            )
            .addStringOption(option => option // mode
                .setName('mode')
                .setDescription('The mode that the rank is going to apply for')
                .setRequired(true)
                    .addChoice('global', 'global')
                    .addChoice('1v1', 'ones')
                    .addChoice('2v2', 'twos')
                    .addChoice('3v3', 'threes')
            )
            .addStringOption(option => option // distribution
                .setName('distribution')
                .setDescription('The distribution of the rank (1-10 for the top 10) (20% to apply to the remaining 20%)')
                .setRequired(true)
                    .addChoice('Top 10', 'top')
                    .addChoice('25%', '25%')
                    .addChoice('50%', '50%')
                    .addChoice('Meet Requirements', 'meet-requirements')
            )
            .addIntegerOption(option => option // min-mmr
                .setName('min-mmr')
                .setDescription('Must meet requirement: >= x mmr [-1 to disable]')
                .setRequired(false)
            )
            .addIntegerOption(option => option // min-gp
                .setName('min-games-played')
                .setDescription('Must meet requirement: >= x Games Played [-1 to disable]')
                .setRequired(false)
            )
            .addNumberOption(option => option // min-wr
                .setName('min-winrate')
                .setDescription('Must meet requirement: >= x% Win Rate [-1 to disable]')
                .setRequired(false)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('set-ping-role')
            .setDescription('Set the role to be pinged when ever someone uses the /ranked-ping command')
            .addRoleOption(option => option // ping-role
                .setName('ping-role')
                .setDescription('The role to be pinged')
                .setRequired(true)
            )
            .addIntegerOption(option => option // hours
                .setName('hours')
                .setDescription('Time in hours for the command cooldown')
                .setRequired(false)
            )
        ),
    async execute(interaction) {
        const permission = await getCommandPermissions(
            interaction, 
            {
                creator: true,
                owner: true,
                admin: false,
                superAdmin: true,
                adminPermission: false
            }
        );
        if (!permission) { return; }

        const guildId = interaction.guild.id;
        const queueSettingsData = await queueSettings.getQueueDatabaseById(guildId, true)
        var compare = true;

        switch (interaction.options.getSubcommand()) {
            case 'set-channel': {
                const targetChannel = await interaction.options.getString('type');
                try {
                    queueSettingsData.channelSettings[targetChannel] = interaction.options.getChannel('channel').id;
                } catch (err) {console.error(err);}

                await interaction.reply({
                    ephemeral: true,
                    content: '<#' + interaction.options.getChannel('channel') + '>' +
                    ' is now set as the **' + targetChannel + '** channel'
                });
            } break;
            case 'mmr-settings': {
                const eq = queueSettingsData.mmrSettings;
                eq.startingMmr = interaction.options.getNumber('starting-mmr') ? interaction.options.getNumber('starting-mmr') : eq.startingMmr;
                eq.baseGain = interaction.options.getNumber('base-gain') ? interaction.options.getNumber('base-gain') : eq.baseGain;
                eq.onesMultiplier = interaction.options.getNumber('ones-multiplier') ? interaction.options.getNumber('ones-multiplier') : eq.onesMultiplier;
                eq.twosMultiplier = interaction.options.getNumber('twos-multiplier') ? interaction.options.getNumber('twos-multiplier') : eq.twosMultiplier;
                eq.threesMultiplier = interaction.options.getNumber('threes-multiplier') ? interaction.options.getNumber('threes-multiplier') : eq.threesMultiplier;
                eq.minStart = interaction.options.getNumber('min-start') ? interaction.options.getNumber('min-start') : eq.minStart;
                eq.minCap = interaction.options.getNumber('min-cap') ? interaction.options.getNumber('min-cap') : eq.minCap;
                eq.maxStart = interaction.options.getNumber('max-start') ? interaction.options.getNumber('max-start') : eq.maxStart;
                eq.maxCap = interaction.options.getNumber('max-cap') ? interaction.options.getNumber('max-cap') : eq.maxCap;

                queueSettingsData.mmrSettings = eq;

                await interaction.reply({
                    ephemeral: true,
                    content: 
                        '__**New MMR values have been set**__\n```js\n' + 
                        queueSettingsData.mmrSettings + 
                        '\n```'
                });
            } break;
            case 'set-roles': {
                const targetRole = interaction.options.getString('type');
                const inputRole = interaction.options.getRole('role');
                try {
                    queueSettingsData.roleSettings[targetRole] = inputRole.toJSON();
                } catch (err) {console.error(err);}
                compare = false;

                await interaction.reply({
                    ephemeral: true,
                    content: '<@&' + interaction.options.getRole('role') + '>' +
                    ' is now set as **' + targetRole + '**'
                });
            } break;
            case 'set-region-roles': {
                const targetRegion = interaction.options.getString('region');
                const regionDisplay = interaction.options.getString('region-display');
                const inputRole = interaction.options.getRole('role');
                const regionNeighbours = interaction.options.getString('region-neighbours').replaceAll(' ', '').split(',');
                const tieBreaker = (interaction.options.getBoolean('tie-breaker')) ? interaction.options.getBoolean('tie-breaker') : false;

                const regionObject = {
                    region: targetRegion,
                    regionDisplay: regionDisplay,
                    role: inputRole.toJSON(),
                    neighbours: regionNeighbours,
                    tieBreaker: tieBreaker
                }

                let index = -1;
                for (let i = 0; i < queueSettingsData.roleSettings.regionRoles.length; i++) { // check if the region already exists
                    if (queueSettingsData.roleSettings.regionRoles[i].region == targetRegion) {
                        index = i;
                        break;
                    }
                }
                if (index != -1) {
                    queueSettingsData.roleSettings.regionRoles[index] = regionObject;
                }
                else {
                    queueSettingsData.roleSettings.regionRoles.push(regionObject);
                }

                compare = false;

                await interaction.reply({
                    ephemeral: true,
                    content: '<@&' + interaction.options.getRole('role') + '>' +
                    ' is now set as **' + regionDisplay + '**'
                });
            } break;
            case 'set-rank-role': {
                compare = false;
                const role = interaction.options.getRole('role');
                const rankRole = {
                    role: {name: role.name, id: role.id},
                    distribution: interaction.options.getString('distribution'),
                    requirements: {
                        mmr: interaction.options.getInteger('min-mmr') ? 
                            interaction.options.getInteger('min-mmr') : -1,
                        gamesPlayed: interaction.options.getInteger('min-games-played') ? 
                            interaction.options.getInteger('min-games-played') : -1,
                        winRate: interaction.options.getNumber('min-winrate') ? 
                            interaction.options.getNumber('min-winrate') : -1,
                    }
                };
                
                const mode = interaction.options.getString('mode');
                const targetModeRanks = queueSettingsData.rankRoles[mode];
                
                var updated = false;
                for (let i = 0; i < targetModeRanks.length; i++) {
                    const rank = targetModeRanks[i];
                    if (rank.role.id == rankRole.role.id || rank.distribution == rankRole.distribution) {
                        targetModeRanks[i] = rankRole;
                        updated = true;
                        break;
                    }
                }
                if (!updated) {
                    targetModeRanks.push(rankRole);
                }

                await queueSettings.updateQueueDatabase(queueSettingsData, true, compare).catch(console.error);
                await interaction.reply({
                    ephemeral: true,
                    content: 
                        'Set new rank role!\n```js\n' + 
                        cConsole.decolorize(cConsole.unfoldNestedObject(JSON.parse(JSON.stringify(rankRole)), 2, ' ')) + 
                        '\n```'
                }).catch(console.error);
            } break;
            case 'set-ping-role': {
                const role = interaction.options.getRole('ping-role').id;
                const cooldown = interaction.options.getInteger('hours');
                queueSettingsData.rankedPing.role = role;
                queueSettingsData.rankedPing.cooldown = cooldown ? cooldown : queueSettingsData.rankedPing.cooldown;
                await interaction.reply({
                    ephemeral: true,
                    content: 'Ping role has been updated\n```js\n' + queueSettingsData.rankedPing + '\n```'
                }).catch(console.error);
            } break;
            default: break;
        }

        await queueSettings.updateQueueDatabase(queueSettingsData, true, compare).catch(console.error);

        if (generalData.logOptions.queueConfigCommands) {
            cConsole.log(
                '[style=bold][style=underscore]Queue data settings adjusted[/>]\n' + 
                '\n---- [style=underscore]Document[/>] ----\n' + queueSettingsData
            );
        }
        if (queueSettingsData.channelSettings.logChannel) {
            for (const role in queueSettingsData.roleSettings.schema.obj.roleSettings) {
                const roleId = queueSettingsData.roleSettings[role]['id'];
                const roleName = queueSettingsData.roleSettings[role]['name'];
                queueSettingsData.roleSettings[role] = {
                    id: roleId,
                    name: roleName
                }
            }
            clientSendMessage.sendMessageTo(
                queueSettingsData.channelSettings.logChannel,
                [
                    `__**New/Updated Config Document**__:`,
                    `User: <@${interaction.user.id}> used command \`/${this.data.name}\` \`${interaction.options.getSubcommand()}\``,
                    `\`\`\`js\n${queueSettingsData}\n\`\`\``,
                    `<t:${generalUtilities.generate.getTimestamp(new Date())}:R>`
                ].join('\n')
            );
        }
    },
};