// Coalesce reads across rapid Home navigation. This is an availability deadline,
// not task progress. A late provider result never becomes a fabricated metric.
const pending=new Map<string,Promise<unknown>>();
export function boundedHomeRead<T>(key:string,load:()=>Promise<T>,timeoutMs=20000):Promise<T>{
 const existing=pending.get(key);if(existing)return existing as Promise<T>;
 const result=new Promise<T>((resolve,reject)=>{
  const deadline=setTimeout(()=>reject(new Error('NATIVE_READ_TIMEOUT: '+key)),timeoutMs);
  void Promise.resolve().then(load).then(resolve,reject).finally(()=>{clearTimeout(deadline);if(pending.get(key)===result)pending.delete(key);});
 });
 pending.set(key,result);return result;
}
