// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function setBotOnline() {
    try {
        client.once(Events.ClientReady, readyClient => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
            client.user.setPresence({
                activities: [{ name: `Реестр блокировок`, type: ActivityType.Watching }],
                status: 'idle',
            });
        });

        // Log in to Discord with your client's token
        await client.login(token);
    } catch (err) {
        console.error('Critical error:', err.message);
    }
}
setBotOnline();