import './render-projects.mjs';
import './scripts/build-knowledge.mjs';
import { mkdir, copyFile, readFile, access, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (href.startsWith('#')) { if (!ids.includes(href.slice(1))) throw new Error(`Missing anchor: ${href}`); }
  else if (!/^[a-z]+:/i.test(href)) await access(path.join(root, href));
}
await mkdir(path.join(root, 'dist', 'images'), {recursive:true});
for (const file of ['index.html','thanks.html','style.css','enhancements.css','assistant.css','assistant.js','hero-typewriter.js','script.js','favicon.svg','.nojekyll']) await copyFile(path.join(root,file), path.join(root,'dist',file));
await mkdir(path.join(root,'dist','data'),{recursive:true});
for (const file of ['knowledge.json','assistant-config.json']) await copyFile(path.join(root,'data',file),path.join(root,'dist','data',file));
await cp(path.join(root,'images'),path.join(root,'dist','images'),{recursive:true});
await copyFile(path.join(root,'card-hover.css'),path.join(root,'dist','card-hover.css'));
console.log('Build complete. All local links, assets, and anchor targets validated.');
