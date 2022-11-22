const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');

const guildConfigStorage = require('../data/database/guildConfigStorage');
const cConsole = require('../utils/customConsoleLog');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverconfig')
        .setDescription('Configure the settings of this server')
        .addSubcommand(subcommand => subcommand
            .setName('add-admin-role')
            .setDescription('Add a role that will be able to use the admin commands')
            .addRoleOption(option => option
                .setName('admin-role')
                .setDescription('The role to add')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('remove-admin-role')
            .setDescription('Remove a role that is be able to use the admin commands')
            .addRoleOption(option => option
                .setName('admin-role')
                .setDescription('The role to remove')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('add-super-admin')
            .setDescription('Add a user that will be able to use the super admin commands')
            .addUserOption(option => option
                .setName('super-user')
                .setDescription('The user to add')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand => subcommand
            .setName('remove-super-admin')
            .setDescription('Remove a user that is be able to use the super admin commands')
            .addUserOption(option => option
                .setName('super-user')
                .setDescription('The user to remove')
                .setRequired(true)
            )
        ),
    async execute(interaction) {
        if (interaction != null && !interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to use this command.',
            }).catch(console.error);
            cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use this command`);
            return;
        }
        
        const getGuildConfig = async (guildId) => {return await guildConfigStorage.findOne({_id: guildId}).catch(console.error)};
        if (await getGuildConfig(interaction.guild.id) == null) {
            await guildConfigStorage.insertMany({_id: interaction.guild.id});
        }
        const guildConfig = await getGuildConfig(interaction.guild.id);

        switch(interaction.options.getSubcommand()) {
            case 'add-admin-role': { 
                const inputRole = interaction.options.getRole('admin-role');
                guildConfig.adminRoles[inputRole] = inputRole.toJSON();
                if (Object.keys(guildConfig.adminRoles).includes('placeholder')) {
                    delete guildConfig.adminRoles['placeholder']
                }
                
                await guildConfigStorage.updateOne({_id: interaction.guild.id}, guildConfig);
                await interaction.reply({
                    ephemeral: true,
                    content: 'Admin role has been __added__: <@&' + inputRole + '> ```' + inputRole.id + ' | ' + inputRole.name + '```'
                }).catch(console.error);
            } break;
            case 'remove-admin-role': { 
                const inputRole = interaction.options.getRole('admin-role');
                if (Object.keys(guildConfig.adminRoles).length == 1) {
                    guildConfig.adminRoles = {placeholder: 'placeholder'};
                }
                else {
                    delete guildConfig.adminRoles[inputRole];
                }

                await guildConfigStorage.updateOne({_id: interaction.guild.id}, guildConfig);
                await interaction.reply({
                    ephemeral: true,
                    content: 'Admin role has been __removed__: <@&' + inputRole + '> ```' + inputRole.id + ' | ' + inputRole.name + '```'
                }).catch(console.error);
            } break;
            case 'add-super-admin': { 
                const inputUser = interaction.options.getUser('super-user');
                guildConfig.superAdmins[inputUser] = inputUser.toJSON();
                if (Object.keys(guildConfig.superAdmins).includes('placeholder')) {
                    delete guildConfig.superAdmins['placeholder']
                }
                
                await guildConfigStorage.updateOne({_id: interaction.guild.id}, guildConfig);
                await interaction.reply({
                    ephemeral: true,
                    content: 'Super Admin has been __added__: <@&' + inputUser + '> ```' + inputUser.id + ' | ' + inputUser.username + '```'
                }).catch(console.error);
            } break;
            case 'remove-super-admin': { 
                const inputUser = interaction.options.getUser('super-user');
                if (Object.keys(guildConfig.superAdmins).length == 1) {
                    guildConfig.superAdmins = {placeholder: 'placeholder'};
                }
                else {
                    delete guildConfig.superAdmins[inputUser];
                }

                await guildConfigStorage.updateOne({_id: interaction.guild.id}, guildConfig);
                await interaction.reply({
                    ephemeral: true,
                    content: 'Super Admin has been __removed__: <@&' + inputUser + '> ```' + inputUser.id + ' | ' + inputUser.username + '```'
                }).catch(console.error);
            } break;
            default: break;
        }
    },
};