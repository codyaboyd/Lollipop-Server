const express = require('express');
const fs = require('fs');
const path = require('path');
const getUIdeps = require('./UI.js');

const app = express();

function safeResolve(root, ...args) {
    const resolvedPath = path.resolve(root, ...args);
    if (resolvedPath.startsWith(root)) {
        return resolvedPath;
    }
    return null;
}

function randomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function generateHTML(fileElements) {
    let uideps = getUIdeps();
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><circle cx='16' cy='16' r='16' fill='red' /></svg>">
            <style>${uideps.bs5}</style>
            <title>Files</title>
        </head>
        <body>
            <div class="container mt-5">
                <div class="row">
                    ${fileElements}
                </div>
            </div>
        </body>
        </html>
    `;
}

function startServer(directoryPath, port) {
    app.use(express.static(directoryPath));

    app.get('/:path*?', (req, res) => {
        const reqPath = req.params.path ? req.params.path.split('/') : [];
        const fullPath = safeResolve(directoryPath, ...reqPath);

        if (!fullPath) {
            return res.status(403).send('Forbidden');
        }

        fs.stat(fullPath, (err, stats) => {
            if (err) {
                console.error(`Error reading path: ${err.message}`);
                return res.status(500).send('Error reading path');
            }

            if (stats.isDirectory()) {
                fs.readdir(fullPath, (err, files) => {
                    if (err) {
                        console.error(`Error reading directory: ${err.message}`);
                        return res.status(500).send('Error reading directory');
                    }

                    const fileElements = files.map(file => {
                        const itemPath = path.join(fullPath, file);
                        const isDir = fs.statSync(itemPath).isDirectory();
                        const svgIcon = isDir ?
                        `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="#ffffff" class="bi bi-folder-symlink-fill" viewBox="0 0 16 16">
  <path d="M13.81 3H9.828a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 6.172 1H2.5a2 2 0 0 0-2 2l.04.87a1.99 1.99 0 0 0-.342 1.311l.637 7A2 2 0 0 0 2.826 14h10.348a2 2 0 0 0 1.991-1.819l.637-7A2 2 0 0 0 13.81 3zM2.19 3c-.24 0-.47.042-.683.12L1.5 2.98a1 1 0 0 1 1-.98h3.672a1 1 0 0 1 .707.293L7.586 3H2.19zm9.608 5.271-3.182 1.97c-.27.166-.616-.036-.616-.372V9.1s-2.571-.3-4 2.4c.571-4.8 3.143-4.8 4-4.8v-.769c0-.336.346-.538.616-.371l3.182 1.969c.27.166.27.576 0 .742z"/>
</svg>` :
                        `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="#ffffff" class="bi bi-cloud-download-fill" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M8 0a5.53 5.53 0 0 0-3.594 1.342c-.766.66-1.321 1.52-1.464 2.383C1.266 4.095 0 5.555 0 7.318 0 9.366 1.708 11 3.781 11H7.5V5.5a.5.5 0 0 1 1 0V11h4.188C14.502 11 16 9.57 16 7.773c0-1.636-1.242-2.969-2.834-3.194C12.923 1.999 10.69 0 8 0zm-.354 15.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 14.293V11h-1v3.293l-2.146-2.147a.5.5 0 0 0-.708.708l3 3z"/>
</svg>`;
                        return `
                            <div class="col-md-3 text-center mb-4">
                                <div class="rounded-circle d-flex align-items-center justify-content-center m-auto" style="width: 100px; height: 100px; background-color: ${randomColor()};">
                                    <a href="${path.join(...reqPath, file)}" ${isDir ? '' : 'download'}>
                                        ${svgIcon}
                                    </a>
                                </div>
                                <div class="mt-2">${file}</div>
                            </div>
                        `;
                    }).join('');

                    const html = generateHTML(fileElements);
                    res.send(html);
                });
            } else {
                console.log("Downloading: " + fullPath);
                res.download(fullPath);
            }
        });
    });

    app.listen(port, () => {
        console.log(`Server started on http://localhost:${port}`);
    });
}

module.exports = startServer;
