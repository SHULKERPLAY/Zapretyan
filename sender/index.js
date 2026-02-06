const corever = 'v1.4.52';
const forbiddenChars = /['",:;<>?!@#$%^&*(){}|\[\]\/\\]/;
//Statistics
const { loadStats, incrementStat, statsAutoSave } = require('./botstats.js');
loadStats();
//Autosave stats every (mins)
statsAutoSave(60);

const fs = require('node:fs');
const dns = require('node:dns/promises');
const path = require('node:path');
// Require the necessary discord.js classes
const { Client, Routes, Events, GatewayIntentBits, ActivityType, EmbedBuilder, SlashCommandBuilder, MessageFlags } = require('discord.js');
const { createInterface } = require('node:readline');
const { token, dbdir } = require('./config.json');

// For bancheck network daemon
const { spawn } = require('child_process');
const net = require('net');
const SOCK_PATH = '/tmp/domfind.sock';

function startBancheckDaemon() {
    // Start Bancheck Daemon
    console.log("Starting Domfind daemon...")
    const goDaemon = spawn(path.join(__dirname, './domfind'), ['-indexdir', dbdir]);

    goDaemon.stdout.on('data', (data) => {
        console.log(`[Domfind] ${data}`);
    });
    // Close daemon if Node is closing
    process.on('exit', () => {
        goDaemon.kill();
    });

    // Autorestart
    goDaemon.on('close', (code) => {
            console.warn(`Domfind daemon exited with code: ${code}. Restarting...`);

            // Wait to aware cycling
            setTimeout(startBancheckDaemon, 2000);
        });

    // Handle critical err
    goDaemon.on('error', (err) => {
        console.error('Failed to start Go daemon:', err);
    });
}
startBancheckDaemon();


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

// Rules helper
// Interaction can be used in 0 - Guild Channels, 1 - DM with bot, 2 - Group or Private user DM's
// Interaction work with 0 - Guild Install, 1 - User Install
const setAvailable = (builder) => builder.setIntegrationTypes(0, 1).setContexts(0, 1, 2);

// publicreply helper
//decide if reply be ephemeral (publicreply: false / true)
const addPublicReply = () => (option) => {
    option.setName('публично')
    .setDescription('❓ Будет ли результат виден всем в этом чате?')
    .setRequired(false);
    return option;
};

const ping = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('🏓 Проверка скорости ответа приложения')
    setAvailable(ping);
  
const about = new SlashCommandBuilder()
    .setName('about')
    .setDescription('📙 Подробная информация о приложении')
    setAvailable(about);
  
const invite = new SlashCommandBuilder()
    .setName('invite')
    .setDescription('🔗 Установить запретян на сервер или как личное приложение!')
    setAvailable(invite);

const total = new SlashCommandBuilder()
    .setName('total')
    .setDescription('📈 Посмотреть количество заблокированных доменов и IP адресов')
    setAvailable(total)
    //decide if reply be ephemeral (publicreply: false / true)
    .addBooleanOption(addPublicReply())

const bancheck = new SlashCommandBuilder()
    .setName('bancheck')
    .setDescription('🔍 Проверка наличия домена или IPv4 адреса в реестре Роскомнадзора')
    setAvailable(bancheck)
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
    .addBooleanOption(addPublicReply())
    
const dnsdig = new SlashCommandBuilder()
    .setName('dig')
    .setDescription('🌐 Проверить IP адрес домена и другие данные (A, AAAA, CNAME, TXT, MX, NS или PTR записи)')
    setAvailable(dnsdig)
    .addStringOption(option =>
        option.setName('type')
            .setDescription('🌐 Какой тип доменной записи вы ищете?')
            .setRequired(true)
            .addChoices(
                { name: '🌐 IPv4 адрес домена (A)', value: 'A' },
                { name: '🌐 IPv6 адрес домена (AAAA)', value: 'AAAA' },
                { name: '🌐 Синоним домена (CNAME)', value: 'CNAME' },
                { name: '🌐 Почтовые записи домена (MX)', value: 'MX' },
                { name: '🌐 Текстовые записи домена (TXT)', value: 'TXT' },
                { name: '🌐 Сервера имён домена (NS)', value: 'NS' },
                { name: '🌐 PTR Связь IP адреса с доменом (IPv4 адрес в домен)', value: 'PTR' },
            ))
    .addStringOption(option =>
        option.setName('string')
            .setDescription('🌐 Доменное имя (Например: example.com) или корректный IPv4 адрес (Например: 1.1.1.1)')
            .setMinLength(5)
            .setMaxLength(255)
            .setRequired(true))
    //decide if reply be ephemeral (publicreply: false / true)
    .addBooleanOption(addPublicReply())

const commands = [ping, bancheck, about, invite, total, dnsdig]; // Add your commands with commas to add them to the bot!

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
//Embed constructor
function createEmbed(title, data, footer, color) {
    const authoricon = 'https://lunarcreators.ru/wp-content/uploads/2025/11/discordiconmini.webp'
    const authorurl = 'https://discord.com/discovery/applications/907372459144147035'
    //Check message length and truncate if necessary
    const descriptioncontent = (data || '').length > 3800 ? data.substring(0, 3800) + "...\n```\nОтображаемый контент превышает 3800 символов!" : data;

    const newembed = new EmbedBuilder()
        .setColor(color.trim() || '00c8ff')
        .setTitle(title)
        .setDescription(descriptioncontent)
        .setAuthor({ name: 'Запретян <3', iconURL: authoricon, url: authorurl })
        .setTimestamp()
        .setFooter({ text: footer || 'С любовью, @Zapretyan#2802' });
    return newembed;
}

//interaction functions
//common reply
async function interactionreply(interaction, replycontent, isephemeral, embedcontent, hideembeds) {
    try {
        //djs v14.15+ now using flags instead of 'ephemeral: true'
        const replyflag = [];
        const replydata = (replycontent || '').length > 1900 ? replycontent.substring(0, 1900) + "...\n```\nОтображаемый контент превышает 1900 символов!" : replycontent;
        if (isephemeral) replyflag.push(MessageFlags.Ephemeral);
        if (hideembeds) replyflag.push(MessageFlags.SuppressEmbeds);
        await interaction.reply({
            content: replydata || '',
            embeds: embedcontent || [],
            flags: replyflag,
        });
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error.message)
    }
}
//common reply (deferred)
async function interactioneditreply(interaction, replycontent, embedcontent) {
    const replydata = (replycontent || '').length > 1900 ? replycontent.substring(0, 1900) + "...\n```\nОтображаемый контент превышает 1900 символов!" : replycontent;
    try {
        await interaction.editReply({
            content: replydata || '',
            embeds: embedcontent || [],
        });
    } catch (error) {
        console.error('Ошибка именения ответа:', error.message)
    }
}

//bancheck
function bancheckDaemon(command, mode) {
    return new Promise((resolve, reject) => {
        const client = net.createConnection(SOCK_PATH);
        let responseBuffer = '';

        // Timeout if request stuck
        client.setTimeout(15000);

        // Send command when connected
        client.on('connect', () => {
            // Daemon awaits newline to start completing request
            client.write(`${mode};` + command + '\n');
        });

        // Get data (Partial)
        client.on('data', (chunk) => {
            responseBuffer += chunk.toString();
        });

        // Daemon closed connection at success
        client.on('end', () => {
            resolve(responseBuffer);
        });

        // Error resolving
        // On timeout
        client.on('timeout', () => {
            console.error("Bancheck Timeout: Server took too long");
            client.destroy(); // Force close connection
            reject(new Error("Connection timeout"));
        });
        // On err
        client.on('error', (err) => {
            if (err.code === 'ENOENT') {
                reject(new Error(`Daemon not running`));
            } else {
                reject(err);
            }
        });
    });
}

async function fbancheck(interaction, publicreplylog) {
    const search = interaction.options.getString('string');
    //test for bad characters
    if (forbiddenChars.test(search)) {
        const replycontent = `:warning: **В запросе запрещено использовать специальные символы!**`
        return await interactioneditreply(interaction, replycontent);
    }
    let mode;
    if (interaction.options.getString('type') === 'domain') {
        mode = 'domain'
        incrementStat('domainchecked');
        console.log(`Bancheck: '${search}' ${publicreplylog}`)
    } else {
        mode = 'ip'
        incrementStat('ipchecked');
        console.log(`Bancheck: ip:'${search}' ${publicreplylog}`)
    }
    let domaindata;
    try {
        // Send request to bancheck network socket
        domaindata = await bancheckDaemon(search, mode);
    } catch (err) {
        console.error('Bancheck Daemon error:', err.message);
        domaindata = `:red_circle: Внутренняя ошибка. ${err.message}`
    }
    //Operator || counts undefined, null, 0, false and empty line as bad. While operator ?? counts as bad only undefined and null
    const replycontent = domaindata || `:warning: *Ошибка сервера. Обратитесь к администратору бота. Код: undefined_reply*`
    interactioneditreply(interaction, replycontent);
}

//dnsdig
async function fdig(interaction, publicreplylog) {
    const type = interaction.options.getString('type');
    const domain = interaction.options.getString('string');
    //test for bad characters
    if (forbiddenChars.test(domain)) {
        const replycontent = `:warning: **В запросе запрещено использовать специальные символы!**`
        return await interactioneditreply(interaction, replycontent);
    }
    console.log(`DNS Search: ${type} ${domain} ${publicreplylog}`)
    incrementStat(`digcmd.${type}`);
    const resolver = new dns.Resolver();
    resolver.setServers(['1.1.1.1', '8.8.8.8'])
    try {
        if (type === 'A') {
            const resolve = await resolver.resolve4(domain);
            interactioneditreply(interaction, `4️⃣ Найдены A записи для __${domain}__: ${resolve.filter(Boolean).map(ip => `\`${ip}\``).join(', ')}`);
        } else if (type === 'AAAA') {
            const resolve = await resolver.resolve6(domain);
            interactioneditreply(interaction, `6️⃣ Найдены AAAA записи для __${domain}__: ${resolve.filter(Boolean).map(ip => `\`${ip}\``).join(', ')}`);
        } else if (type === 'CNAME') {
            const resolve = await resolver.resolveCname(domain);
            interactioneditreply(interaction, `💡 Найден синоним (CNAME) для __${domain}__: ${resolve.filter(Boolean).map(ip => `\`${ip}\``).join(', ')}`);
        } else if (type === 'MX') {
            const resolve = await resolver.resolveMx(domain);
            reply = `\`\`\`\n${JSON.stringify(resolve, null, 2)}\n\`\`\``;
            const replyembed = createEmbed(`✉️ Найдены MX записи для ${domain}`, reply, `${domain} IN MX`, 'ffa33b');
            interactioneditreply(interaction, null, [replyembed]);
        } else if (type === 'TXT') {
            const resolve = await resolver.resolveTxt(domain);
            interactioneditreply(interaction, `📒 Найдены текстовые (TXT) записи __${domain}__: ${resolve.filter(Boolean).map(ip => `\`${ip}\``).join(',\n')}`);
        } else if (type === 'NS') {
            const resolve = await resolver.resolveNs(domain);
            interactioneditreply(interaction, `⚙️ Найдены сервера имён (NS) для __${domain}__: ${resolve.filter(Boolean).map(ip => `\`${ip}\``).join(',\n')}`);
        } else if (type === 'PTR') {
            try {
                const resolve = await resolver.reverse(domain);
                interactioneditreply(interaction, `🔄 Найдена PTR запись для __${domain.split('.').reverse().join('.') + ".in-addr.arpa"}__: ${resolve.filter(Boolean).map(ip => `\`${ip}\``).join(', ')}`);
            } catch (ptrerror) {
                interactioneditreply(interaction, `❌ Не найдена PTR запись для __${domain.split('.').reverse().join('.') + ".in-addr.arpa"}__`);
                console.error('DNS Err:', ptrerror.message);
            }
        }
    } catch (error) {
        interactioneditreply(interaction, `❌ Не найдены **${type}** записи у __**${domain}**__`);
        console.error('DNS Err:', error.message);
    }
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
        const replycontent = `:blue_heart: Помогаю с поисками в реестре блокировок! Начните поиск с помощью команды **/bancheck**.\nИщите IP адрес и записи сайта при помощи **/dig**!\nПригласите на свой сервер с помощью **/invite**.\nСтатистику по блокировкам сегодня можно посмотреть с помощью **/total**.\n:speech_left: Бот Запретян работает на базе https://github.com/SHULKERPLAY/Zapretyan (Оригинальная: \`Zapretyan#2802\`).\n:dizzy: *Версия ядра: ${corever}*\n:grey_question: Есть вопросы? [Посмотрите FAQ на Github](https://github.com/SHULKERPLAY/Zapretyan/wiki/%D0%A7%D0%B0%D1%81%D1%82%D0%BE-%D0%B7%D0%B0%D0%B4%D0%B0%D0%B2%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5-%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%D1%8B) или [на нашем сайте!](https://lunarcreators.ru/zapretyan/app/) \n:gift_heart: [Сервер поддержки](https://discord.gg/e2HcXrQ) - <@459657842895486977> \n\n-# [Условия использования](https://lunarcreators.ru/zapretyan/app/tos/) и [Политика Конфиденциальности](https://lunarcreators.ru/zapretyan/app/privacy/)`
        await interactionreply(interaction, replycontent, true, null, true);
    } else if (interaction.commandName === 'invite') {
        incrementStat('invitecmd');
        const replycontent = `:gift_heart: [Нажмите для добавления бота на сервер](https://discord.com/oauth2/authorize?client_id=907372459144147035&permissions=277025410048&integration_type=0&scope=bot) или [Добавьте через магазин приложений на сервер или как личное приложение](https://discord.com/discovery/applications/907372459144147035)! \n*Установка в свои приложения даёт доступ к функциям поиска запретян в любом чате сервера и ЛС.* \n\n:bangbang: *Это **НЕ рассылки**! На вашем сервере будут доступны слеш-команды для поиска по реестру РКН. Для реализации ежедневных рассылок для вашего сервера свяжитесь с разработчиком.*`
        await interactionreply(interaction, replycontent, true, null, true);
    } else if (interaction.commandName === 'total') {
        incrementStat('totalcmd');
        const replycontent = `**__ДОМЕНЫ__**\n:fire: Сегодня заблокировано: __${banstats.todayban}__\n:large_blue_diamond: Сегодня разблокировано: __${banstats.todayunban}__\n:no_entry_sign: **Всего заблокировано: ${banstats.totalban}**\n\n**__IP АДРЕСА__**\n:orange_circle: Сегодня заблокировано: __${banstats.todayipban}__\n:green_circle: Сегодня разблокировано: __${banstats.todayipunban}__\n:x: **Всего заблокировано: ${banstats.totalipban}**`
        await interactionreply(interaction, replycontent, isephemeral);
        console.log(`/total used ${publicreplylog}`)
    } else if(interaction.commandName === 'bancheck') {
        await interaction.deferReply({ flags: isephemeral ? [MessageFlags.Ephemeral] : [] });
        await fbancheck(interaction, publicreplylog);
        incrementStat('getbancheck');
    } else if(interaction.commandName === 'dig') {
        await interaction.deferReply({ flags: isephemeral ? [MessageFlags.Ephemeral] : [] });
        await fdig(interaction, publicreplylog);
        incrementStat('digcmd');
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
        { name: `🌐 /dig • Узнать IP сайта!`, type: ActivityType.Streaming },
        { name: `❌ Забанено ${banstats.rawtotalban} доменов!`, type: ActivityType.Streaming },
        { name: `📈 /total • ${usagestats.getbancheck + usagestats.totalcmd + usagestats.digcmd}+ запросов!`, type: ActivityType.Streaming },
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