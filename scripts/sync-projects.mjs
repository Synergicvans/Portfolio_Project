import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function eligible(repo, config) {
  return !repo.private && repo.size > 0 && (config.includeForks || !repo.fork) &&
    (config.includeArchived || !repo.archived) && !config.exclude.includes(repo.name);
}
export function category(repo) {
  const text = `${repo.name} ${repo.description || ''} ${(repo.topics || []).join(' ')}`.toLowerCase();
  if (/machine.learning|recognition|\bai\b|copilot|summari|llm/.test(text)) return ['AI application','ai'];
  if (/analysis|analytics|data|sql/.test(text)) return ['Data analysis','data'];
  if (/flutter|mobile|react.native|dart/.test(text) || repo.language === 'Dart') return ['Mobile application','mobile'];
  return ['Software project','code'];
}
const escape = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function coverSvg(repo, label) {
  const title = repo.name.replace(/[-_]+/g,' ').slice(0,36);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600"><rect width="900" height="600" fill="#142018"/><g fill="#eaf3df" font-family="Arial,sans-serif"><text x="65" y="130" font-size="22" fill="#d5f675">${escape(label.toUpperCase())}</text><text x="65" y="255" font-size="34">${escape(title)}</text><path d="M65 310H835" stroke="#657d4a"/><rect x="65" y="365" width="210" height="70" rx="12" fill="#304126"/><text x="90" y="410" font-size="24">${escape(repo.language || 'Source code')}</text><text x="65" y="515" font-size="20" fill="#b6c5aa">Source · Documentation · Project</text></g></svg>`;
}
async function github(route, {optional=false, raw=false}={}) {
  const headers = {'Accept':raw ? 'application/vnd.github.raw+json':'application/vnd.github+json','User-Agent':'Avnish-Portfolio-Sync'};
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`https://api.github.com${route}`, {headers,signal:AbortSignal.timeout(20000)});
  if (optional && (response.status === 404 || response.status === 409)) return null;
  if (!response.ok) throw new Error(`GitHub ${response.status} for ${route.split('?')[0]}`);
  return raw ? response.text() : response.json();
}
async function saveCover(repo, config) {
  const base = `/repos/${config.owner}/${repo.name}`;
  const files = await github(`${base}/contents`,{optional:true});
  if (!Array.isArray(files)) return null;
  let candidate = config.coverNames.map(name=>files.find(file=>file.name===name)).find(Boolean);
  // A local README image is accepted only from this repository. No arbitrary remote downloads.
  if (!candidate) {
    const readme = await github(`${base}/readme`,{optional:true});
    const text = readme?.content ? Buffer.from(readme.content,'base64').toString('utf8') : '';
    const match = text.match(/!\[[^\]]*\]\(([^\s)]+\.(?:png|jpe?g|webp))\)/i);
    if (match && !match[1].includes('..') && !/^[a-z]+:|^\//i.test(match[1])) {
      candidate = await github(`${base}/contents/${match[1].split('/').map(encodeURIComponent).join('/')}`,{optional:true});
    }
  }
  if (!candidate || candidate.size > config.maxImageBytes || candidate.type !== 'file') return null;
  const file = await github(`${base}/contents/${candidate.path.split('/').map(encodeURIComponent).join('/')}`);
  const bytes = Buffer.from(file.content || '', 'base64');
  // Check image signatures rather than trusting a repository filename or content type.
  const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  const webp = bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP';
  if (!bytes.length || bytes.length > config.maxImageBytes || !(png||jpg||webp)) return null;
  const destination = `images/projects/auto-${repo.id}.${png?'png':jpg?'jpg':'webp'}`;
  await writeFile(path.join(root,destination),bytes);
  return destination;
}
export async function sync() {
  const config = JSON.parse(await readFile(path.join(root,'sync.config.json'),'utf8'));
  const existing = JSON.parse(await readFile(path.join(root,'projects.json'),'utf8'));
  const all = [];
  for (let page=1;page<=100;page++) {
    const batch = await github(`/users/${config.owner}/repos?per_page=100&page=${page}&sort=created&direction=desc`);
    all.push(...batch);
    if (batch.length<100) break;
    if(page===100) throw new Error('Repository pagination exceeded safety bound');
  }
  await mkdir(path.join(root,'images/projects'),{recursive:true});
  await mkdir(path.join(root,'data'),{recursive:true});
  const candidates = all.filter(repo=>eligible(repo,config));
  const visible = new Set(candidates.map(repo=>repo.name));
  const projects = existing.filter(project=>visible.has(project.repo));
  const known = new Set(projects.map(project=>project.repo));
  for(const repo of candidates) {
    if(known.has(repo.name)) continue;
    const tree = await github(`/repos/${config.owner}/${repo.name}/git/trees/${encodeURIComponent(repo.default_branch)}?recursive=1`,{optional:true});
    if(!tree?.tree?.some(file=>file.type==='blob' && !/(^|\/)(readme[^/]*|license[^/]*|\.gitignore)$/i.test(file.path))) continue;
    const [label] = category(repo);
    let image = await saveCover(repo,config);
    if(!image) {
      image=`images/projects/auto-${repo.id}.svg`;
      await writeFile(path.join(root,image),coverSvg(repo,label));
    }
    const project={repo:repo.name,title:repo.name.replace(/[-_]+/g,' '),category:label,tags:[repo.language||'Source code'],description:repo.description?.trim().slice(0,350)||`Explore the source and documentation for ${repo.name.replace(/[-_]+/g,' ')}.`,image,alt:`${repo.name.replace(/[-_]+/g,' ')} project cover`,autoAdded:true};
    // Demo URLs are curated in projects.json; repository metadata never triggers arbitrary requests.
    projects.push(project);
  }
  // Don't replace curated titles, descriptions, or images on subsequent runs.
  const metadata = {schemaVersion:1,projects:{}};
  for(const project of projects) {
    const repo=candidates.find(repo=>repo.name===project.repo);
    const readme = await github(`/repos/${config.owner}/${project.repo}/readme`,{optional:true});
    const readmeText=readme?.content ? Buffer.from(readme.content,'base64').toString('utf8').replace(/<[^>]*>/g,'').slice(0,9000) : '';
    const source={title:project.title,description:project.description,tags:project.tags,readme:readmeText};
    metadata.projects[project.repo]={contentHash:digest(source),readmeSha:readme?.sha||null,readme:readmeText,summary:project.description,summarySource:'portfolio',sourceUrl:repo.html_url};
  }
  // Complete API reads first; partial failures must not wipe the published catalogue.
  await writeFile(path.join(root,'projects.json'),JSON.stringify(projects,null,2)+'\n');
  await writeFile(path.join(root,'data/project-metadata.json'),JSON.stringify(metadata,null,2)+'\n');
  console.log(`Synced ${projects.length} public projects; ${projects.filter(p=>!known.has(p.repo)).length} added.`);
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) await sync();
