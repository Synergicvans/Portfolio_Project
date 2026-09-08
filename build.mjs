import { mkdir, copyFile, readFile, access } from 'node:fs/promises';
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
for (const file of ['index.html','style.css','script.js','favicon.svg','.nojekyll']) await copyFile(path.join(root,file), path.join(root,'dist',file));
for (const file of ['user1.png','work-3.png','work-5.png','Avnish_Resume_2025.pdf']) await copyFile(path.join(root,'images',file),path.join(root,'dist','images',file));
console.log('Build complete. All local links, assets, and anchor targets validated.');
