const { Permissions, CommandInteraction, User } = require('discord.js');

const { creatorId } = require('../config/private.json');
const guildConfigStorage = require('../data/database/guildConfigStorage');

const generalData = require('../data/generalData');
const cConsole = require('./customConsoleLog');

class UserPermissions {
	/**
	 * @var owner 
	 *  user is server owner						[default true]
	 *  
	 * @var admin 
	 *  Allow admins (defined in the guild config)	[default true]
	 *  
	 * @var superAdmin 
	 *  Allow super admins							[default false]
	 *  
	 * @var adminPermission 
	 *  Allow users with admin permissions			[default true]
	 *  
	 * 
	*/
	constructor() {
		this.creator = false
		this.owner = false;
		this.admin = false;
		this.superAdmin = false;
		this.adminPermission = false;
	}
}

/** 
 * @param {CommandInteraction} interaction 
 *  the interaction to check
 * @param {UserPermissions} commandPermissions 
 *  the permissions to check (default: new CommandPermissions({creator: false, owner: true, admin: true, superAdmin: false, adminPermission: true}))
 * 	@description 
 *  	If true: the function will check if the user matches the permission               
 *  	If false: the function wont care if the user matches the permission
 * @returns {Boolean} true If the user matches any required permissions
*/
async function getCommandPermissions(interaction, commandPermissions = new UserPermissions({creator: true, owner: true, admin: true, superAdmin: false, adminPermission: true}), guildId) {
	if (interaction == null && guildId == null) {
		cConsole.log(`\n[fg=red]getCommandPermissions: Interaction and guildId are null[/>]`);
		return false;
	}
	else if (!guildId) { guildId = interaction.guild.id; }
	const perms = await getUserPermissions(interaction, interaction.user, guildId);
	for (const key in perms) {
		if (generalData.logOptions.userPermissions) {
			cConsole.log(`key: ${key} | required: ${commandPermissions[key]} | user: ${perms[key]}`);
		}
		if (!commandPermissions[key]) continue;
		if (perms[key]) { // If the command requires the permission and the user has it
			if (generalData.logOptions.userPermissions) {
				cConsole.log('[fg=green]User has permission[/>]: ' + key);
				cConsole.log(perms);
			}
			return true; // The user has the required permissions
		}
	}

	await interaction.reply({
		ephemeral: true,
		content: 'You do not have permission to use this command.',
	}).catch(console.error);
	cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use the /[fg=cyan]${interaction.commandName}[/>] command`);
	cConsole.log(perms);
	return false;
}

/** 
 * @param {CommandInteraction} interaction
 * @param {User} user the user to get the permissions of
 * @param {String} guildId the guild id
 * @returns {UserPermissions} the permissions of the user
*/
async function getUserPermissions(interaction, user, guildId) {
	if ((!interaction && !user) || (!interaction && !guildId)) {
		cConsole.log(`\n[fg=red]getUserPermissions: (Interaction and user) or (interaction and guildId) are null[/>]`);
		cConsole.log(`interaction: ${interaction} | user: ${user} | guildId: ${guildId}\n`);
		return null;
	}
	const perms = new UserPermissions();

	if (!guildId) { guildId = interaction.guild.id; }
	if (!user) { user = interaction.user; }

	const guild = (interaction) ? interaction.guild : await generalData.client.guilds.cache.get(guildId).catch(console.error);
	const memberData = (interaction) ? interaction.member : await guild.members.cache.get(user.id).catch(console.error);
	const guildConfig = await guildConfigStorage.findOne({_id: guildId}).catch(console.error);
	
	if (user.id == creatorId) { perms.creator = true; }
	if (user.id == guild.ownerId) { perms.owner = true; }
	if (memberData.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) { perms.adminPermission = true; }

	// #region Super Admin
		let isSuperAdmin = false;
		if (guildConfig) {
			for (const superAdmin in guildConfig.superAdmins) {
				const userId = guildConfig.superAdmins[superAdmin].id;
				if (!userId) continue;
				if (interaction.user.id == userId) { isSuperAdmin = true; break;}
			}
		}
		if (isSuperAdmin) { perms.superAdmin = true; }
	// #endregion

	// #region Admin Role
		let hasAdminRole = false;
		if (guildConfig) {
			for (const adminRole in guildConfig.adminRoles) {
				const roleId = guildConfig.adminRoles[adminRole].id;
				if (memberData._roles.includes(roleId)) { hasAdminRole = true; break;}
			}
		}
		if (hasAdminRole) { perms.admin = true; }
	// #endregion

	return perms;
}

module.exports = {
	UserPermissions,
	getCommandPermissions,
	getUserPermissions,
};