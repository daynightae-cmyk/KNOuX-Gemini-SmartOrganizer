import type {NativeEnvelope} from './native-contracts';
import type {StorageVaultApi} from './storage-vault-contract';
export type OperationFile={id:number;name:string;relative:string;category:string;size:number};
export type OperationEvent={opId:string;serviceId:string;sourceMode:string;sequence:number;phase:string;timestamp:string;completed?:number;total?:number;file?:OperationFile;categories?:Record<string,number>;currentName?:string;receiptId?:string;errors?:{code:string;message:string}[]};
export type OrganizationPlan={planId:string;planHash:string;operation:'move'|'copy';structure:string;collisionPolicy:string;destinationSummary:string;executable:boolean;expiresAt:string;totals:{files:number;bytes:number;collisions:number;skipped:number};files:{index:number;fileId:number;name:string;sourceRoot:string;sourceRelative:string;targetPath:string;targetRelative:string;status:string;category:string;size:number}[];collisions:unknown[];skipped:unknown[];warnings:string[]};
export type OperationReceipt={operationId:string;planHash:string;status:string;mode:string;completedFiles:number;failedFiles:number;undoAvailable:boolean;undoCompletedFiles:number;entries:{index:number;name:string;state:string;sourceRelative:string;targetRelative:string;verification?:unknown;hash?:string;error?:string;undo?:{state:string}}[]};
export type UndoPreview={journalId:string;previewId:string;previewHash:string;eligible:number;requiredRoots:{root:string;kind:string}[];entries:{name:string;eligible:boolean;reason?:string;conflict?:boolean;restoreName?:string}[]};
export type OperationApi=StorageVaultApi & {
 contractVersion:1;
 chooseSource():Promise<NativeEnvelope<{id:string;path:string}|null>>;
 chooseDestination():Promise<NativeEnvelope<{id:string;path:string}|null>>;
 scan(request:{sourceId:string}):Promise<NativeEnvelope<{files:OperationFile[];summary:{partial:boolean;warnings:string[]}}>>;
 plan(request:{sourceId:string;destinationId:string;fileIds?:number[];operation:'move'|'copy';structure:'categorized'|'flat';collisionPolicy:'review'|'rename'|'skip';categoryFolderNames:Record<string,string>}):Promise<NativeEnvelope<OrganizationPlan>>;
 execute(request:{planId:string;planHash:string;approved:boolean}):Promise<NativeEnvelope<{receipt:OperationReceipt}>>;
 cancel():Promise<NativeEnvelope<unknown>>;
 revoke():Promise<NativeEnvelope<unknown>>;
 history():Promise<NativeEnvelope<OperationReceipt[]>>;
 undoPreview(request:{journalId:string}):Promise<NativeEnvelope<UndoPreview>>;
 undo(request:{journalId:string;previewId:string;previewHash:string;approved:boolean;resolution:'skip'|'rename'}):Promise<NativeEnvelope<{receipt:OperationReceipt}>>;
 onEvent(callback:(event:OperationEvent)=>void):()=>void;
};
declare global {interface Window {knouxOperationsV1?:OperationApi;}}
