const assert = require('node:assert/strict');
const test = require('node:test');
const { extractUsefulText } = require('../mechs/sucker.js');

test('extractUsefulText removes markup and non-content elements', () => {
    const html = `<!doctype html>
        <html><head><style>.hidden { display: none }</style><script>alert('no')</script></head>
        <body><main><h1>Hello &amp; welcome</h1><p>This is <strong>useful</strong> text.</p>
        <!-- not content --><svg><text>icon label</text></svg><ul><li>First</li><li>Second</li></ul></main></body></html>`;

    assert.equal(
        extractUsefulText(html),
        'Hello & welcome\nThis is useful text.\nFirst\nSecond'
    );
});

test('extractUsefulText decodes numeric entities and normalizes whitespace', () => {
    assert.equal(extractUsefulText('<p>Price:&nbsp; &#36;10</p>\n\n<p>A&#x2014;B</p>'), 'Price: $10\nA—B');
});
