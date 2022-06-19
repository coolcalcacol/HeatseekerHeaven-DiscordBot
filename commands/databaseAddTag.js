const { SlashCommandBuilder } = require('@discordjs/builders');
const { cConsole } = require('../utils/utilityManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xaddtag')
        .setDescription('Add a new tag to the database')
        .addStringOption(option => 
            option.setName('name')
            .setDescription('some name')
            .setRequired(true)
        )
        .addStringOption(option => 
            option.setName('description')
            .setDescription('some description')
            .setRequired(true)
        ),
    async execute(interaction) {
        // -- Options
        const tagName = interaction.options.getString('name');
		const tagDescription = interaction.options.getString('description');
		
        try {
			// equivalent to: INSERT INTO tags (name, description, username) values (?, ?, ?);
			const tag = await index.Tags.create({
				name: tagName,
				description: tagDescription,
				username: interaction.user.username,
			});

			return interaction.reply(`Tag ${tag.name} added.`);
		}
		catch (error) {
			if (error.name === 'SequelizeUniqueConstraintError') {
				return interaction.reply('That tag already exists.');
			}
            
            console.log(error)
			return interaction.reply('Something went wrong with adding a tag.\n' + '```' + error + '```');
		}
    },
};