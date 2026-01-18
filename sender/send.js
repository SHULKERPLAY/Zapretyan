const fs = require('node:fs/promises');
const path = require('node:path');
// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

async function send() {
    try {
        const [data, cid ] = await Promise.all([
            //read content from file
            fs.readFile(path.join(__dirname, 'send.txt'), 'utf8'),
            //read destination chat id from file
            fs.readFile(path.join(__dirname, '/var/cid'), 'utf8'),
        ]);
        
        //Client setup
        const client = new Client({ intents: [GatewayIntentBits.Guilds] });

        client.once(Events.ClientReady, async (readyClient) => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
            try {
                //Sending message
                const channel = await client.channels.fetch(cid.trim());
                //Check message length and truncate if necessary
                const messageContent = data.length > 2000 ? data.substring(0, 1997) + "..." : data;
                channel.send(messageContent);
                console.log('Message sent!');
            } catch (sendError) {
                console.error('Failed to sent message:', sendError.message);
            } finally {
                //End session
                client.destroy();
            }
        });
        //Authorization
        await client.login(token);
    } catch (err) {
        console.error('Critical error:', err.message);
    }
}
send();