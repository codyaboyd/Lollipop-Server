const express = require('express');
const path = require('path');
const si = require('systeminformation');
const { exec } = require('child_process');
const os = require('os');
// Functions to fetch system information

async function getPerCoreCPUUsage() {
    const currentLoad = await si.currentLoad();
    return currentLoad.cpus.map((cpu, idx) => ({ core: idx, usage: cpu.load.toFixed(2) }));
}

async function getRAMUsage() {
    try {
        const memData = await si.mem();
        return {
            total: (memData.total / (1024 ** 2)).toFixed(2),  // Convert bytes to MB
            used: (memData.used / (1024 ** 2)).toFixed(2)   // Convert bytes to MB
        };
    } catch (error) {
        console.error("Failed to fetch RAM data:", error);
        return {
            total: 0,
            used: 0
        };
    }
}

async function getDiskUsage() {
    const disks = await si.fsSize();
    return disks.map(d => ({
        mount: d.mount,
        total: (d.size / (1024 ** 2)).toFixed(2),
        used: (d.used / (1024 ** 2)).toFixed(2)
    }));
}

async function getAllProcesses() {
    return new Promise((resolve, reject) => {
        let command;

        switch (os.type()) {
            case 'Darwin':  // macOS
                command = 'ps aux';
                break;
            case 'Windows_NT':  // Windows
                command = 'tasklist';
                break;
            default:  // Linux and others
                command = 'ps aux --no-headers';
        }

        exec(command, (error, stdout) => {
            if (error) {
                console.error(`Couldn't execute the ${command} command.`, error);
                return resolve([]); // Return an empty array if there's an error
            }

            let processes;
            if (os.type() === 'Windows_NT') {
                // Parsing tasklist output for Windows
                processes = stdout.trim().split('\n').slice(3).map(line => {
                    const [imageName, pid, sessionName, sessionNum, memUsage] = line.split(/\s+/).filter(Boolean);
                    return { user: sessionName, pid, mem: memUsage, command: imageName };
                });
            } else {
                // Parsing ps output for Linux and macOS
                processes = stdout.trim().split('\n').map(line => {
                    const [user, pid, cpu, mem, ...rest] = line.split(/\s+/);
                    const command = rest.join(' ');
                    return { user, pid, cpu, mem, command };
                });
            }

            resolve(processes);
        });
    });
}


async function getSwapUsage() {
    try {
        const memData = await si.mem();
        return {
            total: (memData.swaptotal / (1024 ** 2)).toFixed(2),  // Convert bytes to MB
            used: (memData.swapused / (1024 ** 2)).toFixed(2)   // Convert bytes to MB
        };
    } catch (error) {
        console.error("Failed to fetch swap data:", error);
        return {
            total: 0,
            used: 0
        };
    }
}

function ensurePassword(expectedPassword) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Enter password for system monitor"');
            return res.status(401).send('Authentication required');
        }

        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
        const [username, password] = credentials.split(':');

        if (password !== expectedPassword) {
            res.setHeader('WWW-Authenticate', 'Basic realm="Enter password for system monitor"');
            return res.status(401).send('Authentication failed');
        }

        next();
    };
}


function startSysmonServer(port, password) {
    const app = express();

    // Enforce password
    app.use(ensurePassword(password));

    // Set up EJS as the view engine
    app.set('view engine', 'ejs');

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    app.get('/api/systeminfo', async (req, res) => {
        let cpuStats = await getPerCoreCPUUsage();
        let ramStats = await getRAMUsage();
        let diskStats = await getDiskUsage();
        let processList = await getAllProcesses();
        let swapUsage = await getSwapUsage();

        res.json({
            cpuStats,
            ramStats,
            diskStats,
            processList,
            swapUsage
        });
    });

    app.listen(port, () => {
        console.log(`Server started on http://localhost:${port}`);
    });
}

module.exports = startSysmonServer;
