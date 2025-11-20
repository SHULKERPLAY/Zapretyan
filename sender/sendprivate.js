const fs = require('fs');
const path = require('path');

//read content from file
fs.readFile(path.join(__dirname,'sendprivate.txt'), 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
//read destination user id from file
fs.readFile(path.join(__dirname,'var/cid'), 'utf8', (err, cid) => {
    if (err) {
        console.error(err);
        return;
    }
// Require the necessary discord.js classes
const { ActivityType, Client, Events, GatewayIntentBits, Channels, Channel, Send } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});
// Log in to Discord with your client's token
client.login(token).then((token) => {
    // client.user is now defined
    async function sendData() {
        await client.users.fetch(cid).then(user => {
            user.send(data);
        });
        client.destroy();
    }
    sendData()
});
});
});