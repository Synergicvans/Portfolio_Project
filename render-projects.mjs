import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.dirname(fileURLToPath(import.meta.url));
const projects = JSON.parse(await readFile(path.join(root, 'projects.json'), 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
export const projectCards = projects.map((project, index) => {
  const url = `https://github.com/Synergicvans/${encodeURIComponent(project.repo)}`;
  return `<article class="project${project.featured ? ' project-featured' : ''}">
  <a class="project-image${project.imageFit === 'contain' ? ' image-contain' : ''}" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="View ${escape(project.title)} on GitHub">
    <img src="${escape(project.image)}" width="900" height="600" loading="lazy" decoding="async" alt="${escape(project.alt)}"><span class="image-label">${escape(project.category)}</span><span class="image-arrow" aria-hidden="true">↗</span>
  </a>
  <div class="project-body"><div class="project-meta"><span>${String(index + 1).padStart(2,'0')} / ${escape(project.category)}</span></div>
  <h3><a href="${url}" target="_blank" rel="noopener noreferrer">${escape(project.title)}</a></h3><p>${escape(project.description)}</p>
  <div class="tags">${project.tags.map(tag => `<span>${escape(tag)}</span>`).join('')}</div>
  <div class="project-links"><a href="${url}" target="_blank" rel="noopener noreferrer">View source <span aria-hidden="true">↗</span></a>${project.demo ? `<a href="${escape(project.demo)}" target="_blank" rel="noopener noreferrer">Live demo <span aria-hidden="true">↗</span></a>` : ''}</div><button class="ai-summary" type="button" data-ai-summary="${escape(project.repo)}">Ask summary with AI ↗</button></div></article>`;
}).join('\n');
const file = path.join(root,'index.html');
const html = await readFile(file,'utf8');
if (!html.includes('<!-- PROJECTS_START -->') || !html.includes('<!-- PROJECTS_END -->')) throw new Error('Project section markers are missing');
await writeFile(file, html.replace(/<!-- PROJECTS_START -->[\s\S]*?<!-- PROJECTS_END -->/, `<!-- PROJECTS_START -->\n${projectCards}\n<!-- PROJECTS_END -->`));
console.log(`Rendered ${projects.length} project cards.`);
