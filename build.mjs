import './render-projects.mjs';
import './scripts/build-knowledge.mjs';
import { mkdir, copyFile, readFile, writeFile, access, cp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
let html = await readFile(path.join(root, 'index.html'), 'utf8');
// Content-based versions keep browser assets aligned with each deployed HTML build.
for (const match of [...html.matchAll(/(?:href|src)="([^"?:]+\.(?:css|js))(?:\?v=[a-f0-9]+)?"/g)]) {
  const file=match[1];
  const version=createHash('sha256').update(await readFile(path.join(root,file))).digest('hex').slice(0,12);
  html=html.replace(match[0],match[0].replace(/="[^"]+"$/,`="${file}?v=${version}"`));
}
await writeFile(path.join(root,'index.html'),html);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if (href.startsWith('#')) { if (!ids.includes(href.slice(1))) throw new Error(`Missing anchor: ${href}`); }
  else if (!/^[a-z]+:/i.test(href)) await access(path.join(root, href.split(/[?#]/)[0]));
}
await mkdir(path.join(root, 'dist', 'images'), {recursive:true});
for (const file of ['index.html','thanks.html','style.css','enhancements.css','assistant.css','assistant.js','hero-typewriter.js','script.js','favicon.svg','.nojekyll']) await copyFile(path.join(root,file), path.join(root,'dist',file));
await mkdir(path.join(root,'dist','data'),{recursive:true});
for (const file of ['knowledge.json','assistant-config.json']) await copyFile(path.join(root,'data',file),path.join(root,'dist','data',file));
await cp(path.join(root,'images'),path.join(root,'dist','images'),{recursive:true});
await copyFile(path.join(root,'card-hover.css'),path.join(root,'dist','card-hover.css'));
console.log('Build complete. All local links, assets, and anchor targets validated.');
