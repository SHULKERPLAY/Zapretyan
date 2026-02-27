const { ShardingManager } = require('discord.js');
const { spawn } = require('child_process');
const path = require('node:path');
const { token, dbdir, maxmindid, maxmindpass } = require('./config.json');
const { deployInteractons } = require('./deploy.js');

//Statistics
const { loadStats, incrementStat, statsAutoSave } = require('./botstats.js');
loadStats();
//Autosave stats every (mins)
statsAutoSave(60);

// Start Bancheck Daemon
function startBancheckDaemon() {
    console.log("Starting Domfind daemon...")
    const goDaemon = spawn(path.join(__dirname, './domfind'), ['-indexdir', dbdir, "-maxmindid", maxmindid, "-maxmindpass", maxmindpass]);

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

// Deploy interactions on start
(async() => {
    await deployInteractons()
    incrementStat('botlogin');
})();

// Shard Manager
const manager = new ShardingManager(path.join(__dirname, 'index.js'), {
    token: token,
    totalShards: 'auto', // Automaticly decide count of shards
    respawn: true       // Respawn fallen shards
});

manager.on('shardCreate', shard => {
    console.log(`[Zapretyan Manager] Shard started #${shard.id}`);

    // Listening messages from shard
    shard.on('message', message => {
        // Statistics server. Inside shards use: process.send({ type: 'incrementStat', stat: 'statName' });
        if (message.type === 'incrementStat') {
            incrementStat(message.stat);
        }
    });
});

// Запуск всех шардов
manager.spawn()
    .then(() => console.log('[Zapretyan Manager] All Shards Online!'))
    .catch(console.error);