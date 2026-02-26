// Cooldown is a module that helps with ratelimiting some discord interactions for users

const { Collection } = require('discord.js');

// Storage: Key - UserId_CommandName, value - temporary timestamps array
const cooldowns = new Collection();

// Whitelist Users from cooldown
const EXEMPT_USERS = new Set([
    '459657842895486977', // Discord UID
    '683382102917644318'
]);
const TIMEFRAME = 60 * 60 * 1000; // 1 hour in milliseconds

// Automatic records cleanup every hour
setInterval(() => {
    const now = Date.now();
    cooldowns.sweep((timestamps) => {
        // Leave only fresh timestamps
        const recentActivity = timestamps.filter(time => now - time < TIMEFRAME);
        return recentActivity.length === 0; // Remove user if array is empty
    });
}, TIMEFRAME);

/* Function to check command cooldown
 * Requires { interaction } object from interaction and MAX_USES integer to limit requests pert hour
 * Returns true if limit not reached and command can be executed and false if limit reached */
async function checkRateLimit(interaction, MAX_USES) {
    const userId = interaction.user.id;
    const commandName = interaction.commandName;

    // Exclude whitelisted users
    if (EXEMPT_USERS.has(userId)) {
        return true;
    }

    const now = Date.now();

    // Create unique key
    const cooldownKey = `${userId}_${commandName}`;
    // Get or Create timestamps for user
    if (!cooldowns.has(cooldownKey)) {
        cooldowns.set(cooldownKey, []);
    }
    const timestamps = cooldowns.get(cooldownKey);

    // Filtering timestamps older than hour
    const recentUsages = timestamps.filter(time => now - time < TIMEFRAME);

    // Check if user ratelimited
    if (recentUsages.length >= MAX_USES) {
        // Counting when oldest timestamp will burn
        const expirationTime = recentUsages[0] + TIMEFRAME;
        const timeLeft = Math.round(expirationTime / 1000); // Time for Discord timestamps <t:UNIX:R> (Also try "Timestamp-Hosa" <3)
        console.log(`User ${userId} ratelimited on /${commandName}.`)
        try {
            // Edit Deferred Reply
            await interaction.editReply({
                content: `⏳ Вы исчерпали лимит **/${commandName}** (${MAX_USES} раз в час). Попробуйте снова <t:${timeLeft}:R>.`,
            });
        } catch (error) {
            console.error('Ошибка именения ответа:', error.message)
        }
        // Update collection array and restricting command execution
        cooldowns.set(cooldownKey, recentUsages);
        return false; 
    }

    // If user ratelimit not reached, add current timestamp and permit execution
    recentUsages.push(now);
    cooldowns.set(cooldownKey, recentUsages);
    return true;
}

module.exports = { checkRateLimit };