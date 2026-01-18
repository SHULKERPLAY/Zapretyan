const fs = require('node:fs/promises');
const path = require('node:path');
// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

async function send() {
    try {
        //read content from files
        const [data, cid] = await Promise.all([
            //data to send
            fs.readFile(path.join(__dirname, 'sendprivate.txt'), 'utf8'),
            //cid of recipient
            fs.readFile(path.join(__dirname, 'var/cid'), 'utf8')
        ]);

        //Client setup
        const client = new Client({ intents: [GatewayIntentBits.Guilds] });

        client.once(Events.ClientReady, async (readyClient) => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
            try {
                //Sending message
                const user = await client.users.fetch(cid.trim());
                //Check message length and truncate if necessary
                const messageContent = data.length > 2000 ? data.substring(0, 1997) + "..." : data;
                await user.send(messageContent);
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