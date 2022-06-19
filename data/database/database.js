const mongoose = require('mongoose');
const { mongooseURL } = require('../../config/private.json');
const { cConsole } = require('../../utils/utilityManager.js');


class Database {
    constructor() {
        this.connection = null;
    }

    connect() {
        cConsole.log('Connecting to [style=bold][fg=blue]Database[/>]...')

        mongoose.connect(mongooseURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).then(() => {
            cConsole.log('[style=bold][fg=green]Connected[/>] to the [style=bold][fg=blue]Database[/>]!');
            this.connection == mongoose.connection;
        }).catch(error => {
            cConsole.log('[style=bold][fg=cyan]Database[/>] connection ERROR:\n' + error);
        });
    }
}

module.exports = Database;