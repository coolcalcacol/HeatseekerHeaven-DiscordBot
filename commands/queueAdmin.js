const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageEmbed } = require('discord.js');
const config = require('../config/config.json');
const GuildSettings = require('../data/database/guildSettings')
const generalData = require('../data/generalData');
const playerData = require('../data/playerData');
const cConsole = require('../utils/customConsoleLog');
const queueData = require('../data/queueData');
const queueSettings = require('../data/queueSettings');
const clientSendMessage = require('../utils/clientSendMessage');
const mmrCalculator = require('../data/mmrCalculator');
const generalUtilities = require('../utils/generalUtilities');
const embedUtilities = require('../utils/embedUtilities');


const overwriteOptions = {
    command: '',
    cancel: {
        gameId: null,
    },
    undo: {
        gameId: null,
    },
    substitute: {
        gameId: null,
        targetUser: null,
        replaceUser: null,
    },
    removeUser: {
        user: null,
    },
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queueadmin')
        .setDescription('Admin commands to manage the queues')
        .addSubcommand(subCommand => subCommand //acp
            .setName('acp')
            .setDescription('Show the Admin Control Panel to Administrate the Queue')
        )
        .addSubcommand(subCommand => subCommand // cancel
            .setName('cancel')
            .setDescription('Cancel a game')
            .addIntegerOption(option => option
                .setName('gameid')
                .setDescription('The ID of the game')
                .setRequired(true)
            )
        )
        .addSubcommand(subCommand => subCommand // undo
            .setName('undo')
            .setDescription('Undo a reported game')
            .addIntegerOption(option => option
                .setName('gameid')
                .setDescription('The ID of the game')
                .setRequired(true)
            )
        )
        .addSubcommand(subCommand => subCommand // substitute
            .setName('substitute')
            .setDescription('Switch one user with another in an ongoing game')
            .addIntegerOption(option => option
                .setName('gameid')
                .setDescription('The ID of the game')
                .setRequired(true)
            )
            .addUserOption(option => option
                .setName('targetuser')
                .setDescription('The user that you want to swithc out')
                .setRequired(true)
            )
            .addUserOption(option => option
                .setName('replaceuser')
                .setDescription('The user that replaces the target user')
                .setRequired(true)
            )
        )
        .addSubcommand(subCommand => subCommand // removeuser
            .setName('removeuser')
            .setDescription('Remove a user from the queue')
            .addUserOption(option => option
                .setName('user')
                .setDescription('The user that you want to remove from the queue')
                .setRequired(true)
            )
        )
        .addSubcommand(subCommand => subCommand // clearplayerdata
            .setName('clearplayerdata')
            .setDescription('Clear the player database')
            .addUserOption(option => option
                .setName('userpass')
                .setDescription('The usre that is executing this command')
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName('creatorpass')
                .setDescription('The discord username of the user who created this bot')
                .setRequired(true)
            )
            .addStringOption(option => option
                .setName('secretpass')
                .setDescription('If you dont know the anwer to this option you should not use this command')
                .setRequired(true)
            )
        ),
    async execute(interaction, overwrite = false) {

        // const guildSettings = await GuildSettings.findOne({_id: interaction.guild.id});
        // if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR]) && !interaction.member._roles.includes(guildSettings.adminRole)) {
        //     await interaction.reply({
        //         ephemeral: true,
        //         content: 'You do not have permission to use this command.',
        //     }).catch(console.error);
        //     cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use this command`);
        //     return;
        // }

        if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to use this command.',
            }).catch(console.error);
            cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use this command`);
            return;
        }
        const guildId = interaction ? interaction.guild.id : generalData.botConfig.defaultGuildId;
        const queueSettingsData = await queueSettings.getQueueDatabaseById({_id: guildId});

        const subCommand = overwrite ? overwriteOptions.command : interaction.options.getSubcommand();
        const options = {
            cancel: {
                gameId: overwrite ? overwriteOptions.cancel.gameId : interaction.options.getInteger('gameid'),
            },
            undo: {
                gameId: overwrite ? overwriteOptions.undo.gameId : interaction.options.getInteger('gameid'),
            },
            substitute: {
                gameId: overwrite ? overwriteOptions.substitute.gameId : interaction.options.getInteger('gameid'),
                targetUser: overwrite ? overwriteOptions.substitute.targetUser : interaction.options.getUser('targetuser'),
                replaceUser: overwrite ? overwriteOptions.substitute.replaceUser : interaction.options.getUser('replaceuser'),
            },
            removeUser: {
                user: overwrite ? overwriteOptions.substitute.user : interaction.options.getUser('user'),
            },
        }
        thisLog(`Admin Command: [fg=green]${subCommand}[/>]`);

        switch (subCommand) {
            case 'acp': {
                await interaction.reply({
                    ephemeral: true,
                    content: 'This command is not configured yet...'
                })
            } break;
            case 'cancel': {
                const targetGame = getGameById(options.cancel.gameId);
                if (!targetGame) {
                    await interaction.reply({
                        ephemeral: true,
                        content: 'There is no active game with gameID: `' + options.cancel.gameId + '`.'
                    }).catch(console.error);
                    return;
                }
 
                const channelId = await queueSettings.getRankedLobbyByName(targetGame.lobby, interaction.guild.id);
                const message = new MessageEmbed({
                    title: 'Game ' + targetGame.gameId + ' has been cancelled',
                    fields: [
                        { name: 'Included players', value: '<@' + Object.keys(targetGame.players).join('> <@') + '>' }
                    ],
                    footer: {text: interaction.user.username, iconURL: interaction.user.displayAvatarURL()},
                    timestamp: new Date().getTime()
                });
                const index = queueData.info.globalQueueData.gamesInProgress.indexOf(targetGame);
                queueData.info.globalQueueData.gamesInProgress.splice(index, 1);

                clientSendMessage.sendMessageTo(channelId, {embeds: [message]})

                await interaction.reply({
                    ephemeral: true,
                    content: 'Succesfully cancelled the game `' + targetGame.gameId + '`',
                }).catch(console.error);

            } break;
            case 'undo': {
                const targetGame = getGameById(options.undo.gameId, true)
                if (!targetGame) {
                    await interaction.reply({
                        ephemeral: true,
                        content: 'There is no active game with gameID: `' + options.undo.gameId + '`.'
                    }).catch(console.error);
                    return;
                }
                
                for (let i = 0; i < targetGame.gameResults.length; i++) {
                    const results = targetGame.gameResults[i];
                    var player;
                    for (const p in targetGame.players) {
                        const data = targetGame.players[p]
                        if (data.userData.name == results[0]) player = data;
                    }
                    const mmr =  player.stats[targetGame.lobby].mmr;
                    player.stats[targetGame.lobby].mmr = results[1] > 0 ? 
                        mmr - Math.round(results[1]) : 
                        mmr + Math.round(results[1])
                    ;

                    playerData.updatePlayerData(player, queueSettingsData.mmrSettings);
                }

                const index = queueData.info.globalQueueData.gameHistory.indexOf(targetGame)
                const channelId = await queueSettings.getRankedLobbyByName(targetGame.lobby, guildId);
                const message = new MessageEmbed({
                    title: 'The report for ' + targetGame.gameId + ' has been undone',
                    description: 'You can report this game again now',
                    fields: [
                        { name: 'Included players', value: '<@' + Object.keys(targetGame.players).join('> <@') + '>' }
                    ],
                    footer: {text: interaction.user.username, iconURL: interaction.user.displayAvatarURL()},
                    timestamp: new Date().getTime()
                });

                targetGame.reportStatus = false;
                queueData.info.globalQueueData.gameHistory.splice(index, 1);
                queueData.info.globalQueueData.gamesInProgress.push(targetGame);

                clientSendMessage.sendMessageTo(channelId, {embeds: [message]})

                await interaction.reply({
                    ephemeral: true,
                    content: 'Succesfully Undone the report of the game `' + targetGame.gameId + '`'
                }).catch(console.error);
            } break;
            case 'substitute': {
                const targetGame = getGameById(options.substitute.gameId); 
                if (!targetGame) {
                    await interaction.reply({
                        ephemeral: true,
                        content: 'There is no active game with gameID: `' + options.substitute.gameId + '`.'
                    }).catch(console.error);
                    return;
                }
                
                const targetUser = options.substitute.targetUser;
                const replaceUser = options.substitute.replaceUser;
                if (targetUser == replaceUser) {
                    await interaction.reply({
                        ephemeral: true,
                        content: `Target user can not be the same as the Replacing user.\nReturn Status: \`${interaction.user.username} is a bit dumb\``
                    }).catch(console.error);
                    return;
                }
                const targetUserStatus = queueData.info.userReservedStatus(targetUser.id);
                const replaceUserStatus = queueData.info.userReservedStatus(replaceUser.id);
                

                if (targetUserStatus != 'inOngoingGame') {
                    await interaction.reply({
                        ephemeral: true,
                        content: `Target user is not in an ongoing game.\nReturn Status: \`${targetUserStatus}\``
                    }).catch(console.error);
                    return;
                }
                if (replaceUserStatus != false) {
                    await interaction.reply({
                        ephemeral: true,
                        content: `Replace user is reserved.\nReturn Status: \`${replaceUserStatus}\``
                    }).catch(console.error);
                    return;
                }
                const replacePlayerData = await playerData.getPlayerDataById(replaceUser.id);
                if (!replacePlayerData) {
                    await interaction.reply({
                        ephemeral: true,
                        content: `Replace user PlayerData does not exist.\nReturn Status: \`ERROR: replacePlayerData is undefined\``
                    }).catch(console.error);
                    return;
                }

                // const targetIndex = Object.keys(targetGame.players).indexOf(targetUser.id);
                targetGame.players[replaceUser.id] = replacePlayerData; // Add the replacer data to the players
                delete targetGame.players[targetUser.id]; // Remove the target user from the players

                for (const teamName in targetGame.teams) {
                    const team = targetGame.teams[teamName];
                    var targetTeam;
                    for (const player in team.members) {
                        if (player == targetUser.id) {
                            team.members[replaceUser.id] = replacePlayerData;
                            delete team.members[targetUser.id];
                            targetTeam = team;
                            break;
                        }
                    }
                    if (targetTeam) {
                        targetTeam.mmr = 0;
                        targetTeam.validate();
                        break;
                    }
                }

                const channelId = await queueSettings.getRankedLobbyByName(targetGame.lobby, guildId);
                const message = new MessageEmbed({
                    title: `Game ${targetGame.gameId} | Subtitute`,
                    description: `Player <@${targetUser.id}> has ben replaced by <@${replaceUser.id}>`,
                    fields: [
                        { name: 'Team Blue', value: '<@' + Object.keys(targetGame.teams.blue.members).join('> <@') + '>' },
                        { name: 'Team Orange', value: '<@' + Object.keys(targetGame.teams.orange.members).join('> <@') + '>' }
                    ],
                    footer: {text: interaction.user.username, iconURL: interaction.user.displayAvatarURL()},
                    timestamp: new Date().getTime()
                });

                clientSendMessage.sendMessageTo(channelId, {embeds: [message]});

                await interaction.reply({
                    ephemeral: true,
                    content: `Succesfully replaced <@${targetUser.id}> for <@${replaceUser.id}> in game \`${targetGame.gameId}\``
                }).catch(console.error);
            } break;
            case 'removeuser': {
                const targetUser = options.removeUser.user;
                const qData = queueData.info.globalQueueData;
                
                var targetLobby;
                var targetLobbyName;
                for (const l in qData.lobby) {
                    const lobby = qData.lobby[l];
                    for (const player in lobby.players) {
                        const user = lobby.players[player];
                        if (targetUser.id == user.id) {
                            delete lobby.players[player];
                            targetLobby = lobby;
                            targetLobbyName = l;
                            break;
                        }
                    }
                    if (targetLobby) break;
                }
                if (!targetLobby) {
                    await interaction.reply({
                        ephemeral: true,
                        content: `${targetUser} is not in any queue`
                    }).catch(console.error);
                    return;
                }

                const channelId = await queueSettings.getRankedLobbyByName(targetLobbyName, guildId);
                const message = new MessageEmbed({
                    title: `Player was forced to leave the queue`,
                    description: `Leaving user: <@${targetUser.id}>`,
                    fields: [
                        { 
                            name: 'Remaining Players', 
                            value: Object.keys(qData.lobby[targetLobbyName].players).length > 0 ?
                                '<@' + Object.keys(qData.lobby[targetLobbyName].players).join('> <@') + '>' :
                                'Queue is empty...'
                        },
                    ],
                    footer: {text: interaction.user.username, iconURL: interaction.user.displayAvatarURL()},
                    timestamp: new Date().getTime()
                });

                await clientSendMessage.sendMessageTo(channelId, {embeds: [message]});

                await interaction.reply({
                    ephemeral: true,
                    content: `Succesfully Removed <@${targetUser.id}> from the queue`
                }).catch(console.error);
            } break;
            case 'clearplayerdata': {
                console.log([
                    `${interaction.user.id}`,
                    `${interaction.user.username}#${interaction.user.discriminator}`,
                    `is atempting to clear the PlayerData`
                ].join('\n'))
                console.log(interaction);
                console.log('');

                const userPass = interaction.options.getUser('userpass');
                const creatorPass = interaction.options.getString('creatorpass');
                const secretPass = interaction.options.getString('secretpass');
                
                var response;
                if (userPass == interaction.user && creatorPass == 'CTN') {
                    response = await playerData.clearPlayerData(interaction, secretPass);
                }
                if (response) {
                    await interaction.reply({
                        ephemeral: true,
                        content: 'PlayerData has been cleared.'
                    }).catch(console.error);
                    return;
                }
                else {
                    await interaction.reply({
                        ephemeral: true,
                        content: [
                            `You did not enter the right information.`,
                            `If you dont know the information you should not be using this command.`,
                            `If you get it wrong to many times you might risk to be banned from the server.`
                        ].join('\n')
                    }).catch(console.error);
                }
            } break;
            default: break;
        }
    },
};

function getGameById(id, inHistory = false) {
    const list = inHistory ? queueData.info.globalQueueData.gameHistory : queueData.info.globalQueueData.gamesInProgress;
    for (let i = 0; i < list.length; i++) {
        const game = list[i];
        if (id == game.gameId) {
            return game;
        }
    }
    return null;
}

function thisLog(log, endLineBreak = true) {
    if (!generalData.logOptions.queueAdmin) return;
    if (generalUtilities.info.isObject(log)) {
        cConsole.log('-------- QueueAdmin --------');
        console.log(log);
    }
    else {
        cConsole.log('-------- QueueAdmin --------\n' + log);
    }
    if (endLineBreak) console.log('');
}