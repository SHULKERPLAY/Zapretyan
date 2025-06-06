const fs = require('fs');
const path = require('path');

//Set Timeout to stop script
setTimeout(online, 10000)
function online() {
throw new Error("ScriptTimeout");
}

// Require the necessary discord.js classes
const { ActivityType, Client, Events, GatewayIntentBits, Channels, Channel, Send } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
 const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
 client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token).then((token) => {
 // client.user is now defined
client.user.setPresence({
  activities: [{ name: `обходе блокировок`, type: ActivityType.Competing }],
  status: 'idle',
});
fs.readFile(path.join(__dirname,'send.txt'), 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
}
fs.readFile(path.join(__dirname,'var/cid'), 'utf8', (err, cid) => {
  if (err) {
    console.error(err);
    return;
}
  client.channels.fetch(cid).then(channel => {
  channel.send(data);
});
});
});
});
