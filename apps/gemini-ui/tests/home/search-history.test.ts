import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SEARCH_HISTORY_KEY, readSearchHistory, pushSearchHistory, clearSearchHistory} from '../../src/home/search-history';

function memory() {
  const data = new Map<string,string>();
  return {getItem:(key:string)=>data.get(key)??null, setItem:(key:string,value:string)=>{data.set(key,value);}, removeItem:(key:string)=>{data.delete(key);}};
}

test('history survives reads, deduplicates, caps at eight and really clears',()=>{
  const store=memory();
  for(let i=0;i<10;i++)pushSearchHistory(`query ${i}`,store);
  assert.equal(readSearchHistory(store).length,8);
  assert.equal(pushSearchHistory('QUERY 9',store)[0].query,'QUERY 9');
  assert.equal(readSearchHistory(store).filter(e=>e.query.toLowerCase()==='query 9').length,1);
  clearSearchHistory(store);
  assert.equal(store.getItem(SEARCH_HISTORY_KEY),null);
  assert.deepEqual(readSearchHistory(store),[]);
});

test('corrupt storage and invalid persisted queries cannot become history',()=>{
  const store=memory();
  store.setItem(SEARCH_HISTORY_KEY,'{'); assert.deepEqual(readSearchHistory(store),[]);
  const at=new Date().toISOString();
  store.setItem(SEARCH_HISTORY_KEY,JSON.stringify([{query:'',at},{query:'bad\u0000query',at},{query:'ok',at},{query:'too old',at:'invalid'}]));
  assert.deepEqual(readSearchHistory(store),[{query:'ok',at}]);
  assert.equal(pushSearchHistory('  spaced\nquery  ',store)[0].query,'spaced query');
});

test('blocked localStorage getter and failed writes never prevent Home loading',()=>{
  Object.defineProperty(globalThis,'window',{configurable:true,value:Object.defineProperty({},'localStorage',{get(){throw Error('denied');}})});
  try { assert.deepEqual(readSearchHistory(),[]); assert.deepEqual(pushSearchHistory('query'),[]); assert.doesNotThrow(()=>clearSearchHistory()); }
  finally { Reflect.deleteProperty(globalThis,'window'); }
  const denied={getItem(){throw Error('denied');},setItem(){throw Error('full');},removeItem(){throw Error('denied');}};
  assert.deepEqual(readSearchHistory(denied),[]);
  assert.doesNotThrow(()=>pushSearchHistory('query',denied));
  assert.doesNotThrow(()=>clearSearchHistory(denied));
});
