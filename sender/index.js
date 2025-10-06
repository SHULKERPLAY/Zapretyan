// Require the necessary discord.js classes
const { Client, Routes, Events, GatewayIntentBits, ActivityType, setPrestnce, SlashCommandBuilder } = require('discord.js');
const { createInterface } = require('node:readline');
const { exec } = require("child_process");
const fetch = require('node-fetch');
const { token } = require('./config.json');
const fs = require('fs');
const path = require('path');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

const ping = {
  name: 'ping',
  description: 'Пингует бота и показывает задержку'
};

const bancheck = new SlashCommandBuilder()
    .setName('bancheck')
    .setDescription('Проверка наличия домена в реестре Роскомнадзора')
    .addStringOption(option =>
        option.setName('type')
            .setDescription('Блокировку чего нужно проверить? Домена/Сайта или IP адреса?')
            .setRequired(true)
            .addChoices(
                { name: 'Домен (Например: instagram.com)', value: 'domain' },
                { name: 'IP Адрес (Например: 159.22.102.2)', value: 'ip' },
            ))
    .addStringOption(option =>
        option.setName('string')
            .setDescription('Имя домена без https:// или корректный ip адрес (Например: 1.1.1.1)')
            .setMinLength(5)
            .setMaxLength(255)
            .setRequired(true));

const commands = [ping, bancheck]; // Add your commands with commas to add them to the bot!

const rl = createInterface({ input: process.stdin, output: process.stdout });

client.on('interactionCreate', (interaction) => {
  if (interaction.commandName === 'ping') {
    interaction.reply(`Задержка ${Date.now() - interaction.createdTimestamp} миллисекунд! Задержка API ${Math.round(client.ws.ping)} миллисекунд.`);
  } else if(interaction.commandName === 'bancheck') {
    var type = interaction.options.getString('type');
        if (type === 'domain') {
            var domain = interaction.options.getString('string');
            var domainid = Math.random();
            //Send request to shellscript
            async function domfind() {
                await new Promise(r => exec(`/bin/bash ./domfind.sh '${domain}' '${domainid}'`, (r))
            );
            //Read callback and reply
            fs.readFile(path.join(__dirname,"/temp/"+domainid+""), 'utf8', (err, domaindata) => {
            if (domaindata === undefined || domaindata === null) {
                interaction.reply('*Ошибка сервера. Ответное значение undefined или null*');
            } else interaction.reply(domaindata);
                });
            }
            if (domain.includes("'") || domain.includes('"')) {
                interaction.reply('**В запросе запрещено использовать специальные символы!**')
            } else domfind(); 
      } else if (type === 'ip') {
            var ip = interaction.options.getString('string');
            var ipid = Math.random();
            //Send request to shellscript
            async function ipfind() {
                await new Promise(r => exec(`/bin/bash ./domfind.sh '${ip}' '${ipid} ip'`, (r))
            );
            //Read callback and reply
            fs.readFile(path.join(__dirname,"/temp/"+ipid+""), 'utf8', (err, domaindata) => {
            if (domaindata === undefined || domaindata === null) {
                interaction.reply('*Ошибка сервера. Ответное значение undefined или null*');
            } else interaction.reply(domaindata);
                });
            }
            if (ip.includes("'") || ip.includes('"')) {
                interaction.reply('**В запросе запрещено использовать специальные символы!**')
            } else ipfind();
      } else { // a response if you forget to add the command here
    interaction.reply('Для этой команды ещё нет ответа!');
  }
  }
});
(async ()=>{
const question = (q) => new Promise((resolve) => rl.question(q, resolve));

// Log in to Discord with your client's token
  await client.login(token).catch((err) => {
    throw err
  });

  await client.rest.put(Routes.applicationCommands(client.user.id), { body: commands });

  client.user.setPresence({
  activities: [{ name: `обходе блокировок`, type: ActivityType.Competing }],
  status: 'idle',
});
})();
