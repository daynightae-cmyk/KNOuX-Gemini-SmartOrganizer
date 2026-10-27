import type {NativeEnvelope} from './native-contracts';
import type {OrganizationPlan,OperationReceipt,UndoPreview} from './operation-contract';
export type SpaceNode={id:string;name:string;relative:string;sizeBytes:number;files:number;children:SpaceNode[]};
export type DuplicateGroup={digest:string;size:number;count:number;wastedBytes:number;files:{id:number;name:string;relative:string;size:number}[]};
export type StorageLiveScan={source:{id:string;path:string};scannedAt:string;ageDays:number;analysis:{totals:{files:number;bytes:number;folders:number};coverage:{partial:boolean;warnings:string[];scope:string;coversWholeVolume:boolean};tree:SpaceNode;folders:SpaceNode[];largest:{id:number;name:string;relative:string;size:number}[];categories:{key:string;count:number;bytes:number}[]};duplicates:{groups:DuplicateGroup[];summary:{filesHashed:number;bytesHashed:number;budgetReached:boolean};warnings:string[]};tempCandidates:{id:number;name:string;relative:string;size:number;reason:string;risk:string}[]};
export type VaultPlan=OrganizationPlan&{approvalContext:{kind:'cleanup-quarantine-v1';estimatedSavings:number;risk:string;keepers:{keeperId:number;digest:string;relative:string}[]}};
export type VaultReceipt=OperationReceipt&{estimatedSavings:number;verifiedQuarantinedBytes:number;verifiedReclaimedBytes:number;restoredBytes:number};
export type VaultRestorePreview=UndoPreview&{conflicts:number;sourceRoots:string[];vaultRoots:string[]};
export type VaultReport={generatedAt:string;integrityHash:string;receipts:VaultReceipt[];estimatedSavings:number;verifiedQuarantinedBytes:number;verifiedReclaimedBytes:number;restoredBytes:number;spaceExplanation:string};
export type VaultSelections={digest:string;keeperId:number;candidateIds:number[]}[];
export interface StorageVaultApi {
 storageScan(request:{sourceId:string;ageDays:number}):Promise<NativeEnvelope<StorageLiveScan>>;
 vaultPlan(request:{sourceId:string;destinationId:string;selections:VaultSelections;tempIds:number[]}):Promise<NativeEnvelope<VaultPlan>>;
 vaultExecute(request:{planId:string;planHash:string;approved:boolean}):Promise<NativeEnvelope<{receipt:VaultReceipt}>>;
 vaultList():Promise<NativeEnvelope<VaultReceipt[]>>;
 vaultRestorePreview(request:{journalId:string}):Promise<NativeEnvelope<VaultRestorePreview>>;
 vaultRestore(request:{journalId:string;previewId:string;previewHash:string;approved:boolean}):Promise<NativeEnvelope<{receipt:VaultReceipt}>>;
 vaultReport():Promise<NativeEnvelope<VaultReport>>;
}
