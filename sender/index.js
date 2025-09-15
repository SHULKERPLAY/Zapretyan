// Require the necessary discord.js classes
const { Client, Routes, Events, GatewayIntentBits, ActivityType, setPrestnce } = require('discord.js');
const { createInterface } = require('node:readline');
const { execSync } = require('child_process');
const fetch = require('node-fetch');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Debug with
// bot.on('error', (e) => console.error(e));
// bot.on('warning', (e) => console.warn(e));
// bot.on('debug', (e) => console.info(e));

// When the client is ready, run client.once.
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

const ping = {
  name: 'ping',
  description: 'Пингует бота и показывает задержку'
};

// Command Example

const ping0 = {
 name:'ping0',
 description:'Не трожь эту команду.'
}

const commands = [ping, ping0]; // Add your commands with commas to add them to the bot!

const rl = createInterface({ input: process.stdin, output: process.stdout });

client.on('interactionCreate', (interaction) => {
  if (interaction.commandName === 'ping') {
    interaction.reply(`Задержка ${Date.now() - interaction.createdTimestamp} миллисекунд! Задержка API ${Math.round(client.ws.ping)} миллисекунд.`);
  } else if(interaction.commandName === 'ping0') { // This is the example command's name!
    interaction.reply('Не дёргай по фигне');
  } else { // a response if you forget to add the command here
    interaction.reply('Для этой команды ещё нет ответа!');
  }
});
(async ()=>{
const question = (q) => new Promise((resolve) => rl.question(q, resolve));

// Log in to Discord with your client's token
  await client.login(token).catch((err) => {
    throw err
  });
// client.user is now defined
  await client.rest.put(Routes.applicationCommands(client.user.id), { body: commands });

  client.user.setPresence({
  activities: [{ name: `обходе блокировок`, type: ActivityType.Competing }],
  status: 'idle',
});
})();