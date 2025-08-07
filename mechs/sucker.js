const websiteScraper = require('website-scraper');

async function saveCompleteWebsite(url, directoryName) {
    const options = {
        urls: [url],
        directory: directoryName,
        recursive: false,
        subdirectories: [
            {directory: 'img', extensions: ['.jpg', '.png', '.svg', '.gif', '.webp']},
            {directory: 'js', extensions: ['.js']},
            {directory: 'css', extensions: ['.css']},
            {directory: 'fonts', extensions: ['.woff', '.woff2', '.eot', '.ttf', '.otf']}
        ],
        onResourceSaved: (resource) => {
            console.log(`Resource ${resource.url} saved!`);
        },
        onResourceError: (resource, error) => {
            console.error(`Error downloading ${resource.url}: ${error.message}`);
        }
    };

    try {
        await websiteScraper(options);
        console.log(`Website saved to ${directoryName}`);
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
    }
}

module.exports = saveCompleteWebsite;
