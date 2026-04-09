const fs = require('fs');
const path = require('path');
const startServer = require('./mechs/server.js');
const startSecuredServer = require('./mechs/serverSec.js');
const saveCompleteWebsite = require('./mechs/sucker.js');
const startSysmonServer = require('./mechs/sysmon/sysmon.js');
const runner = require('./mechs/execute.js');
const { startTunnel } = require('./mechs/tunnel.js');

function parseConfigFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const serverConfigs = content.match(/\(.*?\)/g) || [];
    const usedPorts = [];
    const parsedConfigs = [];

    for (const config of serverConfigs) {
        const parts = config.slice(1, -1).split(/\s+/).filter(Boolean);

        if (parts[0] === 'monitor') {
            const port = parseInt(parts[1]);
            const password = parts[2];

            if (usedPorts.includes(port)) {
                throw new Error(`Port ${port} is already in use. Please ensure each server or monitor has a unique port.`);
            }
            usedPorts.push(port);

            parsedConfigs.push({
                type: 'monitor',
                port,
                password
            });
        } else if (parts[0] === 'sucker') {
            const link = parts[1];
            const directory = parts[2];

            parsedConfigs.push({
                type: 'sucker',
                link,
                directory
            });
        } else if (parts[0] === 'js') {
            const scriptPath = parts[1];
            parsedConfigs.push({
                type: 'js',
                scriptPath
            });
        } else {
            const port = parseInt(parts[1]);

            if (usedPorts.includes(port)) {
                throw new Error(`Port ${port} is already in use. Please ensure each server has a unique port.`);
            }
            usedPorts.push(port);

            const serverConfig = {
                type: 'server',
                path: path.resolve(parts[0]),
                port,
                password: parts.includes('-p') ? parts[parts.indexOf('-p') + 1] : null,
                tunnel: parts.includes('--tunnel')
            };
            parsedConfigs.push(serverConfig);
        }
    }

    return parsedConfigs;
}

async function maybeStartTunnel(enableTunnel, port) {
    if (!enableTunnel) {
        return;
    }

    try {
        await startTunnel(port);
    } catch (error) {
        console.error(`Unable to start Cloudflare tunnel for port ${port}: ${error.message}`);
    }
}

function displayHelp() {
    console.log(`
Usage: lollipop [OPTIONS] [COMMANDS]

Options:
  -c <config_file>   Specify the configuration file (e.g., lolli.pop).
  <directory> <port> Directly provide the directory path and port. Optionally use -p for password.
  -p <password>      Specify a password when starting a server.
  --tunnel           Automatically start a Cloudflare tunnel for the server instance.
  -h                 Display this help message.

Commands:
  monitor <port> <password>   Start the system monitor on a specified port with a password.
  sucker <websiteURL> <folderName> Scrape and save the website to a specified folder.
  js <script_path>   Execute a JavaScript script located at the specified path.

Structure of lolli.pop file:
  (monitor 5000 password)
  (sucker https://example.com myFolder)
  (js /path/to/script.js)
  (/path/to/directory1 4000 -p passwordHere --tunnel)
  (/path/to/directory2 3000 --tunnel)
  ...
    `);
}

function isValidPort(port) {
    return Number.isInteger(port) && port >= 0 && port <= 65535;
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        const folders = fs.readdirSync(process.cwd(), { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        let port = 9000;
        for (const folder of folders) {
            startServer(path.join(process.cwd(), folder), port++);
        }
        return;
    }

    if (args[0] === '-h' || args[0] === '--help') {
        displayHelp();
        return;
    }

    if (args[0] === 'sucker') {
        const websiteURL = args[1];
        const folderName = args[2];
        if (!websiteURL || !folderName) {
            console.error('You must provide a website URL and a folder name.');
            return;
        }
        saveCompleteWebsite(websiteURL, folderName);
        return;
    }

    if (args[0] === 'execute' || args[0] === 'js') {
        const scriptPath = args[1];
        if (!scriptPath) {
            console.error('You must provide a script path.');
            return;
        }
        runner.runScript(scriptPath);
        return;
    }

    if (args[0] === 'monitor') {
        const port = parseInt(args[1]);
        const password = args[2];
        if (!isValidPort(port) || !password) {
            console.error('You must provide a port and a password for the monitor.');
            return;
        }
        startSysmonServer(port, password);
        return;
    }

    try {
        if (args[0] === '-c') {
            const configFile = args[1];
            if (!configFile) {
                console.error('You must provide a config file path after -c.');
                return;
            }
            const parsedConfigs = parseConfigFile(configFile);

            for (const config of parsedConfigs) {
                if (config.type === 'js') {
                    const scriptContent = fs.readFileSync(config.scriptPath, 'utf8');
                    const result = runner.runScript(scriptContent);
                    console.log(`Execution result: ${result}`);
                }

                if (config.type === 'server') {
                    if (!isValidPort(config.port)) {
                        console.error(`Invalid port in config for ${config.path}: ${config.port}`);
                        continue;
                    }
                    if (config.password) {
                        startSecuredServer(config.path, config.port, config.password);
                    } else {
                        startServer(config.path, config.port);
                    }

                    await maybeStartTunnel(config.tunnel, config.port);
                } else if (config.type === 'monitor') {
                    if (!isValidPort(config.port)) {
                        console.error(`Invalid monitor port in config: ${config.port}`);
                        continue;
                    }
                    startSysmonServer(config.port, config.password);
                } else if (config.type === 'sucker') {
                    saveCompleteWebsite(config.link, config.directory);
                }
            }
        } else {
            const directoryPath = path.resolve(args[0]);
            const port = parseInt(args[1]);
            const passwordIndex = args.indexOf('-p');
            const tunnel = args.includes('--tunnel');
            const password = passwordIndex !== -1 ? args[passwordIndex + 1] : null;
            if (!isValidPort(port)) {
                console.error('You must provide a valid port between 0 and 65535.');
                return;
            }

            if (password) {
                startSecuredServer(directoryPath, port, password);
            } else {
                startServer(directoryPath, port);
            }

            await maybeStartTunnel(tunnel, port);
        }
    } catch (error) {
        console.error(error.message);
    }
}

main();

process.on('SIGINT', function() {
    console.log('Lollipop!');
    process.exit();
});
