const { SlashCommandBuilder } = require('@discordjs/builders');

const BotDatabase = require('../data/database/botConfigStorage');
const generalData = require('../data/generalData');
const cConsole = require('../utils/customConsoleLog')
const { getCommandPermissions } = require('../utils/userPermissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botconfig')
        .setDescription('Configure the settings of this bot')
        .addSubcommand(subcommand => subcommand
            .setName('set-guild-id')
            .setDescription('Set the Default Guild Id to this Guild ID')
        ),
    async execute(interaction) {
        const permission = await getCommandPermissions(
            interaction, 
            {
                creator: true,
                owner: false,
                admin: false,
                superAdmin: false,
                adminPermission: false
            }
        );
        if (!permission) { return; }
        
        switch (interaction.options.getSubcommand()) {
            case 'set-guild-id': {
                const botConfig = await BotDatabase.findOne({});
                if (!botConfig) {
                    const newBotConfig = new BotDatabase({
                        _id: interaction.guild.id
                    });
                    await BotDatabase.insertMany(newBotConfig);
                }
                else {
                    await BotDatabase.updateOne({_id: botConfig._id}, {_id: interaction.guild.id, __v: botConfig.__v + 1});
                }
                
                const updatedConfig = await BotDatabase.findOne({});
                cConsole.log(`Updating the default guild id to: [fg=green]${updatedConfig._id}[/>]`);
                generalData.botConfig.defaultGuildId = updatedConfig._id;
                
                const configClone = JSON.parse(JSON.stringify(updatedConfig));
                delete configClone.bypassUsers;
                await interaction.reply({
                    ephemeral: true,
                    content: 
                        'Bot Config has been updated!\n```js\n' + 
                        cConsole.decolorize(cConsole.unfoldNestedObject(configClone, 2, ' ')) + 
                        '\n```'
                }).catch(console.error);
            } break;
            default: break;
        }
    },
};