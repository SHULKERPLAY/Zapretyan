// Since 1.4.101.x core can be started only by shard manager

const corever = 'v1.4.101.20';
const forbiddenChars = /['",;<>?!@#$%^&*(){}|\[\]\/\\]/;

const fs = require('node:fs');
const dns = require('node:dns/promises');
const path = require('node:path');
// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, ActivityType, EmbedBuilder, Options, MessageFlags } = require('discord.js');
const { token } = require('./config.json');

// For bancheck network daemon
const net = require('net');
const SOCK_PATH = '/tmp/domfind.sock';

// For GeoIP interaction cooldown feature
const { checkRateLimit } = require('./cooldown.js')

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
let overralusage = 200;
function loadusagestats() {
    // Object not needed in all of index so we only count overral usage and throwing away loaded json
    let usagestats = {};
    try {
        if (fs.existsSync(usagestatsFilePath)) {
            const usagedata = fs.readFileSync(usagestatsFilePath);
            usagestats = JSON.parse(usagedata.toString());
        } else {
            usagestats = {};
        }

        // Load overral use count
        overralusage = usagestats.getbancheck + usagestats.totalcmd + usagestats.digcmd + usagestats.whocmd
    } catch (error) {
        console.error('Error while loading usagestats:', error);
        usagestats = {};
    }
}
loadusagestats()

// Create a new client instance
const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    makeCache: Options.cacheWithLimits({
        MessageManager: 0, // Not store messages
        ThreadManager: 0,
        UserManager: 0,    // Not store users
        PresenceManager: 0,
        GuildMemberManager: 0,
    }),
    rest: { timeout: 60000 } });

//functions
// Increase stat counter in manager
function shardStat(key) {
    // Is this process shard?
    if (process.send) {
        process.send({ type: 'incrementStat', stat: key });
    }
}

//async delay
function delay(ms) { //usage: await delay(10000)
    return new Promise(resolve => setTimeout(resolve, ms));
}

//Integer randomizer
//effective range: getRandomInt(-999999999999999, 999999999999999));
function getRandomInt(min, max) {
    //null test
    min = min ?? -999999999999999;
    max = max ?? 999999999999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

//ephemeral message?
async function checkephemeral(interaction) {
    const isPublic = interaction.options.getBoolean('публично') ?? false;
    if (isPublic) {
        shardStat(`use.publicreply`);
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

// Send request to daemon socket
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

// Parse interaction and reply content from domfind daemon
async function fbancheck(interaction, publicreplylog) {
    const search = interaction.options.getString('string');
    //test for bad characters
    if (forbiddenChars.test(search)) {
        const replycontent = `⚠️ **В запросе запрещено использовать специальные символы!**`
        return await interactioneditreply(interaction, replycontent);
    }
    let mode;
    if (interaction.commandName === 'bancheck') {
        if (interaction.options.getString('type') === 'domain') {
            mode = 'domain'
            shardStat('domainchecked');
            console.log(`Bancheck: '${search}' ${publicreplylog}`)
        } else {
            mode = 'ip'
            shardStat('ipchecked');
            console.log(`Bancheck: ip:'${search}' ${publicreplylog}`)
        }
    } else if (interaction.commandName === 'who') {
        const execute = await checkRateLimit(interaction, 10);
        // If function returned false (User Ratelimited): Stop executing
        if (!execute) return;
        if (interaction.options.getString('type') === 'domain') {
            mode = 'geodomain'
            shardStat('geodomain');
            console.log(`GeoLite: '${search}' ${publicreplylog}`)
        } else {
            mode = 'geoip'
            shardStat('geoip');
            console.log(`GeoLite: ip:'${search}' ${publicreplylog}`)
        }
    }

    let domaindata;
    try {
        // Send request to bancheck network socket
        domaindata = await bancheckDaemon(search, mode);
    } catch (err) {
        console.error('Bancheck Daemon error:', err.message);
        domaindata = `🔴 Внутренняя ошибка. ${err.message}`
    }
    //Operator || counts undefined, null, 0, false and empty line as bad. While operator ?? counts as bad only undefined and null
    const replycontent = domaindata || `⚠️ *Ошибка сервера. Обратитесь к администратору бота. Код: undefined_reply*`
    interactioneditreply(interaction, replycontent);
}

//dnsdig
async function fdig(interaction, publicreplylog) {
    const type = interaction.options.getString('type');
    const domain = interaction.options.getString('string');
    //test for bad characters
    if (forbiddenChars.test(domain)) {
        const replycontent = `⚠️ **В запросе запрещено использовать специальные символы!**`
        return await interactioneditreply(interaction, replycontent);
    }
    console.log(`DNS Search: ${type} ${domain} ${publicreplylog}`)
    shardStat(`digcmd.${type}`);
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
        const replycontent = `🏓 *Понг!* Задержка ${Date.now() - interaction.createdTimestamp} миллисекунд! Задержка API ${Math.round(client.ws.ping)} миллисекунд.`
        await interactionreply(interaction, replycontent, true);
        shardStat('pingcmd');
    } else if (interaction.commandName === 'about') {
        shardStat('aboutcmd');
        const replycontent = `💙 Помогаю с поисками блокировок из нескольких источников! Начните поиск с помощью команды **/bancheck**.\nИщите IP адрес и записи сайта при помощи **/dig**!\nПригласите на свой сервер с помощью **/invite**.\nСтатистику по блокировкам сегодня можно посмотреть с помощью **/total**.\n\n🔮 **БОЛЬШОЕ ОБНОВЛЕНИЕ:**\n- Теперь Запретян отдаёт ещё больше информации при поиске IP адреса или полного имени сайта!\n- С новой командой \`/who\` вы можете узнать страну сайта или IP, а также его провайдера (10 раз в час)!\n\n:speech_left: Бот Запретян работает на базе https://github.com/SHULKERPLAY/Zapretyan (Оригинальная: \`Zapretyan#2802\`).\n💫 *Версия ядра: ${corever}*\n❔ Есть вопросы? [Посмотрите FAQ на Github](https://github.com/SHULKERPLAY/Zapretyan/wiki/%D0%A7%D0%B0%D1%81%D1%82%D0%BE-%D0%B7%D0%B0%D0%B4%D0%B0%D0%B2%D0%B0%D0%B5%D0%BC%D1%8B%D0%B5-%D0%B2%D0%BE%D0%BF%D1%80%D0%BE%D1%81%D1%8B) или [на нашем сайте!](https://lunarcreators.ru/zapretyan/app/) \n💝 [Сервер поддержки](https://discord.gg/e2HcXrQ) - <@459657842895486977> \n\n-# [Условия использования](https://lunarcreators.ru/zapretyan/app/tos/) и [Политика Конфиденциальности](https://lunarcreators.ru/zapretyan/app/privacy/)`
        await interactionreply(interaction, replycontent, true, null, true);
    } else if (interaction.commandName === 'invite') {
        shardStat('invitecmd');
        const replycontent = `💝 [Нажмите для добавления бота на сервер](https://discord.com/oauth2/authorize?client_id=907372459144147035&permissions=277025410048&integration_type=0&scope=bot) или [Добавьте через магазин приложений на сервер или как личное приложение](https://discord.com/discovery/applications/907372459144147035)! \n*Установка в свои приложения даёт доступ к функциям поиска запретян в любом чате сервера и ЛС.* \n\n‼️ *Это **НЕ рассылки**! На вашем сервере будут доступны слеш-команды для поиска по реестру РКН. Для реализации ежедневных рассылок для вашего сервера свяжитесь с разработчиком.*`
        await interactionreply(interaction, replycontent, true, null, true);
    } else if (interaction.commandName === 'total') {
        shardStat('totalcmd');
        const replycontent = `**__ДОМЕНЫ__**\n🔥 Сегодня заблокировано: __${banstats.todayban}__\n🔷 Сегодня разблокировано: __${banstats.todayunban}__\n🚫 **Всего заблокировано: ${banstats.totalban}**\n\n**__IP АДРЕСА__**\n🟠 Сегодня заблокировано: __${banstats.todayipban}__\n🟢 Сегодня разблокировано: __${banstats.todayipunban}__\n❌ **Всего заблокировано: ${banstats.totalipban}**`
        await interactionreply(interaction, replycontent, isephemeral);
        console.log(`/total used ${publicreplylog}`)
    } else if(interaction.commandName === 'bancheck') {
        await interaction.deferReply({ flags: isephemeral ? [MessageFlags.Ephemeral] : [] });
        await fbancheck(interaction, publicreplylog);
        shardStat('getbancheck');
    } else if(interaction.commandName === 'dig') {
        await interaction.deferReply({ flags: isephemeral ? [MessageFlags.Ephemeral] : [] });
        await fdig(interaction, publicreplylog);
        shardStat('digcmd');
    } else if(interaction.commandName === 'who') {
        await interaction.deferReply({ flags: isephemeral ? [MessageFlags.Ephemeral] : [] });
        await fbancheck(interaction, publicreplylog);
        shardStat('whocmd');
    }
});

//actions as client ready
client.once(Events.ClientReady, async(readyClient) => {
    //fetch application data
    await readyClient.application.fetch();
    //Installation Counter
    const installCount = readyClient.application.approximateUserInstallCount
    
    console.log(`Logged in as ${readyClient.user.tag}: Shard ${client.shard.ids[0]}. Approx installs: ${installCount}`);
    //Login output
    shardStat('shardlogin');
    
    //index init
    let currentIndex = 0;
    
    function presenceupdate() {
        //check if client ready
        if (!client.user) return;

        // Update presence only by first shard!
        if (client.shard && client.shard.ids[0] !== 0) return;

        //Bot Presence List
        const presencelist = [
            { name: `🔍 /bancheck • ${corever}`, type: ActivityType.Streaming },
            { name: `🩵 /about • Запретян!`, type: ActivityType.Streaming },
            { name: `🎲 Случайный IPv4 • ${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}.${getRandomInt(1, 255)}`, type: ActivityType.Streaming },
            { name: `🔮 /who • Чей сайт или IP адрес?`, type: ActivityType.Streaming },
            { name: `📈 /total • ${overralusage}+ запросов!`, type: ActivityType.Streaming },
            { name: `❌ Забанено ${banstats.rawtotalban} доменов!`, type: ActivityType.Streaming },
            { name: `🌐 /dig • Узнать IP сайта!`, type: ActivityType.Streaming },
            { name: `❌ Забанено ${banstats.rawtotalipban} адресов!`, type: ActivityType.Streaming }
        ];

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

// Log in to Discord with your client's token
client.login(token).catch((err) => {
    throw err
});