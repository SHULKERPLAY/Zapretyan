const fs = require('node:fs/promises');
const path = require('node:path');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
// Require the necessary discord.js classes
const { EmbedBuilder, Client, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

async function multiembed() {
    try {
        const [ fieldname, cid, clr ] = await Promise.all([
            //read embed title from file
            fs.readFile(path.join(__dirname, '/var/name'), 'utf8'),
            //read destination chat id from file
            fs.readFile(path.join(__dirname, '/var/cid'), 'utf8'),
            //read embed color from file
            fs.readFile(path.join(__dirname, '/var/clr'), 'utf8'),
        ]);

        //Client setup
        const client = new Client({ intents: [GatewayIntentBits.Guilds] });

        client.once(Events.ClientReady, async (readyClient) => {
            console.log(`Ready! Logged in as ${readyClient.user.tag}`);
            //cycle for all embeds in /send
            try {
                const files = await fs.readdir(path.join(__dirname, 'send'));
                for (const file of files) {
                    const filePath = path.join(__dirname, 'send', file);
                    const data = await fs.readFile(filePath, 'utf8');
                    const banEmbed = new EmbedBuilder()
                        .setColor(clr.trim())
                        .setTitle(fieldname)
                        .setDescription(data)
                        .setAuthor({ name: 'Запретян <3', iconURL: 'https://lunarcreators.ru/wp-content/uploads/2025/11/discordiconmini.webp', url: 'https://discord.com/discovery/applications/907372459144147035' })
                        .setTimestamp()
                        .setFooter({ text: 'С любовью, @shulkerplay' });
                    const channel = await client.channels.fetch(cid.trim());
                    channel.send( {embeds: [banEmbed]} );
                    await delay(1000);
                }
                //
            } catch (cycleerr) {
                console.error('Cycle error:', cycleerr.message);
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
multiembed();