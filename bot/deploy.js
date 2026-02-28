// Require the necessary discord.js classes
const { Client, Events, Routes, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const { token } = require('./config.json');

// Deploys actual interactions once shard manager calls this function
async function deployInteractions() {
    try {
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
                    .setDescription('🔍 Блокировку чего нужно проверить? Домена/Сайта или IP адреса?')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Домен (Например: instagram.com)', value: 'domain' },
                        { name: 'IP Адрес (Например: 159.22.102.2)', value: 'ip' },
                    ))
            .addStringOption(option =>
                option.setName('string')
                    .setDescription('🔍 Имя домена без https:// или корректный IPv4 адрес (Например: 1.1.1.1)')
                    .setMinLength(5)
                    .setMaxLength(255)
                    .setRequired(true))
            //decide if reply be ephemeral (publicreply: false / true)
            .addBooleanOption(addPublicReply())

        const who = new SlashCommandBuilder()
            .setName('who')
            .setDescription('🔮 Узнать приблизительное расположение и провайдера по IP или Домену')
            setAvailable(who)
            .addStringOption(option =>
                option.setName('type')
                    .setDescription('🔮 Что ищем? Домен/Сайт или IP адрес?')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Домен (Например: instagram.com)', value: 'domain' },
                        { name: 'IP Адрес (Например: 159.22.102.2)', value: 'ip' },
                    ))
            .addStringOption(option =>
                option.setName('string')
                    .setDescription('🔮 Полное имя домена без https:// (прим. x.com) или корректный IP адрес (Например: 1.1.1.1)')
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

        const commands = [ping, bancheck, about, invite, total, dnsdig, who]; // Place to add SlashCommandBuilder objects

        //Client setup
        const client = new Client({ intents: [GatewayIntentBits.Guilds] });

        client.once(Events.ClientReady, async (readyClient) => {
            try {
                //app commands registration
                await client.rest.put(Routes.applicationCommands(client.user.id), { body: commands });
                console.log(`Interactions Deployed for ${readyClient.user.tag}!`);
            } catch (error) {
                console.error('Failed to deploy interactions:', error.message);
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

module.exports = { deployInteractions };