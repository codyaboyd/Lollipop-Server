#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const electronDir = path.join(projectRoot, 'electron-controller');
const bundleBinDir = path.join(electronDir, '.bundle', 'bin');

const platformAliases = {
  win32: 'win',
  darwin: 'macos',
  linux: 'linux'
};

const cloudflaredAssets = {
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

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: options.cwd || projectRoot,
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')}`);
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function downloadFile(url, destinationPath) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.destroy();
        resolve(downloadFile(response.headers.location, destinationPath));
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Download failed with status ${response.statusCode} for ${url}`));
        return;
      }

      const file = fs.createWriteStream(destinationPath);
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', (error) => {
        fs.unlink(destinationPath, () => reject(error));
      });
    });

    request.on('error', reject);
  });
}

async function prepareCloudflared(platform, arch) {
  const assetName = cloudflaredAssets[platform] && cloudflaredAssets[platform][arch];
  if (!assetName) {
    throw new Error(`Unsupported Cloudflared target: ${platform}/${arch}`);
  }

  const downloadUrl = `https://github.com/cloudflare/cloudflared/releases/latest/download/${assetName}`;
  const downloadedPath = path.join(distDir, assetName);
  const cloudflaredName = platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
  const cloudflaredPath = path.join(bundleBinDir, cloudflaredName);

  console.log(`Downloading ${downloadUrl}`);
  await downloadFile(downloadUrl, downloadedPath);

  if (assetName.endsWith('.tgz')) {
    run('tar', ['-xzf', downloadedPath, '-C', bundleBinDir]);
    fs.unlinkSync(downloadedPath);
  } else {
    fs.copyFileSync(downloadedPath, cloudflaredPath);
  }

  if (!fs.existsSync(cloudflaredPath)) {
    throw new Error('Cloudflared binary missing after download/extract.');
  }

  if (platform !== 'win32') {
    fs.chmodSync(cloudflaredPath, 0o755);
  }
}

function prepareLollipopBinary(platform, arch) {
  const pkgPlatform = platformAliases[platform];
  if (!pkgPlatform) {
    throw new Error(`Unsupported platform for pkg: ${platform}`);
  }

  const pkgTarget = `node18-${pkgPlatform}-${arch}`;
  const lollipopName = platform === 'win32' ? 'lollipop.exe' : 'lollipop';
  const outputBinary = path.join(distDir, `lollipop-${platform}-${arch}${platform === 'win32' ? '.exe' : ''}`);

  run('node', ['./node_modules/pkg/lib-es5/bin.js', '.', '--targets', pkgTarget, '--output', outputBinary]);
  fs.copyFileSync(outputBinary, path.join(bundleBinDir, lollipopName));

  if (platform !== 'win32') {
    fs.chmodSync(path.join(bundleBinDir, lollipopName), 0o755);
  }
}

function ensureElectronDependencies() {
  if (!fs.existsSync(path.join(electronDir, 'node_modules'))) {
    run('npm', ['install'], { cwd: electronDir });
  }
}

function packageElectronApp(platform, arch) {
  const outputName = 'Lollipop Controller';
  run('npx', [
    'electron-packager',
    '.',
    outputName,
    '--platform', platform,
    '--arch', arch,
    '--out', path.relative(electronDir, distDir),
    '--overwrite',
    '--extra-resource',
    '.bundle/bin'
  ], { cwd: electronDir });
}

async function main() {
  const platform = process.platform;
  const arch = process.arch;

  ensureDir(distDir);
  ensureDir(bundleBinDir);

  for (const name of fs.readdirSync(bundleBinDir)) {
    fs.unlinkSync(path.join(bundleBinDir, name));
  }

  console.log(`Building Lollipop binary for ${platform}/${arch}`);
  prepareLollipopBinary(platform, arch);

  console.log(`Preparing Cloudflared binary for ${platform}/${arch}`);
  await prepareCloudflared(platform, arch);

  ensureElectronDependencies();

  console.log(`Packaging Electron app for ${platform}/${arch}`);
  packageElectronApp(platform, arch);

  console.log('Done. Built Electron package includes embedded lollipop and cloudflared binaries.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
