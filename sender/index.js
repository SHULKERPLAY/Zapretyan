//Set Timeout to stop script
setTimeout(online, 86400000)
function online() {
throw new Error("ScriptTimeout");
}

// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, ActivityType, setPrestnce } = require('discord.js');
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
});
