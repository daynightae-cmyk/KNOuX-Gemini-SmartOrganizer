'use strict';
/* KNOuX mission registry compiler — add-only. Never modifies existing product source,
   existing references, the canonical 181 service specs, git history or remote branches. */
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const repo=path.resolve(__dirname,'../../..');
const pack=path.resolve(__dirname,'..');
const old=path.join(repo,'missions','UNIFIED_FULL_DOMAIN_EXECUTION_20261028','DOMAINS');
const refs=path.join(repo,'missions','VISUAL_REDESIGN_DAY_NIGHT_20261027','references');
const downloads='C:\\Users\\day night\\Downloads';
const nl='\n',tick=String.fromCharCode(96);
const quoted=s=>tick+s+tick;
const exists=p=>fs.existsSync(p);
const safeRead=p=>fs.readFileSync(p,'utf8');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const rpath=p=>path.relative(repo,p).replace(/\\/g,'/');
const mk=p=>fs.mkdirSync(p,{recursive:true});
const write=(p,s)=>{mk(path.dirname(p));fs.writeFileSync(p,s,'utf8');};
const domainFolder=path.join(pack,'screens'),imageFolder=path.join(pack,'REFERENCE_IMAGES_UNIQUE');
mk(domainFolder);mk(imageFolder);
const screens=[
 {n:'01',key:'ORGANIZATION_STUDIO',name:'Organization Studio',prompt:'01_organization_studio_V0_EXECUTE.md',domain:'03_ORGANIZATION_STUDIO_FULL_DOMAIN.md',route:'studio',day:'KNOuX Organization Studio Dashboard.png',night:'01_organization-studio.png',entry:'src/studio/StudioPage.tsx | src/operations/OrganizationLiveWorkbench.tsx',orbit:'Documents / Images / Videos / Archives / Code / Duplicates',task:'Source selection; metadata inventory and file classification; genuine visual library; collections; rule-builder with exclusions; destinations; exact before/after plan; native consented execute; history and verified Undo.',backend:'Reuse knouxOperationsV1, existing move/copy/plan/hash-bound journals. Add safe collision policy, symlink and junction guards, locked-file handling, partial failure, safe preview thumbnails and virtualization for 10,000+ files.',connect:'Files shares metadata and search; Storage shares capacity; Cleanup must own deletion/quarantine; do not duplicate file execution engines.',dayInstalled:'01_organization-studio.png'},
 {n:'02',key:'STORAGE_ATLAS',name:'Storage Atlas',prompt:'02_storage_atlas_V0_EXECUTE.md',domain:'07_STORAGE_FULL_DOMAIN.md',route:'storage',day:'KNOuX Smart Storage Atlas Dashboard.png',night:'05_storage.png',entry:'src/pages/StoragePage.tsx | src/storage.css',orbit:'Drives / Used Space / Free Space / Treemap / Largest Folders / Reclaim',task:'Windows volume selection; capacity and free space; source-backed volume inventory; navigable treemap; largest-folder breakdown; reclaim opportunities; review-based Cleanup handoff.',backend:'Reuse volume and scan providers, handle hardlinks, sparse files, junctions, drive disconnects, permission errors; distinguish actual disk bytes from estimated reclaim.',connect:'Cleanup consumes reclaim candidates; Files opens authorized paths; System supplies separate I/O telemetry.',dayInstalled:'05_storage.png'},
 {n:'03',key:'STARTUP_CONTROL',name:'Startup Control',prompt:'03_startup_control_V0_EXECUTE.md',domain:'09_STARTUP_FULL_DOMAIN.md',route:'startup',day:'KNOuX SmartOrganizer Startup Dashboard.png',night:'07_startup.png',entry:'src/pages/StartupPage.tsx | src/startup.css',orbit:'High Impact / Medium Impact / Low Impact / Disabled / Timeline / Recommendations',task:'Native autorun inventory; exact publisher and source; impact classification with evidence; search/sort/filter; detail inspection; reversible approved enable-disable and delay plans; verified history.',backend:'Read known Windows startup sources with user/system permission distinctions; no fake boot estimates or silent Registry/Task Scheduler mutation.',connect:'Applications supplies software identity, System supplies boot sources and Automation only receives approved plans.',dayInstalled:'07_startup.png'},
 {n:'04',key:'SYSTEM_PERFORMANCE',name:'System Performance',prompt:'04_system_performance_V0_EXECUTE.md',domain:'10_SYSTEM_FULL_DOMAIN.md',route:'system',day:'KNOuX System Performance Dashboard.png',night:'08_system.png',entry:'src/pages/SystemPage.tsx | src/system/useSystem.ts | src/system/SystemServiceWorkspaces.tsx',orbit:'CPU / Memory / Stability / Disk / Temperature / Network',task:'Measure sampled native telemetry with timestamp/unit/source; resource chart and process register; selected process inspector; Windows events; driver signatures; hardware and network coverage; read-only drilldown.',backend:'Existing systemSnapshot and SystemBridge should be audited, not recreated. Null unavailable sensors, cancel polling on unmount, real timeseries only, reject fake health.',connect:'Applications/Services/Repair/Storage receive typed read-only service handoffs, never privileged shortcuts.',dayInstalled:'08_system.png'},
 {n:'05',key:'SERVICE_COMMANDER',name:'Service Commander',prompt:'05_service_commander_V0_EXECUTE.md',domain:'12_SERVICES_FULL_DOMAIN.md',route:'services',day:'KNOuX Service Commander Dashboard.png',night:'10_services.png',entry:'src/pages/ServicesPage.tsx | src/services.css',orbit:'Running / Stopped / Recovery / Startup Type / Events / Dependencies',task:'SCM inventory; status/startup type/dependency graph; service details; event history; safe plan for start/stop/restart/change; explicit admin approval; verified postcondition.',backend:'Never stop protected Windows services in regular tests; distinguish display name and service key, verify impact on dependent services, no shell bridge.',connect:'System contributes event evidence; Startup and Repair can link to services without duplicating SCM controller.',dayInstalled:'10_services.png'},
 {n:'06',key:'RECOVERY_REPAIR',name:'Recovery & Repair Lab',prompt:'06_recovery_repair_V0_EXECUTE.md',domain:'11_REPAIR_FULL_DOMAIN.md',route:'repair',day:'KNOuX Recovery & Repair Dashboard.png',night:'09_repair.png',entry:'src/pages/RepairPage.tsx | src/repair.css',orbit:'SFC / DISM / CHKDSK / Repair Logs / Network Reset / Restore Point',task:'Diagnose with read-only evidence; select issue; preview operation permissions/reboot/risk; render allowlisted plan; approve privileged repair ONLY if real executor; parse Windows results; verify receipt.',backend:'SFC/DISM/CHKDSK/network/restore plans must be narrowly validated, deny arbitrary shell, mark unimplemented native calls explicitly and never claim fixed issues from demo.',connect:'System supplies measured logs, Services/Startup own their settings; Repair is the approved diagnostic orchestrator.',dayInstalled:'09_repair.png'},
 {n:'07',key:'AUTOMATION_STUDIO',name:'Automation Studio',prompt:'07_automation_studio_V0_EXECUTE.md',domain:'13_AUTOMATION_FULL_DOMAIN.md',route:'automation',day:'Pastel Purple Automation Studio Dashboard.png',night:'08_AUTOMATION_NIGHT_1672x941.png',entry:'src/pages/AutomationPage.tsx | src/automation/useAutomation.ts | src/automation/AutomationServiceWorkspaces.tsx',orbit:'Triggers / Schedules / Actions / Safety / History / Conditions',task:'Editable typed graph canvas, node palette and port validation; persistent drafts; recurrence/DST preview; dry-run journal; notification and quiet-hours policies; templates/import/export; recovery plan.',backend:'Reuse existing automation.capabilities/start/status/cancel/snapshot/workflows/save/templates/dryRun/schedulePreview/validateImport/journal/report already wired in preload/Main. Local draft or dry-run is NOT Windows execution.',connect:'Automation may orchestrate only authenticated, consented and exact safe operations of other domains. No arbitrary shell or fake task run.',dayInstalled:null},
 {n:'08',key:'GOOGLE_WORKSPACE',name:'Google Workspace',prompt:'08_google_workspace_V0_EXECUTE.md',domain:'04_GOOGLE_WORKSPACE_FULL_DOMAIN.md',route:'workspace',day:'KNOuX Google Workspace Dashboard.png',night:null,entry:'src/components/workspace/GoogleWorkspaceHub.tsx',orbit:'Drive / Gmail / Sheets / Calendar / Tasks / Connections',task:'Account connection and switcher, OAuth scopes and consent, Drive/Sheets/Gmail/Calendar/Tasks service tabs, file/resource browser, rate-limit/quota, selected item permissions inspector.',backend:'Current confirmed support includes limited Sheets read-only only where consented. Other APIs must be independently verified; no fake connected account/email/Drive listings or token exposure.',connect:'AI provider scopes are separate from Google scopes; Files cannot access cloud items without official API and granted account.',dayInstalled:null},
 {n:'09',key:'SETTINGS_AI_ASSISTANT',name:'Settings & AI Assistant',prompt:'09_settings_ai_V0_EXECUTE.md',domain:'14_SETTINGS_ASSISTANT_FULL_DOMAIN.md',route:'settings',day:'KNOuX SmartOrganizer Settings Dashboard.png',night:null,entry:'src/pages/SettingsPage.tsx | src/components/chat/KNOuXAssistantChat.tsx | src/components/chat/ApiKeySetupModal.tsx',orbit:'Appearance / Language / Accessibility / AI Providers / Privacy / Engine',task:'DAY/NIGHT with identical geometry, global accent/density/accessibility settings, Arabic RTL, reduced motion; real saved preferences; provider selection, permissions, usage and AI assistant interface.',backend:'Session-safe or native protected credentials, no localStorage secrets, deny-by-default AI tools and no fabricated connected model/usage/events.',connect:'One theme token source applies Home and every domain; assistant has only typed and explicitly authorized cross-domain tools.',dayInstalled:null},
 {n:'10',key:'FILES_INSTANT_SEARCH',name:'Files & Instant Search',prompt:'10_files_V0_EXECUTE.md',domain:'06_FILES_FULL_DOMAIN.md',route:'files',day:'KNOuX SmartOrganizer File Explorer (1).png',night:'02_files-instant-search.png',entry:'src/pages/FilesPage.tsx | src/files.css | src/visual/files-reference.css',orbit:'Recent / Large Files / Categories / Duplicates / Locations / Tags',task:'Authorize roots; build/reuse fast local index; instant typed search, facets, browse, metadata and preview; verified duplicate group hash inspector; safe file action handoff.',backend:'Source-backed index, bounded pagination and keyboard virtualization, cancellation; duplicate grouping by bytes+hash and optional byte compare; no invented document preview.',connect:'Organization owns classification actions; Cleanup owns safe file deletion; Storage owns capacity and treemap.',dayInstalled:'02_files-instant-search.png'},
 {n:'11',key:'SMART_SCAN',name:'Smart Scan',prompt:'11_smart_scan_V0_EXECUTE.md',domain:'02_SMART_SCAN_FULL_DOMAIN.md',route:'smart_scan',day:'KNOuX Smart Scan Dashboard (2).png',night:'03_smart-scan.png',entry:'src/pages/SmartScanPage.tsx | src/visual/scan-reference.css',orbit:'Deep Scan / Quick Scan / System Health / Privacy / Apps / Startup',task:'Select six bounded service scopes; read-only native scan; genuine progress/cancel; findings tabs, severity and details; dedup proof; authorized handoff to Cleanup/System/Startup/Apps.',backend:'Never label synthetic client animation as scan completion; preserve permission and source/time evidence; do not expose user secrets under privacy scanning.',connect:'Scan only discovers findings; effects remain in owning specialized domains.',dayInstalled:'03_smart-scan.png'},
 {n:'12',key:'APPLICATIONS_MANAGER',name:'Applications Manager',prompt:'12_applications_manager_V0_EXECUTE.md',domain:'05_APPLICATIONS_FULL_DOMAIN.md',route:'applications',day:'KNOuX Applications Management Dashboard (1).png',night:'04_applications.png',entry:'src/pages/ApplicationsPage.tsx | src/applications.css',orbit:'Installed Apps / Updates / App Health / Permissions / Disk Usage / Startup Apps',task:'Signed Windows installed-app inventory, separate publisher/signature verification; installed size/source; query-only update discovery; app inspector, startup impacts, uninstall plan and authorized native receipt.',backend:'Reuse existing appsInventory and other apps.* contracts, not a competing inventory service. No blind uninstall/repair commands; signed publisher proof and write consent must be verified.',connect:'Startup owns startup action plans; Files only reveals original install paths; Repair owns repair.',dayInstalled:'04_applications.png'},
 {n:'13',key:'CLEANUP_SAFETY_VAULT',name:'Cleanup Safety Vault',prompt:'13_smart_cleanup_V0_EXECUTE.md',domain:'08_CLEANUP_FULL_DOMAIN.md',route:'cleanup',day:null,night:'06_cleanup.png',entry:'src/pages/CleanupPage.tsx | src/operations/StorageCleanupLiveWorkbench.tsx',orbit:'KEEP EXACT SIX FROM EXISTING APPROVED CLEANUP REFERENCE',task:'Source-verified cleanup inventory, safe exclusions, category review, immutable plan, protected path checks, optional vault/quarantine, explicit authorization, postcondition and verified restore/Undo.',backend:'Reuse existing Cleanup/Vault bridge. No silent delete or absolute safe-to-remove claims without policy and proof; handle locks, symlinks, conflicts and partial failures.',connect:'Storage/Smart Scan supply candidate evidence; Files owns duplicate hashes; do not fork deletion system.',dayInstalled:'06_cleanup.png'},
 {n:'14',key:'HOME_COMMAND_CENTER',name:'Home Command Center',prompt:'14_home_V0_EXECUTE.md',domain:'01_HOME_COMMAND_CENTER_FULL_DOMAIN.md',route:'home',day:'KNOuX SmartOrganizer Dashboard (1).png',night:null,entry:'src/pages/HomePage.tsx | src/components/home/HomeOrbit.tsx | src/home-command-center.css',orbit:'Smart Scan / Files / Applications / System / Storage / Automation',task:'Unchanged Home hero, exact orbit coordinates, 4 KPI boxes, Quick Access six cards, Recent Findings, Automation Overview, System Insights, right System Health, Storage, Assistant, Activity; real navigation and Ctrl+K.',backend:'Aggregate truthfully available provider snapshots with timestamp and capability, no fictional KPI. Reuse shared KnouxOrbit and existing navigation without rebuilding shell.',connect:'Home is a read-only orchestration surface, not a new native engine.',dayInstalled:'00_home-command-center.png'},
 {n:'15',key:'CINEMATIC_SPLASH',name:'Cinematic Splash / Intro',prompt:'15_cinematic_splash_V0_EXECUTE.md',domain:null,route:'cinematic-entry',day:'01-splash.png',night:'06_11_03_splash_night',entry:'src/features/cinematic-entry/CinematicEntry.tsx',orbit:'NO six-node utility orbit: cinematic original KNOuX glass sphere',task:'Cinematic starfield and light rays -> particle assembly of original violet 3D logo -> large slow glass sphere entrance -> actual readiness state -> Workspace Ready -> Enter Workspace with beautiful opt-in sound.',backend:'Real readiness handshake, no false Windows readiness; skip/replay/mute, reduced motion and audio-policy fallback. Owned/licensed sound only; avoid arbitrary autoplay and full-screen image-only scene.',connect:'Overlay uses existing Home underneath and enters the same AppShell, not a new application.',dayInstalled:null}
];
const universal='Keep the exact user image visual identity without redesign. One persistent KNOuX AppShell and shared KnouxOrbit; distinct six stationary accessible satellites per screen (splash excepted). Only SVG rings, constellation particles and light sweeps animate. Preserve satellite icon colors, geometry, precise positions, header, navigation, cards, inspector and DAY/NIGHT structure. A browser has no Windows bridge: show NOT_CONNECTED, never fake live data. Main -> context-isolated preload -> typed allowlisted IPC, real native/provider source, permission states, authoritative receipts. Side effects need immutable plan + explicit consent + native postcondition. Test EN/AR RTL, 1672x941, 1366x768, 1920x1080, 125/150%, reduced-motion and actual packaged Windows Electron. No reset, clean, force push, broad staging, push, merge or deployment.';
const visualDay=new Map(),visualNight=new Map();
if(exists(path.join(refs,'day')))for(const n of fs.readdirSync(path.join(refs,'day')))visualDay.set(n,path.join(refs,'day',n));
if(exists(path.join(refs,'night')))for(const n of fs.readdirSync(path.join(refs,'night')))visualNight.set(n,path.join(refs,'night',n));
const seenImages=new Map();
function reuseImage(file){
 if(!exists(file))return null;
 const h=hash(file);
 if(seenImages.has(h))return seenImages.get(h);
 const options=Array.from(visualDay.values()).concat(Array.from(visualNight.values()));
 const same=options.find(p=>fs.statSync(p).size===fs.statSync(file).size && hash(p)===h);
 if(same){seenImages.set(h,same);return same;}
 const dest=path.join(imageFolder,h.slice(0,12)+'__'+(path.basename(file).toLowerCase().includes('chatgpt')?'splash-night-approved.png':path.basename(file)));
 if(exists(dest)&&hash(dest)!==h)throw new Error('Ref conflict: '+dest);
 if(!exists(dest))fs.copyFileSync(file,dest,fs.constants.COPYFILE_EXCL);
 seenImages.set(h,dest);return dest;
}
function findImage(name){
 if(!name)return null; if(name==='06_11_03_splash_night'){const f=fs.readdirSync(downloads).find(x=>x.includes('06_11_03')&&x.toLowerCase().includes('chatgpt'));return f?path.join(downloads,f):null;}
 let p=path.join(downloads,name);
 if(exists(p))return p;
 const lower=name.toLowerCase();
 const files=fs.readdirSync(downloads);
 const match=files.find(x=>x.toLowerCase()===lower);
 return match?path.join(downloads,match):null;
}
function parseServices(markdown){
 const re=/^###\s+\d+\.\s+(.+?)\s+\[([a-z0-9-]+)\]\s*$/gm;
 const entries=[...markdown.matchAll(re)],out=[];
 const attr=(block,field)=>{const x=block.match(new RegExp('^'+field+':\\s*(.*)$','m'));return x?x[1].trim():'AUDIT_REQUIRED';};
 for(let i=0;i<entries.length;i++){
  const a=entries[i],end=entries[i+1]?entries[i+1].index:markdown.length,chunk=markdown.slice(a.index,end);
  out.push({id:a[2],name:a[1],scene:attr(chunk,'SERVICE-SPECIFIC PREVIEW'),actions:attr(chunk,'ALL REQUIRED INTERACTION BUTTONS'),proof:attr(chunk,'SERVICE-SPECIFIC PROOF'),spec:attr(chunk,'Individual exact spec')});
 }
 return out;
}
const manifest=[],registry=[],allIds=new Set();let canonicalCount=0;
for(const s of screens){
 const original=path.join(downloads,s.prompt);
 if(!exists(original))throw new Error('Missing original V0 execution source '+original);
 const domainDoc=s.domain?path.join(old,s.domain):null;
 if(domainDoc&&!exists(domainDoc))throw new Error('Missing canonical domain '+domainDoc);
 const svc=domainDoc?parseServices(safeRead(domainDoc)):[];
 for(const x of svc){if(allIds.has(x.id))throw new Error('Duplicate canonical ID '+x.id);allIds.add(x.id);}
 canonicalCount+=svc.length;
 const itemDir=path.join(domainFolder,s.n+'_'+s.key);mk(itemDir);
 const dayOriginal=findImage(s.day);
 const dayRef=dayOriginal?reuseImage(dayOriginal):(s.dayInstalled&&visualDay.get(s.dayInstalled)||null);
 const nightC=s.night&&findImage(s.night);
 const nightRef=nightC&&(s.n==='07'||s.n==='15')?reuseImage(nightC):(s.night&&visualNight.get(s.night)||null);
 const nightStr=nightRef?rpath(nightRef):'NO OWNER-APPROVED NIGHT REFERENCE; retain the same geometric layout and apply shared midnight-violet theme without claiming pixel-perfect missing reference.';
 const dayStr=dayRef?rpath(dayRef):'MISSING SOURCE — owner visual approval required';
 const cover=[
  '# KNOuX — SCREEN '+s.n+' — '+s.name+' — COMPLETE EXECUTION MISSION',
  '',
  'MISSION TYPE: PREPARATION FOR IMPLEMENTATION; NOT PROOF THIS SCREEN HAS BEEN COMPLETED.',
  'VISUAL SOURCE IMAGE (one canonical byte-unique asset): '+dayStr,
  'NIGHT IMAGE (reuse existing if present): '+nightStr,
  'EXISTING ROUTE: '+s.route,
  'EXISTING UI SOURCE: apps/gemini-ui/'+s.entry,
  'CANONICAL DOMAIN SPEC: '+(s.domain?'missions/UNIFIED_FULL_DOMAIN_EXECUTION_20261028/DOMAINS/'+s.domain:'AUXILIARY CINEMATIC ENTRY; NO NEW 181-SERVICE IDS'),
  'EXACT SERVICE COUNT FROM CANONICAL SOURCE: '+svc.length,
  '',
  '## 0. BINDING OWNER OVERRIDE — CURRENT D: REPOSITORY IS AUTHORITY',
  '',
  universal,
  '',
  'This task combines the original dedicated detailed V0 screen brief below with the canonical Windows Electron service inventory. Prior V0 instructions about generating a separate v0 website or replacing the app are superseded: integrate into the existing D: app only. If code and screenshot differ, repair the visual locally without discarding existing native services.',
  '',
  'Do not treat V0 image filenames as clone URLs. Do not replace original icons, recolor satellites, move cards or introduce a competing orbit. If a reference is missing, state it clearly.',
  '',
  '## A. EXACT SCREEN, SERVICES, WORKBENCHES AND UI CONTROLS',
  '',
  'Required screen journey: '+s.task,
  '',
  'Six nodes / reference slots: '+s.orbit,
  '',
  'UI and provider boundary: '+s.backend,
  '',
  'How this integrates later: '+s.connect,
  '',
  '### Required screen-specific user interactions',
  '',
  '1. Launch original route from global navigation without creating a second AppShell; keep active selection, scroll region and right inspector intact.',
  '2. Click each visible orbit node, category/tab, filter and item; update one real selected-context state and associated panels. Never animate operational progress without native events.',
  '3. Exercise search/filter/sort, details, preview, CTA and failure/permission paths; disable commands unsupported by native capability without removing their screenshot geometry.',
  '4. Preserve each icon source and pixel layout; only ring sweeps and star particles animate. DAY/NIGHT difference is glass material, shadows, contrast and illumination, NOT geometry.',
  '5. Implement or reuse typed provider contracts: capability, input validation, invoke, availability, cancellation, provenance, partial/error, permission, receipt and strict effect gating.',
  '6. Produce a route-specific integration handoff: screen component, hook, provider adapter, typed IPC capabilities, data DTO, permissions and tests; list unavailable Windows APIs explicitly.',
  '',
  '## B. FULL DEDICATED PRODUCT/UX REQUIREMENT — ORIGINAL SOURCE PROMPT',
  '',
  'The section below is preserved from the pre-existing screen-specific V0 markdown. The safety, repository and exact visual binding rules above take precedence where original wording conflicts.',
  '',
  '--- ORIGINAL SCREEN-SPECIFIC INPUT BEGIN ---',
  '',
  safeRead(original).trim(),
  '',
  '--- ORIGINAL SCREEN-SPECIFIC INPUT END ---',
  '',
  '## C. CANONICAL DOMAIN SERVICES — EXACT IDS, PREVIEW, ACTIONS, PROOF',
  '',
  'This section is parsed from the existing full-domain mission. Individual source specs are linked and NOT copied. Every ID needs its own genuinely interactive, source-aware service workbench. Audit the real implementation before writing replacement code.',
  ''
 ];
 for(let i=0;i<svc.length;i++){
  const x=svc[i];
  cover.push('### '+(i+1)+'. '+x.name+' ['+x.id+']','','- Canonical individual brief: '+x.spec,
  '- Required product scene: '+x.scene,
  '- Required controls: '+x.actions,
  '- Evidence and acceptance: '+x.proof,
  '- Deliverable: preserve existing code if it works; otherwise implement one domain-specific screen/workbench, typed read/plan APIs as applicable, selected-context inspector, loading/empty/blocked/partial/cancel/error states, keyboard/focus and real provider evidence.',
  '- Safety gate: no fabricated Windows result; effectful actions need bounded native executor, immutable plan, explicit owner approval, postcondition, authoritative receipt and verified rollback where available.',
  '- Checklist ownership: schema row '+x.id+' in schemas/181_ATOMIC_DOMAIN_ACCEPTANCE.csv is updated only after its actual tests and visual acceptance.',
  '');
 }
 cover.push(
  '## D. EXACT FUTURE-INTEGRATION HANDOFF (ALWAYS DELIVER)',
  '',
  'Build/verify the existing screen route, its reusable AppShell and KnouxOrbit config, custom service workbenches, native DTO+adapter, allowlisted Main/Preload methods, errors and receipts. Keep them in one application, not detached React demos.',
  'Integration chain: navigation -> route -> screen -> selected service workbench -> typed domain controller -> renderer adapter -> Electron preload -> validated Main handler -> official Windows/native provider -> source-backed result.',
  'Cross-screen workflow: '+s.connect,
  '',
  '## E. ACCEPTANCE MATRIX — DO NOT CALL DONE ON A MOCK OR A BUILD',
  '',
  '- [ ] Approved screenshot compared at 1672x941; same logo, icon colors, exact geometry, hero/sidebar/table/inspector/card density.',
  '- [ ] DAY and NIGHT use identical component tree. Screenshot difference measured; missing NIGHT reference disclosed.',
  '- [ ] Six orbit button identities and coordinates from screenshot, live ring animation, genuine focus/hover/press effects and stationary readable labels; splash uses cinematic sphere instead.',
  '- [ ] 1366x768 and 1920x1080, 125/150% zoom, EN/AR RTL, reduced-motion, keyboard and high contrast.',
  '- [ ] Every listed service ID audited, assigned to unique interface and wired to correct existing native or provider capability; unsupported actions shown as unavailable.',
  '- [ ] Browser preview, native Electron Main/Preload and packaged Windows runtime verified as separate evidence classes.',
  '- [ ] No sample KPI disguised as native reading; data always has unit, source, timestamp, permission and current status.',
  '- [ ] Destructive actions blocked without immutable allowlisted plan, consent and verified executor.',
  '- [ ] Negative fixtures: denied, invalid payload, stale, cancelled, partial, offline/unavailable and restart where relevant.',
  '- [ ] Existing screen regression checks, npm lint, build, domain tests, native-contract tests and owner DAY/NIGHT screenshots.',
  '- [ ] Preserve untracked evidence and ahead commits. No reset, clean, automatic merge, push or deployment.',
  '- [ ] Report exact changed files, methods wired, blocked features, screenshots, test commands and results, Git HEAD and owner visual gate.',
  '',
  'STATUS: NOT_AUDITED — this is an actionable specification, NOT a native completion receipt.',
  ''
 );
 const markdown=cover.join(nl);
 const missionFile=path.join(itemDir,'SCREEN_TASK.md');
 write(missionFile,markdown);
 const handoff={
  schema:'knoux.screen.handoff.v1',status:'NOT_AUDITED',route:s.route,
  screen:s.name,mission:rpath(missionFile),sourcePrompt:s.prompt,
  dayScreenshot:dayRef?rpath(dayRef):null,nightScreenshot:nightRef?rpath(nightRef):null,
  visualSourceWarning:nightRef?null:'Night geometry follows same DAY screenshot; no pixel-match claim.',
  rendererEntryPaths:s.entry.split('|').map(x=>'apps/gemini-ui/'+x.trim()),
  orbitNodes:s.orbit,providerPlan:s.backend,
  canonicalDomain:s.domain?'missions/UNIFIED_FULL_DOMAIN_EXECUTION_20261028/DOMAINS/'+s.domain:null,
  serviceCount:svc.length,services:svc.map(x=>({id:x.id,name:x.name,canonicalSpec:x.spec})),
  providerStatus:'MUST_AUDIT',windowsRuntimeVerified:false,ownerVisualApproved:false
 };
 write(path.join(itemDir,'INTEGRATION_HANDOFF.json'),JSON.stringify(handoff,null,2)+nl);
 registry.push({screen:s.n,name:s.name,day:dayStr,night:nightStr,daySHA:dayRef?hash(dayRef):null,nightSHA:nightRef?hash(nightRef):null});
 manifest.push({screen:s.n,name:s.name,route:s.route,mission:rpath(missionFile),handoff:rpath(path.join(itemDir,'INTEGRATION_HANDOFF.json')),serviceCount:svc.length,serviceIds:svc.map(x=>x.id),references:{day:dayRef?rpath(dayRef):null,night:nightRef?rpath(nightRef):null}});
}
if(canonicalCount!==181)throw new Error('Canonical service count MISMATCH: '+canonicalCount+' vs 181, DO NOT CLOSE PACK');
const guide=[
 '# KNOuX SmartOrganizer — 15 Screen Implementation Missions — READ FIRST',
 '',
 'CREATED INSIDE CANONICAL D: APP. This mission pack is a new document-only handoff assembled from pre-existing 15 full V0 screen prompts + original 14 full-domain missions / 181 atomic service IDs.',
 'EXISTING PRODUCT CODE, BRANCHES, UNTRACKED EVIDENCE AND REFERENCE IMAGES ARE UNCHANGED.',
 '',
 '## How to work',
 '',
 '1. Read 01_MASTER_OWNER_RULES.md before sending any screen to an agent.',
 '2. Choose the next screen from 03_DOMAIN_EXECUTION_ORDER.md. Open its SCREEN_TASK.md and its INTEGRATION_HANDOFF.json.',
 '3. Open the reference path in 02_REFERENCE_REGISTRY.md; image assets are canonicalized centrally and never copied into each screen folder.',
 '4. Agent audits existing route+provider before writing; adds only verified missing functionality.',
 '5. Finish EACH service ID with distinct workbench, source provenance, security tests and DAY/NIGHT owner visual approval before moving on.',
 '',
 '## Source hierarchy',
 'Owner-approved actual reference > existing native app/source/contracts > latest canonical 181 ID specs > prior V0 prompts > optional fixture. Never claim a sample screenshot value is live.',
 '',
 '## 15 Screen folders',
 ...manifest.map(m=>'- '+m.screen+' '+m.name+' — '+m.mission+' — '+m.serviceCount+' canonical service IDs'),
 '',
 '## Important status warning',
 'These are detailed tasks only. No change to product runtime or provider behavior has been made by generating this pack. Browser screenshots do not verify native Windows runtime.',
 ''
].join(nl);
write(path.join(pack,'00_READ_ME_FIRST.md'),guide);
write(path.join(pack,'01_MASTER_OWNER_RULES.md'),[
 '# BINDING OWNER CONTRACT FOR EVERY SCREEN',
 '',universal,'',
 'Visual sources are filenames and SHA-256 pointers in 02_REFERENCE_REGISTRY.md; never paste screenshots into CSS or embed wheel PNG as UI.',
 'Contract hierarchy: canonical D: worktree + original provider and 181 service specs are real source authority, reference screenshots govern UI visual shape.',
 'Exactly one shared AppShell, one NavigationContext and one KNOuX orbit engine; original six visible satellite icons never recolored or repositioned.',
 'No unapproved file deletes, shell execution, unsafe registry/service modification, fake cleanup, repaired status, automation runs, OAuth/API connections, AI answers or fabricated telemetry.',
 'Read-only functions first; irreversible changes require per-operation consent+verification, never merely screenshot-matched button clicks.',
 'For portable/synthetic tests label FIXTURE. For unsupported Electron services label NOT_CONNECTED/NOT_IMPLEMENTED, never invented success.',
 'Automation local drafts and dry-run are valid existing capabilities but NOT proof Windows scheduled effectful executor exists.',
 'The canonical Git main was ahead of origin/main by nine commits at previous inspection and carried untracked evidence. Reinspect current state. Never reset/clean/force-push/broad stage/push/deploy.',
 '',
 'Agent MUST deliver exact changed file list, tested commands, per-service source and receipt evidence, day/night images, native vs browser distinction and blockers. Owner signs visual gate.',
 ''
].join(nl));
write(path.join(pack,'02_REFERENCE_REGISTRY.md'),[
 '# Reference registry — selected image hashes, NO duplicated screenshots',
 '',
 'Every selected source image is either an existing repo image at its old location or one SHA-unique centralized asset in REFERENCE_IMAGES_UNIQUE. The source Downloads includes duplicates and alternative designs; NONE are indiscriminately copied.',
 'A screenshot of an actual/incomplete app is NOT automatically the approved design. Owners confirm which visual is final. Missing NIGHT reference is explicit.',
 '',
 ...registry.map(x=>[
  '## Screen '+x.screen+': '+x.name,
  '- DAY source: '+x.day,
  '- DAY SHA256: '+(x.daySHA||'NONE'),
  '- NIGHT source: '+x.night,
  '- NIGHT SHA256: '+(x.nightSHA||'NONE'),
  ''
 ].join(nl)),
 'Original D: references are not deleted or modified. No duplicate image is kept in individual screen task folders.',
 ''
].join(nl));
const order=['01','10','02','13','11','12','03','04','06','05','07','08','09','14'];
write(path.join(pack,'03_DOMAIN_EXECUTION_ORDER.md'),[
 '# Execution queue aligned to canonical 2026-10-28 FULL DOMAIN order',
 '',
 'Core domains are complete-domain tasks, not isolated cosmetic screens. This queue is distinct from screen numbering inherited from the already supplied V0 prompts.',
 '',
 ...order.map((x,i)=>{
   const m=manifest.find(z=>z.screen===x);
   return (i+1)+'. '+m.name+' — '+m.mission+' ('+m.serviceCount+' service IDs)';
 }),
 '',
 'CINEMATIC SPLASH: supporting scene 15; do not invent new canonical service IDs. Finish as integrated application entry flow after approved Home geometry. No per-screen duplicated app shell.',
 '',
 'Move to next domain only when exact service-ID row evidence, native safety, packaged Electron and visual owner acceptance pass. No skipped IDs.',
 ''
].join(nl));
write(path.join(pack,'04_INTEGRATION_MAP.md'),[
 '# Integration map — one real KNOuX application',
 '',
 '| Layer | Canonical path | Responsibility |',
 '| --- | --- | --- |',
 '| Active route | apps/gemini-ui/src/App.tsx | Existing switch to all available domain pages |',
 '| Navigation | apps/gemini-ui/src/context/NavigationContext.tsx | Single section and history state |',
 '| AppShell | apps/gemini-ui/src/components/shell/KNOuXShellComponents.tsx | Shared header/sidebar and theme |',
 '| Orbit | apps/gemini-ui/src/visual/KnouxOrbit.tsx | Single SVG engine, fixed 6 satellite configs |',
 '| Contracts | apps/gemini-ui/shared/native-contract.json and native-contracts.ts | Exact typed capabilities |',
 '| Preload | apps/gemini-ui/electron/preload.cjs | Context-isolated approved methods |',
 '| Main | apps/gemini-ui/electron/main.cjs | Guarded sender and allowlisted source |',
 '| Workbenches | apps/gemini-ui/src/system + automation + operations | Existing specialised domain controllers |',
 '',
 'Cross-domain access is through typed IDs and explicit handoff, not independent copied providers.',
 'Read: capability + read scope -> native result with time/source/unit/permission/freshness.',
 'Write: source identity -> immutable digest plan -> conflicts/risk -> explicit consent -> supported executor -> verified postcondition + receipt + optional safely provable Undo.',
 'Audio/visual effects cannot fake native progress or action completion.',
 'Browser preview does not have Electron IPC and must show meaningful unavailable state rather than fabricated data.',
 '',
 'Per-screen integration manifests record exact implementation targets; their status is NOT_AUDITED until real tests are performed.',
 ''
].join(nl));
write(path.join(pack,'05_EXECUTION_QA_MATRIX.md'),[
 '# Mandatory acceptance gates per screen',
 '',
 '- [ ] Preserve baseline Git SHA, working tree and original reference evidence.',
 '- [ ] Exact screenshot geometry, screenshot icon colors, no invented mini-cards; no duplicated whole-wheel image.',
 '- [ ] Same light/dark component tree and premium KNOuX material palette; identical orbit satellite coordinates.',
 '- [ ] Orbital rings/particle trails animate, satellites stay stationary/accessible; hover/click/focus meaningful.',
 '- [ ] Every tab/filter/search/row/inspector/action has real typed callback/state and actual provider or honest unavailable outcome.',
 '- [ ] Every service ID linked to its canonical individual preview spec and verified in own workbench.',
 '- [ ] All read-only observations contain source/timestamp/unit/permission; no fake screenshot metrics.',
 '- [ ] Mutating plans verified and consented; no arbitrary shell IPC or direct renderer mutation.',
 '- [ ] Error/empty/loading/denied/cancel/stale/partial/restart negative tests pass.',
 '- [ ] TypeScript, lint, build, domain tests, native-contract tests and fixture tests pass.',
 '- [ ] Native Electron packaged runtime tested separately from Vite/browser.',
 '- [ ] 1672x941, 1366x768, 1920x1080 DAY/NIGHT EN/AR RTL and 125%/150% visual captures.',
 '- [ ] Keyboard, accessibility, reduced-motion, performance and bounded scrolling pass.',
 '- [ ] Owner signs visual acceptance. Git changes scoped, all previous domains regression-tested.',
 '- [ ] No reset, clean, push, merge or deploy without explicit separate owner instruction.',
 ''
].join(nl));
write(path.join(pack,'SCREEN_MANIFEST.json'),JSON.stringify({schema:'knoux.screens.2026-10-30',repoRoot:repo,generatedAt:'2026-10-30',screenCount:manifest.length,canonicalCount,notes:'Specifications only. Source V0 prompts+canonical 181 service IDs; no native status promises.',screens:manifest},null,2)+nl);
console.log(JSON.stringify({pack,screenCount:manifest.length,canonicalCount,uniqueImages:fs.readdirSync(imageFolder).length,selectedScreens:manifest.map(m=>({screen:m.screen,name:m.name,services:m.serviceCount,day:m.references.day,night:!!m.references.night}))},null,2));
