const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { getCommandPermissions } = require('../../utils/userPermissions');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('msg-collect')
        .setDescription('Collects messages from the user'),
    
    /** 
     * @param {CommandInteraction} interaction
    */
    async execute(interaction) {
        const permission = await getCommandPermissions(
            interaction,
            {
                creator: true,
                owner: false,
                admin: false,
                superAdmin: false,
                adminPermission: false
            },
            interaction.guild.id
        );
        if (!permission && !overwrite) { return; }
        // `m` is a message object that will be passed through the filter function
        const filter = (m) => {
            console.log(m);
            if (m.type == 'MESSAGE_COMPONENT') {
                return true;
            }
            else if (m.type == 'DEFAULT' && m.content.includes('discord')) {
                return true;
            }
        };
        const collector = interaction.channel.createMessageCollector({ filter, time: 15000 });
        const btnCollector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        const initialMessgae = await interaction.reply({
            ephemeral: false,
            content: 'Collecting messages...',
            embeds: [new MessageEmbed({
                title: 'Test',
                description: 'Test',
                color: 'RANDOM',
            })],
            components: [new MessageActionRow().addComponents([
                new MessageButton({
                    customId: 'test',
                    label: 'Test',
                    style: 'PRIMARY',
                    disabled: false,
                })
            ])],
            fetchReply: true,
        }).catch(console.error);

        // console.log(initialMessgae)

        btnCollector.on('collect', async (m) => {
            console.log(m);
            if (m.type == 'MESSAGE_COMPONENT') {
                await initialMessgae.edit({content: 'Button pressed'});
                console.log('Button pressed');
            }
            else if (m.type == 'DEFAULT') {
                m.content.includes('discord')
                await m.reply(`Collected: ${m.type} | ${m.content}`)
                console.log(`Collected ${m.content}`);
            }
        });

        // collector.on('end', collected => {
        //     console.log(`Collected ${collected.size} items`);
        // });
    },
};