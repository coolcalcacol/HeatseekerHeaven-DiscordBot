const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, User, MessageEmbed, Permissions } = require('discord.js');

const generalUtilities = require('../../utils/generalUtilities');
const { getCommandPermissions } = require('../../utils/userPermissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user-info')
        .setDescription('Displays the user info of a user')
        .addUserOption(option => option
            .setName('user')
            .setDescription('The user to show the info of')
            .setRequired(true)
        ),
    /** 
     * @param {CommandInteraction} interaction
    */
    async execute(interaction) {
        // if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
        //     await interaction.reply({
        //         ephemeral: true,
        //         content: 'You do not have permission to use this command.',
        //     }).catch(console.error);
        //     cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use this command`);
        //     return;
        // }
        const permission = await getCommandPermissions(
            interaction, 
            {
                creator: true,
                owner: true,
                admin: true,
                superAdmin: true,
                adminPermission: true
            }
        );
        if (!permission) { return; }

        const user = await generalUtilities.info.getUserById(interaction.options.getUser('user').id).then(async (userData) => { return await userData.fetch(true)});
        const member = await generalUtilities.info.getMemberById(user.id);
        console.log(user);
        console.log(member);
        
        const userCreatedAtDate = new Date(user.createdAt);
        const memberCreatedAtDate = new Date(member.joinedAt);
        const createdAt = [
            `${this.getNumberToFixed(userCreatedAtDate.getHours())}:`,
            `${this.getNumberToFixed(userCreatedAtDate.getMinutes())}:`,
            `${this.getNumberToFixed(userCreatedAtDate.getSeconds())} `,
            `${this.getNumberToFixed(userCreatedAtDate.getDate())}-`,
            `${this.getNumberToFixed(userCreatedAtDate.getMonth())}-`,
            `${userCreatedAtDate.getFullYear()}`
        ].join('');
        const joinedAt = [
            `${this.getNumberToFixed(memberCreatedAtDate.getHours())}:`,
            `${this.getNumberToFixed(memberCreatedAtDate.getMinutes())}:`,
            `${this.getNumberToFixed(memberCreatedAtDate.getSeconds())} `,
            `${this.getNumberToFixed(memberCreatedAtDate.getDate())}-`,
            `${this.getNumberToFixed(memberCreatedAtDate.getMonth())}-`,
            `${memberCreatedAtDate.getFullYear()}`
        ].join('');
        const embed = new MessageEmbed({
            author: {name: 'User info - ' + user.username, iconURL: user.avatarURL()},
            description: [
                `**Created At**: \`${createdAt}\` | <t:${generalUtilities.generate.getTimestamp(user.createdAt)}:R>`,
                `**Joined At**: \u2008\u2008 \`${joinedAt}\` | <t:${generalUtilities.generate.getTimestamp(member.joinedAt)}:R>`,
            ].join('\n'),
            color: (user.hexAccentColor) ? user.hexAccentColor : member.displayHexColor,
            footer: {text: interaction.user.username, iconURL: interaction.user.avatarURL()},
            timestamp: new Date().getTime()
        });

        await interaction.reply({
            ephemeral: false,
            embeds: [embed]
        }).catch(console.error);
    },
    getNumberToFixed(num) {
        return (num.toString().length == 1) ? '0' + num : num;
    }
};