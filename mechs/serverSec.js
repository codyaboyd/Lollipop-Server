const express = require('express');
const fs = require('fs');
const path = require('path');

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
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><circle cx='16' cy='16' r='16' fill='red' /></svg>">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
            <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-icons/1.7.2/font/bootstrap-icons.min.css" rel="stylesheet">
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

function startSecuredServer(directoryPath, port, password) {
    app.use((req, res, next) => {
        const auth = req.headers.authorization;

        if (!auth) {
            res.set('WWW-Authenticate', 'Basic realm="Authorization Required"');
            return res.status(401).send('Authorization Required');
        } else {
            const [username, providedPassword] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');

            if (providedPassword === password) {
                next();
            } else {
                return res.status(403).send('Forbidden');
            }
        }
    });

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
                        return `
                            <div class="col-md-3 text-center mb-4">
                                <div class="rounded-circle d-flex align-items-center justify-content-center m-auto" style="width: 100px; height: 100px; background-color: ${randomColor()};">
                                    <a href="${path.join(...reqPath, file)}" ${isDir ? '' : 'download'}>
                                        <i style="font-size: xx-large;" class="bi bi-${isDir ? 'folder-fill' : 'download'} text-white"></i>
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
        console.log(`Secured server started on http://localhost:${port}`);
    });
}

module.exports = startSecuredServer;
