// Run with NODE.JS
// CHANGE BELOW TO TEST

// Query
const Query = '1.1.1.1'
// Mode (domain, ip, geodomain, geoip)
const mode = 'geoip'

// CHANGE ABOVE TO TEST

const net = require('net');

const SOCK_PATH = '/tmp/domfind.sock';

function sendCommandToDaemon(command, mode) {
    return new Promise((resolve, reject) => {
        const client = net.createConnection(SOCK_PATH);
        let responseBuffer = '';

        client.setTimeout(15000);

        // Send command on connection
        client.on('connect', () => {
            console.log('JS: Connected to daemon');
            // Добавляем \n, так как Go ждет ReadString('\n')
            client.write(`${mode};` + command + '\n');
        });

        // Get Data (Can deliver by chunks)
        client.on('data', (chunk) => {
            responseBuffer += chunk.toString();
        });

        // If Daemon closes connection then transfer completed
        client.on('end', () => {
            console.log('JS: Disconnected');
            resolve(responseBuffer);
        });

        // Error Handler
        client.on('timeout', () => {
            console.error("NodeJS Timeout: Server took too long");
            client.destroy(); // Принудительно закрываем сокет
            reject(new Error("Timeout"));
        });

        client.on('error', (err) => {
            if (err.code === 'ENOENT') {
                reject(new Error(`Daemon not running on ${SOCK_PATH}`));
            } else {
                reject(err);
            }
        });
    });
}

// Initiate Test Command
async function main() {
    try {
        console.log('JS: Sending command...');
        let result = await sendCommandToDaemon(Query, mode);
        if (result.length < 2) {
            result = "ERR. Too short reply"
        }
        console.log('JS: Final Result ->', result);
    } catch (err) {
        console.error('JS: Error ->', err.message);
    }
}

main();
