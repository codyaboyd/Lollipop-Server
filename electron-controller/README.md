# Lollipop Electron Controller

This is an optional cross-platform desktop GUI that wraps the existing `lollipop.js` CLI.

It lets users:

- start/stop a file server,
- enable optional Basic Auth,
- enable Cloudflare tunnel with `--tunnel`, and
- start monitor mode with password.

## Requirements

- Node.js 18+
- npm

## Run locally

From the repository root:

```bash
cd electron-controller
npm install
npm start
```

## Build packaged app for your current system

From the repository root:

```bash
npm run build:electron:target
```

This build command compiles a native `lollipop` CLI binary for the host target, downloads the matching `cloudflared` binary, and packages the Electron app with both binaries embedded into `resources/bin`.

## How it works

- Development mode launches `node ../lollipop.js ...`.
- Packaged mode launches the embedded `lollipop` binary from `resources/bin`.
- Packaged mode also sets `LOLLIPOP_CLOUDFLARED_PATH` so tunnel mode uses the embedded `cloudflared` binary.
- Logs from stdout/stderr are streamed into the GUI log pane.
- Stop sends `SIGINT`, matching CLI behavior.
