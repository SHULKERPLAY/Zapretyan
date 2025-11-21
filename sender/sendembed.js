const fs = require('fs');
const path = require('path');

// Require the necessary discord.js classes
const { EmbedBuilder, ActivityType, Client, Events, GatewayIntentBits, Channels, Channel, Send } = require('discord.js');
const { token } = require('./config.json');

//read content from file
fs.readFile(path.join(__dirname,'send.txt'), 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
//read embed title from file
fs.readFile(path.join(__dirname,'/var/name'), 'utf8', (err, fieldname) => {
    if (err) {
        console.error(err);
        return;
    }
//read destination chat id from file
fs.readFile(path.join(__dirname,'/var/cid'), 'utf8', (err, cid) => {
    if (err) {
        console.error(err);
        return;
    }
//read embed color from file
fs.readFile(path.join(__dirname,'/var/clr'), 'utf8', (err, clr) => {
    if (err) {
        console.error(err);
        return;
    }
const color = clr.slice(0, 6); //v1.2.1 fix cuz color variable get non-existing newline from file

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, readyClient => {
    console.log(`Send embed as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token).then((token) => {
// client.user is now defined
    const banEmbed = new EmbedBuilder()
        .setColor(color)
        .setTitle(fieldname)
        .setDescription(data)
        .setAuthor({ name: 'Запретян <3', iconURL: 'https://lunarcreators.ru/wp-content/uploads/2025/11/discordiconmini.webp', url: 'https://discord.com/discovery/applications/907372459144147035' })
        .setTimestamp()
        .setFooter({ text: 'С любовью, @shulkerplay' });
    async function sendData() {
        await client.channels.fetch(cid).then(channel => {
            channel.send( {embeds: [banEmbed]} );
        });
        client.destroy();
    }
    sendData()
});
});
});
});
});