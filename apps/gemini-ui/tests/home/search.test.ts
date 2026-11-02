import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchHomeInventory,publishSearchIntent,readSearchIntent,consumeSearchIntent,type InventoryHit} from '../../src/home/search';
import type {HomeLiveState} from '../../src/home/live';
import {boundedHomeRead} from '../../src/home/native-read';

const snapshot = (ids=['one','two']) => ({sources:ids.map(id=>({id,label:id,status:'ready'})),apps:{apps:[{id:'app-a',name:'Needle App',publisher:'Test'}]},observations:{apps:{source:'test collector',observedAt:new Date().toISOString(),partial:false,stale:false}}}) as HomeLiveState;
const envelope = (sourceId:string,extra={}) => ({contractVersion:1,capability:'files.inventory.query',status:'complete',permission:'read-only',source:'test index',observedAt:new Date().toISOString(),provenance:{mode:'native'},data:{sourceId,offset:0,limit:6,total:1,rows:[{id:1,name:'needle.txt',relative:'nested/needle.txt'}]},...extra}) as any;

test('federates only existing indexes and measured apps, with stable source-qualified keys', async()=>{
 const calls:any[]=[];const result=await searchHomeInventory('needle',snapshot(),async request=>{calls.push(request);return envelope(request.sourceId);});
 assert.equal(result.hits.length,3);assert.equal(new Set(result.hits.map(h=>h.key)).size,3);
 assert.deepEqual(calls.map(c=>[c.sourceId,c.search,c.offset,c.limit]),[['one','needle',0,6],['two','needle',0,6]]);
 assert.deepEqual(result.warnings,[]);
});
test('accepts the native zero-based file ID and preserves it through handoff',async()=>{
 const result=await searchHomeInventory('needle',snapshot(['one']),async request=>envelope(request.sourceId,{data:{sourceId:request.sourceId,offset:0,limit:6,total:1,rows:[{id:0,name:'needle-zero.txt',relative:'needle-zero.txt'}]}}));
 const file=result.hits.find(hit=>hit.kind==='file');assert(file&&file.kind==='file');assert.equal(file.fileId,0);
 publishSearchIntent(file);assert.equal(readSearchIntent('file')?.kind,'file');consumeSearchIntent(file.key);
});
test('denied, fixture, wrong-source, malformed and duplicate identities fail closed per index',async()=>{
 const bad=[{permission:'not-granted'},{provenance:{mode:'fixture'}},{capability:'studio.inventory.query'},{observedAt:'invalid'},
  {data:{sourceId:'other',offset:0,limit:6,total:0,rows:[]}},
  {data:{sourceId:'bad',offset:0,limit:6,total:1,rows:[{id:1,name:'x',relative:'../escape'}]}},
  {data:{sourceId:'bad',offset:0,limit:6,total:2,rows:[{id:1,name:'x',relative:'x'},{id:1,name:'y',relative:'y'}]}}];
 for(const extra of bad){const result=await searchHomeInventory('needle',snapshot(['bad','good']),async r=>envelope(r.sourceId,r.sourceId==='bad'?extra:{}));
  assert.equal(result.hits.filter(h=>h.kind==='file').length,1);assert(result.warnings.some(w=>w.startsWith('INVALID_INDEX')));}
});
test('timeouts, empty and bounded searches stay honest; no authorization or scan exists',async()=>{
 const result=await searchHomeInventory('needle',snapshot(['slow']),()=>new Promise(()=>{}),10);
 assert(result.warnings.includes('INDEX_UNAVAILABLE'));assert.equal(result.hits.length,1);
 assert.equal((await searchHomeInventory('n',snapshot(),()=>{throw Error('must not query');})).hits.length,0);
 assert((await searchHomeInventory('needle',snapshot([]),async()=>null)).warnings.includes('NO_AUTHORIZED_INDEX'));
 let calls=0;const capped=await searchHomeInventory('needle',snapshot(['a','b','c','d','e']),async r=>{calls++;return envelope(r.sourceId);});
 assert.equal(calls,4);assert(capped.warnings.includes('SOURCE_LIMIT'));
 await assert.rejects(()=>searchHomeInventory('x'.repeat(201),snapshot()));
});
test('navigation intents are memory-only, expire, reject invalid IDs and consume once',()=>{
 const hit:InventoryHit={kind:'file',key:'file:s:1',sourceId:'s',fileId:1,label:'needle.txt',source:'Test'};
 publishSearchIntent(hit,100000);assert.equal(readSearchIntent('app',100001),null);
 assert.deepEqual(readSearchIntent('file',100001),hit);assert.deepEqual(readSearchIntent('file',100002),hit);
 assert.equal(readSearchIntent('file',130001),null);assert.equal(readSearchIntent('file',90000),null);
 consumeSearchIntent('unrelated');assert(readSearchIntent('file',100003));consumeSearchIntent(hit.key);assert.equal(readSearchIntent('file',100004),null);
 assert.throws(()=>publishSearchIntent({...hit,fileId:-1}));
});

test('a timed-out native read does not poison later manual searches of the same key',async()=>{
 await assert.rejects(()=>boundedHomeRead('search-timeout-regression',()=>new Promise(()=>{}),10),/NATIVE_READ_TIMEOUT/);
 assert.equal(await boundedHomeRead('search-timeout-regression',async()=>42,100),42);
});
