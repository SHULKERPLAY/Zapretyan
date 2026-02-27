//stats tool v1.3.3
const fs = require('fs');
const path = require('path');

const statsFilePath = path.join(__dirname, 'stats.json');
let stats = {};

//Loading stats
function loadStats() {
    try {
        if (fs.existsSync(statsFilePath)) {
            const data = fs.readFileSync(statsFilePath);
            stats = JSON.parse(data.toString());
            console.log('Stats loaded');
        } else {
            console.log('Stats not found - Counters reset');
            stats = {};
        }
    } catch (error) {
        console.error('Error while loading stats:', error);
        stats = {};
    }
}
//Count Usage Statistics
function incrementStat(actionName) {
    stats[actionName] = (stats[actionName] || 0) + 1;
}
//Sync save for exit (SIGINT)
function saveStatsSync() {
    try {
        fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));
        console.log('Stats saved (exit)');
    } catch (error) {
        console.error('Error saving stats:', error);
    }
}
//Async for autosave
function saveStatsAsync() {
    const data = JSON.stringify(stats, null, 2);
    
    fs.writeFile(statsFilePath, data, (err) => {
        if (err) {
            console.error('Autosave error:', err);
        } else {
            console.log('Stats saved');
        }
    });
}
//Autosave
function statsAutoSave(intervalInMinutes = 30) {
    //mins to ms
    const intervalMs = intervalInMinutes * 60 * 1000;
    if (intervalMs <= 0) return;
    const timer = setInterval(() => {
        //Not saving while stats null
        if (Object.keys(stats).length > 0) {
            saveStatsAsync();
        }
    }, intervalMs);
    timer.unref();
}
//Catch terminating
process.on('exit', saveStatsSync);

process.on('SIGINT', () => {
    console.log('...catch SIGINT. Stats saving...');
    saveStatsSync();
    process.exit(0);
});
//Export
module.exports = {
    loadStats,
    incrementStat,
    statsAutoSave
};