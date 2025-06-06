const fs = require('fs');
const path = require('path');

//Set Timeout to stop script
setTimeout(online, 10000)
function online() {
throw new Error("ScriptTimeout");
}

// Require the necessary discord.js classes
const { EmbedBuilder, ActivityType, Client, Events, GatewayIntentBits, Channels, Channel, Send } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
 const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
 client.once(Events.ClientReady, readyClient => {
	console.log(`Send embed as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token).then((token) => {
 // client.user is now defined

fs.readFile(path.join(__dirname,'send.txt'), 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
}
fs.readFile(path.join(__dirname,'/var/name'), 'utf8', (err, fieldname) => {
  if (err) {
    console.error(err);
    return;
}
fs.readFile(path.join(__dirname,'/var/cid'), 'utf8', (err, cid) => {
  if (err) {
    console.error(err);
    return;
}

const banEmbed = new EmbedBuilder()
	.setColor(0x724fff)
	.setTitle(fieldname)
	.setDescription(data)
	.setAuthor({ name: 'Запретян <3', iconURL: 'https://cdn.discordapp.com/avatars/907372459144147035/2771cf414eececfd9818a4dce423f7fc?size=256', url: 'https://github.com/SHULKERPLAY' })
//	.addFields(
//		{ name: (fieldname), value: (data) },
//	)
	.setTimestamp()
	.setFooter({ text: 'С любовью, @shulkerplay' });

  client.channels.fetch(cid).then(channel => {
  channel.send( {embeds: [banEmbed]} );
});
});
});
});
});

