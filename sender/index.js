const corever = 'v1.4.41';
const forbiddenChars = /['",:;<>?!@#$%^&*(){}|\[\]\/\\]/;
//Statistics
const { loadStats, incrementStat, statsAutoSave } = require('./botstats.js');
loadStats();
//Autosave stats every (mins)
statsAutoSave(60);

const fs = require('node:fs');
const fspromises = require('node:fs/promises');
const path = require('node:path');
const { exec } = require("child_process");
// Require the necessary discord.js classes
const { Client, Routes, Events, GatewayIntentBits, ActivityType, setPrestnce, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createInterface } = require('node:readline');
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

//Usage data for presence status
const usagestatsFilePath = path.join(__dirname, 'stats.json');
let usagestats = {};
function loadusecount() {
    try {
        if (fs.existsSync(usagestatsFilePath)) {
            const usagedata = fs.readFileSync(usagestatsFilePath);
            usagestats = JSON.parse(usagedata.toString());
        } else {
            usagestats = {};
        }
    } catch (error) {
        console.error('Error while loading usagestats:', error);
        usagestats = {};
    }
}
loadusecount()

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds], rest: { timeout: 60000 } });

const ping = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Проверка скорости ответа приложения')
    .setIntegrationTypes(0, 1)
    .setContexts(0, 1)
  
const about = new SlashCommandBuilder()
    .setName('about')
    .setDescription('📙 Подробная информация о приложении')
    .setIntegrationTypes(0, 1)
    .setContexts(0, 1)
  
const invite = {
  name: 'invite',
  description: '🔗 Установить запретян на сервер или как личное приложение!'
};

const total = new SlashCommandBuilder()
    .setName('total')
    .setDescription('📈 Посмотреть количество заблокированных доменов и IP адресов')
    .setIntegrationTypes(0, 1)
    .setContexts(0, 1, 2)
    //decide if reply be ephemeral (publicreply: false / true)
    .addBooleanOption(option =>
        option.setName('публично')
        .setDescription('❓ Будет ли результат виден всем в этом чате?')
        .setRequired(false))
    //end of publicreply

const bancheck = new SlashCommandBuilder()
    .setName('bancheck')
    .setDescription('🔍 Проверка наличия домена или IPv4 адреса в реестре Роскомнадзора')
// Interaction work with 0 - Guild Install, 1 - User Install
    .setIntegrationTypes(0, 1)
// Interaction can be used in 0 - Guild Channels, 1 - DM with bot, 2 - Group or Private user DM's
    .setContexts(0, 1, 2)
    .addStringOption(option =>
        option.setName('type')
            .setDescription('🔍 Блокировку чего нужно проверить? Домена/Сайта или IPv4 адреса?')
            .setRequired(true)
            .addChoices(
                { name: 'Домен (Например: instagram.com)', value: 'domain' },
                { name: 'IP Адрес (Например: 159.22.102.2)', value: 'ip' },
            ))
    .addStringOption(option =>
        option.setName('string')
            .setDescription('🔍 Имя домена маленькими буквами без https:// или корректный IPv4 адрес (Например: 1.1.1.1)')
            .setMinLength(5)
            .setMaxLength(255)
            .setRequired(true))
    //decide if reply be ephemeral (publicreply: false / true)
    .addBooleanOption(option =>
        option.setName('публично')
        .setDescription('❓ Будет ли результат виден всем в этом чате?')
        .setRequired(false));
    //end of publicreply
    

const commands = [ping, bancheck, about, invite, total]; // Add your commands with commas to add them to the bot!

const rl = createInterface({ input: process.stdin, output: process.stdout });

//functions
//async delay
function delay(ms) { //usage: await delay(10000)
  return new Promise(resolve => setTimeout(resolve, ms));
}
//ephemeral message?
async function checkephemeral(interaction) {
    const isPublic = interaction.options.getBoolean('публично') ?? false;
    if (isPublic) {
        incrementStat(`use.publicreply`);
        return { publicreplylog: 'public', isephemeral: false };
    }
    return { publicreplylog: '', isephemeral: true };
}
//interaction functions
//common reply
async function interactionreply(interaction, replycontent, isephemeral) {
    //djs v14.15+ now using flags instead of 'ephemeral: true'
    const replyflag = [];
    if (isephemeral) replyflag.push(MessageFlags.Ephemeral);
    //if (hideembeds) replyflag.push(MessageFlags.SuppressEmbeds);
    await interaction.reply({
        content: replycontent,
        flags: replyflag,
    });
}
//common reply (deferred)
async function interactioneditreply(interaction, replycontent, isephemeral) {
    await interaction.editReply({
        content: replycontent,
    });
}
//bancheck
async function fbancheck(interaction, isephemeral, publicreplylog) {
    const search = interaction.options.getString('string');
    if (forbiddenChars.test(search)) {
        const replycontent = `:warning: **В запросе запрещено использовать специальные символы!**`
        return await interactioneditreply(interaction, replycontent, true);
    }
    let mode;
    const reqid = Math.random();
    if (interaction.options.getString('type') === 'domain') {
        mode = ''
        incrementStat('domainchecked');
        console.log(`Bancheck: '${search}' ${publicreplylog}`)
    } else {
        mode = 'ip'
        incrementStat('ipchecked');
        console.log(`Bancheck: ip:'${search}' ${publicreplylog}`)
    }
    await new Promise(r => exec(`/bin/bash ./domfind.sh '${search}' '${reqid}' '${mode}'`, (r)));
    //Read callback and reply
    let domaindata;
    const filepath = path.join(__dirname, `/temp/${reqid}`);
    try {
        domaindata = await fspromises.readFile(filepath, 'utf8');
    } catch (error) {
        console.error('Failed to read file:', error);
    }
    const replycontent = domaindata || `:warning: *Ошибка сервера. Обратитесь к администратору бота. Код: undefined_reply*`
    interactioneditreply(interaction, replycontent, isephemeral);
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    //check if reply be ephemeral
    let { publicreplylog, isephemeral } = await checkephemeral(interaction);
    if (interaction.commandName === 'ping') {
        const replycontent = `:ping_pong: *Понг!* Задержка ${Date.now() - interaction.createdTimestamp} миллисекунд! Задержка API ${Math.round(client.ws.ping)} миллисекунд.`
        await interactionreply(interaction, replycontent, true);
        incrementStat('pingcmd');
    } else if (interaction.commandName === 'about') {
        incrementStat('aboutcmd');
        const replycontent = `:blue_heart: Помогаю с поисками в реестре блокировок! Начните поиск с помощью команды **/bancheck**. Пригласите на свой сервер с помощью **/invite**. Статистику по блокировкам сегодня можно посмотреть с помощью **/total**.\n:speech_left: Бот Запретян работает на базе https://github.com/SHULKERPLAY/Zapretyan (Оригинальная: \`Zapretyan#2802\`).\n:dizzy: *Версия ядра: ${corever}*\n:grey_question: Есть вопросы? [Посмотрите FAQ на Github](https://github.com/SHULKERPLAY/Zapretyan/wiki/%D0%A7%D0%B0%D1%81%D1%82%D0%BE-%D0%B7%D0%B0%D0%B4%D0%B0%D0%B2%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5-%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%D1%8B) или [на нашем сайте!](https://lunarcreators.ru/zapretyan/app/) \n:gift_heart: [Сервер поддержки](https://discord.gg/e2HcXrQ) - <@459657842895486977> \n\n-# [Условия использования](https://lunarcreators.ru/zapretyan/app/tos/) и [Политика Конфиденциальности](https://lunarcreators.ru/zapretyan/app/privacy/)`
        await interactionreply(interaction, replycontent, true);
    } else if (interaction.commandName === 'invite') {
        incrementStat('invitecmd');
        const replycontent = `:gift_heart: [Нажмите для добавления бота на сервер](https://discord.com/oauth2/authorize?client_id=907372459144147035&permissions=277025410048&integration_type=0&scope=bot) или [Добавьте через магазин приложений на сервер или как личное приложение](https://discord.com/discovery/applications/907372459144147035)! \n*Установка в свои приложения даёт доступ к функциям поиска запретян в любом чате сервера и ЛС.* \n\n:bangbang: *Это **НЕ рассылки**! На вашем сервере будут доступны слеш-команды для поиска по реестру РКН. Для реализации ежедневных рассылок для вашего сервера свяжитесь с разработчиком.*`
        await interactionreply(interaction, replycontent, true);
    } else if (interaction.commandName === 'total') {
        incrementStat('totalcmd');
        const replycontent = `**__ДОМЕНЫ__**\n:fire: Сегодня заблокировано: __${banstats.todayban}__\n:large_blue_diamond: Сегодня разблокировано: __${banstats.todayunban}__\n:no_entry_sign: **Всего заблокировано: ${banstats.totalban}**\n\n**__IP АДРЕСА__**\n:orange_circle: Сегодня заблокировано: __${banstats.todayipban}__\n:green_circle: Сегодня разблокировано: __${banstats.todayipunban}__\n:x: **Всего заблокировано: ${banstats.totalipban}**`
        await interactionreply(interaction, replycontent, isephemeral);
    } else if(interaction.commandName === 'bancheck') {
        await interaction.deferReply({ flags: isephemeral ? [MessageFlags.Ephemeral] : [] });
        await fbancheck(interaction, isephemeral, publicreplylog);
        incrementStat('getbancheck');
    }
});

//actions as client ready
client.once(Events.ClientReady, async(readyClient) => {
    //fetch application data
    await readyClient.application.fetch();
    //Installation Counter
    const installCount = readyClient.application.approximateUserInstallCount
    //Login output
    console.log(`Logged in as ${readyClient.user.tag}. Approx installs: ${installCount}`);
    incrementStat('botlogin');
    
    //Bot Presence List
    const presencelist = [
        { name: `🩵 /about • Запретян!`, type: ActivityType.Streaming },
        { name: `❌ Забанено ${banstats.rawtotalban} доменов!`, type: ActivityType.Streaming },
        { name: `📈 /total • ${usagestats.getbancheck + usagestats.totalcmd}+ запросов!`, type: ActivityType.Streaming },
        { name: `❌ Забанено ${banstats.rawtotalipban} адресов!`, type: ActivityType.Streaming },
        { name: `🔍 /bancheck • ${corever}`, type: ActivityType.Streaming }
    ];
    
    //index init
    let currentIndex = 0;
    
    function presenceupdate() {
        //check if client ready
        if (!client.user) return;
        //Set Presence
        client.user.setPresence({
            activities: [presencelist[currentIndex]],
            status: 'online',
        });
        //next index (0 in the end)
        currentIndex = (currentIndex + 1) % presencelist.length;
    };
    
    //Update presence on Login
    presenceupdate()
    //Update presence every (x, ms)
    setInterval(presenceupdate, 1800000);
});

//prelogin
(async() => {
    //auth
    const question = (q) => new Promise((resolve) => rl.question(q, resolve));

    // Log in to Discord with your client's token
    await client.login(token).catch((err) => {
      throw err
    });
    
    //app commands registration
    await client.rest.put(Routes.applicationCommands(client.user.id), { body: commands });
})();