import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, cpSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url), webpack = require('webpack');
const android = path.dirname(fileURLToPath(import.meta.url)), root = path.dirname(android), runtime = path.join(android, 'runtime');
const output = path.join(android, 'app', 'src', 'main', 'assets', 'business');
mkdirSync(output, { recursive: true });
cpSync(path.join(root, 'public'), output, { recursive: true });
mkdirSync(path.join(output, 'database'), { recursive: true });
cpSync(path.join(root, 'database', 'schema.sql'), path.join(output, 'database', 'schema.sql'));
const modules = { http: 'http', fs: 'fs', path: 'path', url: 'url', crypto: 'crypto', sqlite: 'sqlite', zlib: 'zlib', async_hooks: 'async-hooks' };
const compiler = webpack({
  mode: 'production', target: ['web', 'es2020'], entry: path.join(runtime, 'entry.mjs'),
  output: { path: output, filename: 'backend.js' },
  optimization: { minimize: false }, devtool: false,
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/^node:/, resource => { const name = resource.request.slice(5); if (!modules[name]) throw new Error('Missing Android adapter: ' + resource.request); resource.request = path.join(runtime, modules[name] + '.mjs'); }),
    new webpack.ProvidePlugin({ Buffer: [path.join(runtime, 'buffer.mjs'), 'Buffer'], process: [path.join(runtime, 'process.mjs'), 'default'] })
  ],
  resolve: { modules: [path.join(root, 'node_modules'), 'node_modules'] },
  performance: { hints: false }
});
await new Promise((resolve, reject) => compiler.run((error, stats) => { compiler.close(() => {}); if (error || stats.hasErrors()) reject(error || new Error(stats.toString({ all: false, errors: true, errorDetails: true }))); else { console.log(stats.toString({ all: false, assets: true, timings: true })); resolve(); } }));
let html = readFileSync(path.join(output, 'index.html'), 'utf8');
html = html.replace(/((?:src|href)=["'])\/(?!\/)/g, '$1./');
html = html.replace(/(<link[^>]+href=["'](?:\.?\/)?documents\.css["'][^>]*>)/, '$1\n<link rel="stylesheet" href="android.css">');
html = html.replace(/(<script[^>]+src=["'](?:\.?\/)?app\.js["'][^>]*>)/, '<script src="backend.js"></script>\n<script src="android.js"></script>\n<script src="android-ui.js"></script>\n$1');
if (!html.includes('src="backend.js"')) throw new Error('The Android backend was not added before the application script.');
writeFileSync(path.join(output, 'index.html'), html);
if (existsSync(path.join(android, 'android.js'))) cpSync(path.join(android, 'android.js'), path.join(output, 'android.js'));
else writeFileSync(path.join(output, 'android.js'), '// Android interface integration is supplied by the native app.\n');
for (const name of ['android.css', 'android-ui.js']) {
  const source = existsSync(path.join(android, name)) ? path.join(android, name) : path.join(root, 'public', name);
  if (existsSync(source)) cpSync(source, path.join(output, name));
  else writeFileSync(path.join(output, name), name.endsWith('.css') ? '/* Android responsive styles. */\n' : '// Android interface.\n');
}
if (existsSync(path.join(android, 'qa', 'workflows.js'))) cpSync(path.join(android, 'qa', 'workflows.js'), path.join(output, 'qa-workflows.js'));
const stylesheet = path.join(output, 'styles.css');
writeFileSync(stylesheet, readFileSync(stylesheet, 'utf8').replace(/@import\s+(?:url\([^;]+\)|["'][^"']+["'])\s*;/g, ''));
console.log('Android app assets prepared at ' + output);

