const corever = 'v1.4.12';
const forbiddenChars = /['",:;<>?!@#$%^&*(){}|\[\]\/\\]/;
//Statistics
const { loadStats, incrementStat, statsAutoSave } = require('./botstats.js');
loadStats();
//Autosave stats every (mins)
statsAutoSave(60);

const fs = require('fs');
const path = require('path');
const { exec } = require("child_process");
// Require the necessary discord.js classes
const { Client, Routes, Events, GatewayIntentBits, ActivityType, setPrestnce, SlashCommandBuilder } = require('discord.js');
const { createInterface } = require('node:readline');
const fetch = require('node-fetch');
const { token } = require('./config.json');

//data for /total cmd
const banstatsFilePath = path.join(__dirname, 'var/stats');
let banstats = {};
function loadbancount() {
    try {
        if (fs.existsSync(banstatsFilePath)) {
            const bandata = fs.readFileSync(banstatsFilePath);
            banstats = JSON.parse(bandata.toString());
        } else {
            banstats = {};
        }
    } catch (error) {
        console.error('Error while loading banstats:', error);
        banstats = {};
    }
}
loadbancount()

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    incrementStat('botlogin');
});

const ping = {
  name: 'ping',
  description: 'Пингует бота и показывает задержку'
};
const about = {
  name: 'about',
  description: 'Подробная информация о приложении'
};
const invite = {
  name: 'invite',
  description: 'Добавить Запретян на свой сервер!'
};
const total = {
  name: 'total',
  description: 'Посмотреть количество заблокированных доменов и IP адресов'
};

const bancheck = new SlashCommandBuilder()
    .setName('bancheck')
    .setDescription('Проверка наличия домена или IP адреса в реестре Роскомнадзора')
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
            .setDescription('Имя домена маленькими буквами без https:// или корректный ip адрес (Например: 1.1.1.1)')
            .setMinLength(5)
            .setMaxLength(255)
            .setRequired(true));

const commands = [ping, bancheck, about, invite, total]; // Add your commands with commas to add them to the bot!

const rl = createInterface({ input: process.stdin, output: process.stdout });

client.on('interactionCreate', (interaction) => {
  if (interaction.commandName === 'ping') {
    incrementStat('pingcmd');
    interaction.reply({
        content: `:ping_pong: *Понг!* Задержка ${Date.now() - interaction.createdTimestamp} миллисекунд! Задержка API ${Math.round(client.ws.ping)} миллисекунд.`,
        ephemeral: true,
      });
  } else if (interaction.commandName === 'about') {
    incrementStat('aboutcmd');
    interaction.reply({
        content: `:blue_heart: Помогаю с поисками в реестре блокировок! Начните поиск с помощью команды **/bancheck**. Пригласите на свой сервер с помощью **/invite**. Статистику по блокировкам сегодня можно посмотреть с помощью **/total**.\n:speech_left: Бот Запретян работает на базе https://github.com/SHULKERPLAY/Zapretyan (Оригинальная: @Zapretyan#2802).\n:dizzy: *Версия ядра: ${corever}*\n:grey_question: Есть вопросы? [Посмотрите FAQ на Github](https://github.com/SHULKERPLAY/Zapretyan/wiki/%D0%A7%D0%B0%D1%81%D1%82%D0%BE-%D0%B7%D0%B0%D0%B4%D0%B0%D0%B2%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5-%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%D1%8B) или [на нашем сайте!](https://lunarcreators.ru/zapretyan/app/)`,
        ephemeral: true,
    });
  } else if (interaction.commandName === 'invite') {
    incrementStat('invitecmd');
    interaction.reply({
        content: `:gift_heart: [Нажмите для добавления бота на сервер](https://discord.com/oauth2/authorize?client_id=907372459144147035&permissions=277025410048&integration_type=0&scope=bot) или [Добавьте через магазин приложений](https://discord.com/discovery/applications/907372459144147035) \n\n:bangbang: *Это **НЕ рассылки**! На вашем сервере будут доступны слеш-команды для поиска по реестру РКН. Для реализации ежедневных рассылок для вашего сервера свяжитесь с разработчиком.*`,
        ephemeral: true,
    });
  } else if (interaction.commandName === 'total') {
    incrementStat('totalcmd');
    interaction.reply({
        content: `**__ДОМЕНЫ__**\n:fire: Сегодня заблокировано: __${banstats.todayban}__\n:large_blue_diamond: Сегодня разблокировано: __${banstats.todayunban}__\n:no_entry_sign: **Всего заблокировано: ${banstats.totalban}**\n\n**__IP АДРЕСА__**\n:orange_circle: Сегодня заблокировано: __${banstats.todayipban}__\n:green_circle: Сегодня разблокировано: __${banstats.todayipunban}__\n:x: **Всего заблокировано: ${banstats.totalipban}**`,
        ephemeral: true,
    });
  } else if(interaction.commandName === 'bancheck') {
        incrementStat('getbancheck');
        var type = interaction.options.getString('type');
        if (type === 'domain') {
            var domain = interaction.options.getString('string');
            var domainid = Math.random();
            console.log(`Bancheck: Searching '${domain}'`)
            //Send request to shellscript
            async function domfind() {
                await new Promise(r => exec(`/bin/bash ./domfind.sh '${domain}' '${domainid}'`, (r))
            );
            //Read callback and reply
            fs.readFile(path.join(__dirname,"/temp/"+domainid+""), 'utf8', (err, domaindata) => {
            if (domaindata === undefined || domaindata === null) {
                interaction.reply({
                    content: `:warning: *Ошибка сервера. Обратитесь к администратору бота. Код: undefined_reply*`,
                    ephemeral: true,
                });
            } else interaction.reply(domaindata);
                });
                incrementStat('domainchecked');
            }
            if (forbiddenChars.test(domain)) {
                interaction.reply({
                    content: `:warning: **В запросе запрещено использовать специальные символы!**`,
                    ephemeral: true,
                });
            } else domfind();
      } else if (type === 'ip') {
            var ip = interaction.options.getString('string');
            var ipid = Math.random();
            console.log(`Bancheck: Searching '${ip}'`)
            //Send request to shellscript
            async function ipfind() {
                await new Promise(r => exec(`/bin/bash ./domfind.sh '${ip}' '${ipid}' ip`, (r))
            );
            //Read callback and reply
            fs.readFile(path.join(__dirname,"/temp/"+ipid+""), 'utf8', (err, domaindata) => {
            if (domaindata === undefined || domaindata === null) {
                interaction.reply({
                    content: `:warning: *Ошибка сервера. Обратитесь к администратору бота. Код: undefined_reply*`,
                    ephemeral: true,
                });
            } else interaction.reply(domaindata);
                });
                incrementStat('ipchecked');
            }
            if (forbiddenChars.test(ip)) {
                interaction.reply({
                    content: `:warning: **В запросе запрещено использовать специальные символы!**`,
                    ephemeral: true,
                });
            } else ipfind();
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
  activities: [{ name: `/about - Запретян`, type: ActivityType.Listening }],
  status: 'online',
});
})();
