const fs = require('node:fs/promises');
const path = require('node:path');
// Require the necessary discord.js classes
const { EmbedBuilder, Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

async function sendembed() {
    try {
        const [data, fieldname, cid, clr ] = await Promise.all([
            //read content from file
            fs.readFile(path.join(__dirname, 'send.txt'), 'utf8'),
            //read embed title from file
            fs.readFile(path.join(__dirname, '/var/name'), 'utf8'),
            //read destination chat id from file
            fs.readFile(path.join(__dirname, '/var/cid'), 'utf8'),
            //read embed color from file
            fs.readFile(path.join(__dirname, '/var/clr'), 'utf8'),
        ]);
        
        const banEmbed = new EmbedBuilder()
            .setColor(clr.trim())
            .setTitle(fieldname)
            .setDescription(data)
            .setAuthor({ name: 'Запретян <3', iconURL: 'https://lunarcreators.ru/wp-content/uploads/2025/11/discordiconmini.webp', url: 'https://discord.com/discovery/applications/907372459144147035' })
            .setTimestamp()
            .setFooter({ text: 'С любовью, @shulkerplay' });
        
        //Client setup
        const client = new Client({ intents: [GatewayIntentBits.Guilds] });

        client.once(Events.ClientReady, async (readyClient) => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
            try {
                //Sending message
                const channel = await client.channels.fetch(cid.trim());
                channel.send( {embeds: [banEmbed]} );
            } catch (sendError) {
                console.error('Failed to sent embed:', sendError.message);
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
sendembed();