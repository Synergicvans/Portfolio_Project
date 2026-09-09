import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import worker,{resetKnowledgeCache} from '../api/worker.mjs';
import {eligible,coverSvg} from '../scripts/sync-projects.mjs';
function database() {
  const db=new DatabaseSync(':memory:');
  for(const file of readdirSync(new URL('../api/drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')))db.exec(readFileSync(new URL(`../api/drizzle/${file}`,import.meta.url),'utf8'));
  const api={
    prepare(sql){
      const statement=db.prepare(sql);
      return {bind(...args){return {async first(){return statement.get(...args)||null;},async run(){return statement.run(...args);}};}};
    },
    async batch(items){return Promise.all(items.map(item=>item.run()));}
  };
  return api;
}
const origin='https://synergicvans.github.io';
const request=(path,body,extra={})=>new Request(`https://assistant.example${path}`,{method:'POST',headers:{'Origin':origin,'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
test('public repository filtering and XML escaping',()=>{
  const config={includeForks:true,includeArchived:false,exclude:['hidden']};
  assert.equal(eligible({name:'new',size:1},config),true);
  for(const repo of [{size:0},{size:1,private:true},{size:1,archived:true},{size:1,name:'hidden'}])assert.equal(eligible(repo,config),false);
  assert.ok(!coverSvg({name:'<script>',language:'A&B'},'code').includes('<script>'));
});
test('input, cache invalidation, limits and missing-key behavior',async t=>{
  const original=globalThis.fetch;let calls=0;
  const data={version:'v1',profile:{name:'Avnish'},projects:[{repo:'demo',title:'Demo',contentHash:'hash1',description:'Test',summary:'Test'}]};
  globalThis.fetch=async url=>{
    if(String(url).includes('knowledge.json'))return Response.json(data);
    calls++;return Response.json({choices:[{message:{content:'A concise project overview.'}}]});
  };
  t.after(()=>{globalThis.fetch=original;resetKnowledgeCache();});
  const env={DB:database(),GROQ_API_KEY:'test-only',DAILY_AI_LIMIT:'2'};
  assert.equal((await worker.fetch(request('/api/chat',{question:'Hi'},{Origin:'https://other.example'}),env)).status,403);
  assert.equal((await worker.fetch(request('/api/chat',{question:'x'.repeat(501)}),env)).status,400);
  assert.equal((await worker.fetch(request('/api/chat',{question:'x'.repeat(5000)}),env)).status,413);
  assert.equal((await worker.fetch(request('/api/summary',{repo:'unknown'}),env)).status,404);
  const first=await worker.fetch(request('/api/summary',{repo:'demo'}),env);assert.equal(first.status,200);assert.equal((await first.json()).cached,false);
  const second=await worker.fetch(request('/api/summary',{repo:'demo'}),env);assert.equal((await second.json()).cached,true);assert.equal(calls,1);
  data.projects[0].contentHash='hash2';resetKnowledgeCache();
  assert.equal((await worker.fetch(request('/api/summary',{repo:'demo'}),env)).status,200);assert.equal(calls,2);
  assert.equal((await worker.fetch(request('/api/chat',{question:'What are his skills?'}),env)).status,429);assert.equal(calls,2);
  assert.equal((await worker.fetch(request('/api/chat',{question:'Education?'}),{DB:database()})).status,503);
});
test('provider errors do not cache answers or leave locks',async t=>{
  const original=globalThis.fetch;resetKnowledgeCache();
  globalThis.fetch=async url=>String(url).includes('knowledge.json')?Response.json({version:'v',profile:{name:'Avnish'},projects:[]}):new Response('Unavailable',{status:500});
  t.after(()=>{globalThis.fetch=original;resetKnowledgeCache();});
  const env={DB:database(),GROQ_API_KEY:'test-only'};
  for(let i=0;i<2;i++) assert.equal((await worker.fetch(request('/api/chat',{question:'Skills?'}),env)).status,502);
  assert.equal((await env.DB.prepare('SELECT COUNT(*) AS n FROM answers').bind().first()).n,0);
  assert.equal((await env.DB.prepare('SELECT COUNT(*) AS n FROM locks').bind().first()).n,0);
});
