import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import lighthouse from 'lighthouse';
import { launch as launchChrome } from 'chrome-launcher';

const port = Number(process.env.LIGHTHOUSE_PORT || 4174);
const outputPath = 'docs/lighthouse-local.html';
const root = resolve('.');
const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json'
};

const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const filePath = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
    }
    if (!existsSync(filePath)) {
        response.writeHead(404).end('Not found');
        return;
    }
    response.setHeader('Content-Type', contentTypes[extname(filePath)] || 'application/octet-stream');
    createReadStream(filePath).pipe(response);
});

await mkdir('docs', { recursive: true });
await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolveListen);
});
const chrome = await launchChrome({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
});
try {
    const { lhr, report } = await lighthouse(`http://127.0.0.1:${port}/`, {
        port: chrome.port,
        output: 'html',
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1, disabled: false },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    });
    await writeFile(outputPath, report);
    console.log(`Mobile Lighthouse report: ${outputPath}`);
    console.log(Object.fromEntries(Object.entries(lhr.categories).map(([name, category]) => [name, category.score])));
} finally {
    await chrome.kill();
    server.close();
}
