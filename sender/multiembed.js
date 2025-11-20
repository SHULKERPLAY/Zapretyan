const fs = require("fs").promises;
const fsd = require("fs");
const path = require('path');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Require the necessary discord.js classes
const { EmbedBuilder, ActivityType, Client, Events, GatewayIntentBits, Channels, Channel, Send } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
 const client = new Client({ intents: [GatewayIntentBits.Guilds] });
 client.once(Events.ClientReady, readyClient => {
    console.log(`Send embed as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token).then((token) => {
// client.user is now defined

//read content from file
fsd.readFile(path.join(__dirname,'send.txt'), 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
}
//read embed title from file
fsd.readFile(path.join(__dirname,'/var/name'), 'utf8', (err, fieldname) => {
  if (err) {
    console.error(err);
    return;
}
//read destination chat id from file
fsd.readFile(path.join(__dirname,'/var/cid'), 'utf8', (err, cid) => {
  if (err) {
    console.error(err);
    return;
}
//read embed color from file
fsd.readFile(path.join(__dirname,'/var/clr'), 'utf8', (err, clr) => {
  if (err) {
    console.error(err);
    return;
}

const color = clr.slice(0, 6); //v1.2.1 fix cuz color variable get non-existing newline from file

//send splitted content
async function sendDataWithDelay() {
  try {
    const files = await fs.readdir(path.join(__dirname, 'send'));
    for (const file of files) {
      const filePath = path.join(__dirname, 'send', file);
      const data = await fs.readFile(filePath, 'utf8');
        const banEmbed = new EmbedBuilder()
            .setColor(color)
            .setTitle(fieldname)
            .setDescription(data)
            .setAuthor({ name: 'Запретян <3', iconURL: 'https://cdn.discordapp.com/avatars/907372459144147035/2771cf414eececfd9818a4dce423f7fc?size=256', url: 'https://discord.com/discovery/applications/907372459144147035' })
            .setTimestamp()
            .setFooter({ text: 'С любовью, @shulkerplay' });
      client.channels.fetch(cid).then(channel => {
      channel.send( {embeds: [banEmbed]} );
    });
        await delay(1000);
    }
    client.destroy();
    } catch (err) {
        console.error('Ошибка в цикле:', err);
  }
}
sendDataWithDelay()
});
});
});
});
});