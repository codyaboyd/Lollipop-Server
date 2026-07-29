const websiteScraper = require('website-scraper');
const fs = require('fs/promises');

const BLOCK_TAGS = /<\/?(?:address|article|aside|blockquote|br|div|dl|dt|dd|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)\b[^>]*>/gi;

function decodeHtmlEntities(text) {
    const namedEntities = {
        amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"'
    };

    return text.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, code) => {
        if (code[0] === '#') {
            const radix = code[1].toLowerCase() === 'x' ? 16 : 10;
            const digits = radix === 16 ? code.slice(2) : code.slice(1);
            const value = Number.parseInt(digits, radix);
            return Number.isFinite(value) && value <= 0x10ffff
                ? String.fromCodePoint(value)
                : entity;
        }

        return namedEntities[code.toLowerCase()] ?? entity;
    });
}

function extractUsefulText(html) {
    return decodeHtmlEntities(html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<(script|style|noscript|template|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
        .replace(BLOCK_TAGS, '\n')
        .replace(/<[^>]*>/g, ''))
        .replace(/\r/g, '')
        .replace(/[\t\f\v ]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{2,}/g, '\n')
        .trim();
}

async function fetchWebsiteText(url, outputFile) {
    const response = await fetch(url, {
        headers: {'user-agent': 'Lollipop-Server sucker text mode'}
    });
    if (!response.ok) {
        throw new Error(`Unable to fetch ${url}: HTTP ${response.status} ${response.statusText}`);
    }

    const text = extractUsefulText(await response.text());
    if (outputFile) {
        await fs.writeFile(outputFile, `${text}\n`, 'utf8');
        return;
    }

    process.stdout.write(`${text}\n`);
}

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
module.exports.extractUsefulText = extractUsefulText;
module.exports.fetchWebsiteText = fetchWebsiteText;
