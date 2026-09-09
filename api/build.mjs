import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir(new URL('./dist/server/',import.meta.url),{recursive:true});
await copyFile(new URL('./worker.mjs',import.meta.url),new URL('./dist/server/index.js',import.meta.url));
await mkdir(new URL('./dist/.openai/',import.meta.url),{recursive:true});
await copyFile(new URL('./.openai/hosting.json',import.meta.url),new URL('./dist/.openai/hosting.json',import.meta.url));
await cp(new URL('./drizzle/',import.meta.url),new URL('./dist/.openai/drizzle/',import.meta.url),{recursive:true});
console.log('Built portable Cloudflare Worker.');
