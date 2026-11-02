/** Native capabilities adapted to the shared compact, keyboard-accessible dock. */
import React from 'react';
import {Activity, Copy, Grid, HardDrive, Lightbulb, Rocket, Search, Settings, Shield, Trash2, Zap} from 'lucide-react';
import type {ScanServiceResult} from '../../shared/native-contracts';
import type {ScanServiceMeta} from './smartScan.types';
import {CompactServiceDock} from '../components/workbench/CompactServiceDock';
export interface ScanServicesProps {services:ScanServiceMeta[];results?:ScanServiceResult[];activeServiceId?:string|null;onSelectService:(service:ScanServiceMeta)=>void;onOpenCustomScan:()=>void;isArabic?:boolean;nativeAvailable?:boolean}
const ICONS:Record<string,React.ComponentType<{className?:string}>>={Activity,Copy,Grid,HardDrive,Lightbulb,Rocket,Search,Shield,Trash2,Zap};
export function scanServiceIcon(name:string){const Icon=ICONS[name]||Lightbulb;return <Icon className="w-6 h-6"/>}
export const ScanServices:React.FC<ScanServicesProps>=({services,results=[],activeServiceId=null,onSelectService,onOpenCustomScan,isArabic=false,nativeAvailable=true})=><section className="scan-services-integrated" data-testid="scan-services">
 {services.length?<CompactServiceDock selectedId={activeServiceId} onSelect={id=>{const service=services.find(s=>s.id===id);if(service)onSelectService(service)}} isArabic={isArabic} label={isArabic?'خدمات الفحص المقيسة':'Measured scan services'} items={services.map(s=>({id:s.id,label:isArabic?s.titleAr:s.titleEn,icon:scanServiceIcon(s.iconName),capability:s.state,result:results.find(r=>r.serviceId===s.id)?.status,hint:isArabic?s.noteAr:s.noteEn}))} actions={<button type="button" onClick={onOpenCustomScan} disabled={!nativeAvailable} title={isArabic?'فحص مخصص':'Custom scan'}><Settings aria-hidden="true"/><span data-testid="scan-services-count">{services.length}</span></button>}/>:<p className="scan-capability-empty" role="status">{nativeAvailable?(isArabic?'جارٍ تحميل القدرات الأصلية…':'Loading native capabilities…'):(isArabic?'الفحص غير متاح بدون جسر Electron الأصلي.':'Scanning requires the native Electron bridge.')}</p>}
</section>;
