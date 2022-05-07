const { cConsole, clientSendMessage } = require('../utils/utilityManager.js');

module.exports = {
	name: 'queueEvent',
	execute(interaction, action) {
        switch (action) {
            case 'add': {
                cConsole.log(
                    `[fg=green]Queue Event[/>]: User [style=bold][fg=cyan]${interaction.user.tag}[/>] has been [fg=green]added[/>] to the queue`, 
                    {autoColorize: false}
                );
            }
            break;
            case 'removed': {
                cConsole.log(
                    `[fg=green]Queue Event[/>]: User [style=bold][fg=cyan]${interaction.user.tag}[/>] has been [fg=red]removed[/>] from the queue`, 
                    {autoColorize: false}
                );
            }
            break;
            default:
                break;
        }
	},
};