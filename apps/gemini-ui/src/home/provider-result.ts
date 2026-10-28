import type {NativeEnvelope} from '../../shared/native-contracts';
/** A fulfilled IPC promise is not evidence that a measurement is available. */
export function measuredProviderData<T>(result:PromiseSettledResult<NativeEnvelope<T>|null>,label:string,errors:string[]):T|null{
 if(result.status==='rejected'){errors.push(label+': '+String(result.reason?.message||result.reason).replace(/\s+/g,' ').slice(0,180));return null;}
 const envelope=result.value;
 if(!envelope||envelope.contractVersion!==1||envelope.error||!['available','complete','partial'].includes(envelope.status)||envelope.provenance?.mode==='fixture'||envelope.provenance?.mode==='unavailable'||envelope.data==null){errors.push(label+': '+(envelope?.error?.code||envelope?.status||'Native provider unavailable'));return null;}
 if(envelope.status==='partial')errors.push(label+': partial provider coverage');
 for(const warning of envelope.warnings||[])errors.push(label+': '+warning.replace(/\s+/g,' ').slice(0,180));
 return envelope.data;
}
