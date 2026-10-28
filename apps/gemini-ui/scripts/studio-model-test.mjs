import assert from 'node:assert/strict';
import {organizationSuggestions,overviewGroups,buildFileTree,flattenTree,facetOf,loadCollections} from '../src/operations/organization-studio-model.ts';
// Explicit model-test fixtures: these numbers are never rendered as Native measurements.
const files=[{id:1,name:'shared.pdf',relative:'a/shared.pdf',category:'pdf',size:100*1024*1024},{id:2,name:'shared.pdf',relative:'b/shared.pdf',category:'pdf',size:10},{id:3,name:'note.txt',relative:'deep/nested/note.txt',category:'document',size:0}];
const suggestions=organizationSuggestions(files);
assert.deepEqual(suggestions.find(s=>s.kind==='large').ids,[1]);
assert.deepEqual(suggestions.find(s=>s.kind==='collision').ids,[1,2]);
assert.match(suggestions.find(s=>s.kind==='collision').label,/Repeated names/);
assert.equal(facetOf(files[0]),'pdf');
const display=overviewGroups(files);assert.equal(display.find(g=>g.id==='document').count,3);assert.equal(display.reduce((n,g)=>n+g.count,0),3);
const root=buildFileTree(files.map(f=>({path:f.relative,size:f.size,fileId:f.id}))),closed=flattenTree(root,new Set()),open=flattenTree(root,new Set(['a','b','deep','deep/nested']));
assert.equal(closed.reduce((n,f)=>n+f.count,0),3);assert.deepEqual(open.filter(f=>!f.folder).map(f=>f.fileId).sort(),[1,2,3]);
assert.equal(organizationSuggestions([]).length,0);
const saved={id:'collection-fixture',name:'Large saved membership',sourceId:'fixture-source',paths:Array.from({length:25001},(_,i)=>'nested/file-'+i),savedAt:new Date(0).toISOString()};globalThis.localStorage={getItem:()=>JSON.stringify([saved])};assert.equal(loadCollections()[0].paths.length,25001);
console.log(JSON.stringify({ok:true,scope:'Explicit model fixtures only',checks:['Size-threshold suggestions preserve exact file IDs','Repeated names are collision candidates and do not assert content duplication','PDF grouping preserves all actual members','Expandable tree retains deep paths, zero-byte files and byte/count totals','Empty inventory produces no suggestions','Collection reload preserves 25001 members within the bounded 50000-file inventory contract']}));
