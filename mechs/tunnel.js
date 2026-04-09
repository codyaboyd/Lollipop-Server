const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn, execFileSync } = require('child_process');

const SUPPORTED_BINARIES = {
    linux: {
        x64: 'cloudflared-linux-amd64',
        arm64: 'cloudflared-linux-arm64',
        arm: 'cloudflared-linux-arm'
    },
    darwin: {
        x64: 'cloudflared-darwin-amd64.tgz',
        arm64: 'cloudflared-darwin-arm64.tgz'
    },
    win32: {
        x64: 'cloudflared-windows-amd64.exe',
        arm64: 'cloudflared-windows-arm64.exe'
    }
};

function resolveBinaryName() {
    const platform = process.platform;
    const arch = process.arch;

    const platformMap = SUPPORTED_BINARIES[platform];
    if (!platformMap || !platformMap[arch]) {
        throw new Error(`Cloudflare tunnel is not supported on platform ${platform}/${arch}.`);
    }

    return platformMap[arch];
}

function ensureDirectory(directoryPath) {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath, { recursive: true });
    }
}

function downloadFile(url, destinationPath) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, response => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                response.destroy();
                resolve(downloadFile(response.headers.location, destinationPath));
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download cloudflared binary. HTTP status: ${response.statusCode}`));
                return;
            }

            const file = fs.createWriteStream(destinationPath);
            response.pipe(file);

            file.on('finish', () => {
                file.close(() => resolve(destinationPath));
            });

            file.on('error', error => {
                fs.unlink(destinationPath, () => reject(error));
            });
        });

        request.on('error', reject);
    });
}

function extractTarball(tarballPath, outputDirectory) {
    execFileSync('tar', ['-xzf', tarballPath, '-C', outputDirectory]);
}

async function ensureCloudflaredBinary() {
    const configuredBinaryPath = process.env.LOLLIPOP_CLOUDFLARED_PATH;
    if (configuredBinaryPath && fs.existsSync(configuredBinaryPath)) {
        return configuredBinaryPath;
    }

    const binaryName = resolveBinaryName();
    const binDirectory = path.join(__dirname, '..', '.lollipop', 'bin');
    ensureDirectory(binDirectory);

    const localBinaryName = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
    const binaryPath = path.join(binDirectory, localBinaryName);

    if (fs.existsSync(binaryPath)) {
        return binaryPath;
    }

    const downloadUrl = `https://github.com/cloudflare/cloudflared/releases/latest/download/${binaryName}`;

    if (binaryName.endsWith('.tgz')) {
        const tarballPath = path.join(binDirectory, binaryName);
        await downloadFile(downloadUrl, tarballPath);
        extractTarball(tarballPath, binDirectory);
        fs.unlinkSync(tarballPath);
    } else {
        await downloadFile(downloadUrl, binaryPath);
    }

    if (!fs.existsSync(binaryPath)) {
        throw new Error('cloudflared binary was downloaded but could not be located.');
    }

    if (process.platform !== 'win32') {
        fs.chmodSync(binaryPath, 0o755);
    }

    return binaryPath;
}

async function startTunnel(port) {
    const binaryPath = await ensureCloudflaredBinary();
    const tunnelProcess = spawn(binaryPath, ['tunnel', '--url', `http://localhost:${port}`], {
        stdio: 'inherit'
    });

    tunnelProcess.on('error', error => {
        console.error(`Failed to start Cloudflare tunnel for port ${port}: ${error.message}`);
    });

    console.log(`Cloudflare tunnel started for http://localhost:${port}`);
    return tunnelProcess;
}

module.exports = {
    startTunnel
};
