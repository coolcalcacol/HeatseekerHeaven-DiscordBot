const mongoose = require('mongoose');
const generalData = require('../generalData');

const { mongooseClusterURI, mogooseUsername, mogoosePassword, mongooseLocalURI } = require('../../config/private.json');

const cConsole = require('../../utils/customConsoleLog');

const mongoUser = encodeURIComponent(mogooseUsername);
const mongoPass = encodeURIComponent(mogoosePassword);
const dbURI = generalData.releasedVersion ? 
    mongooseClusterURI.replace('<username>', mongoUser).replace('<password>', mongoPass) : 
    mongooseLocalURI
;

class Database {
    constructor() {
        this.connection = null;
    }

    connect() {
        cConsole.log('Connecting to [style=bold][fg=blue]Database[/>]...')

        mongoose.connect(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoIndex: false
        }).then(() => {
            cConsole.log('[style=bold][fg=green]Connected[/>] to the [style=bold][fg=blue]Database[/>]!');
            this.connection == mongoose.connection;
        }).catch(error => {
            cConsole.log('[style=bold][fg=cyan]Database[/>] connection ERROR:\n');
            console.log(error)
        });
    }
}

module.exports = Database;

// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://CTN:<password>@ctncluster.vzw8pdc.mongodb.net/?retryWrites=true&w=majority";
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });