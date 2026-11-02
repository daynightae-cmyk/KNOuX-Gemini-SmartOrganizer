import {useId,useMemo,useState,type ReactNode} from 'react';
import {LivingLayoutContext} from './LivingLayoutContext';
import {SECTION_VISUALS} from './section-visual-configuration';
import {SectionGlassScene} from './SectionGlassScene';
import {OrbitalParticleSystem} from './OrbitalParticleSystem';
import {useNavigation} from '../context/NavigationContext';

export function UnifiedSectionLayout({children}:{children:ReactNode}) {
 const {currentSection,isArabic,theme}=useNavigation();
 const config=SECTION_VISUALS[currentSection];
 const [chrome,setChrome]=useState<HTMLElement|null>(null),[navigation,setNavigation]=useState<HTMLElement|null>(null),[orbit,setOrbit]=useState<HTMLElement|null>(null);
 const slots=useMemo(()=>({chrome,navigation,orbit,section:currentSection}),[chrome,navigation,orbit,currentSection]);
 const lightId='knx-workflow-light-'+useId().replace(/[^a-zA-Z0-9]/g,'');
 const Icon=config.icon;
 return <LivingLayoutContext.Provider value={slots}>
  <div className="visual-sprint knx-living-shell" data-visual-section={currentSection} data-reference-shell="true" data-section-tone={config.tone} data-theme-mode={theme==='light'?'day':'night'} dir={isArabic?'rtl':'ltr'}>
   <div className="knx-living-chrome" ref={setChrome} data-testid="unified-shell-chrome"/>
   <div className="knx-living-frame">
    <div className="knx-living-navigation" ref={setNavigation} data-testid="unified-shell-navigation"/>
    <div className="knx-living-content" data-testid="unified-content">
     <section className="knx-section-hero" data-knx-hero data-testid="unified-section-hero" data-hero-section={currentSection} data-composition={config.layout} aria-labelledby="knx-unified-title">
      <div className="knx-section-identity"><span className="knx-section-emblem"><Icon aria-hidden="true"/></span>
       <div className="knx-section-copy"><span className="knx-section-kicker">KNOuX SmartOrganizer</span><h1 id="knx-unified-title" lang="en" dir="ltr">{config.headline}</h1><h2 lang="ar" dir="rtl">{config.headlineAr}</h2><p lang="en" dir="ltr">{config.description}</p><p lang="ar" dir="rtl">{config.descriptionAr}</p></div>
      </div>
      <SectionGlassScene section={config.scene}/>
      <div className="knx-section-instrument"><OrbitalParticleSystem/><div className="knx-section-orbit-mount" ref={setOrbit} data-testid="unified-live-orbit"/></div>
      {/* Reference workflow is an illustration, not a claim of completed work.
          The original measured, actionable service pipeline remains below. */}
      <ol className="knx-reference-workflow" aria-label={isArabic?'خريطة سير العمل':'Workflow map'} data-workflow-section={currentSection}>
       <li className="knx-workflow-connections" aria-hidden="true"><svg viewBox="0 0 1000 70" preserveAspectRatio="none" focusable="false"><defs><linearGradient id={lightId}><stop stopColor="var(--knx-magenta)"/><stop offset=".26" stopColor="var(--knx-light-trail)"/><stop offset=".62" stopColor="var(--knx-accent)"/><stop offset="1" stopColor="var(--knx-light-trail)"/></linearGradient></defs>{[12,6,2].map((width,i)=><path key={width} d={config.layout==='identity'?'M24 35H976':'M24 35C140 5 150 66 256 35S375 5 490 35 620 64 735 35 860 8 976 35'} fill="none" stroke={i===2?'var(--knx-edge-strong)':`url(#${lightId})`} strokeWidth={width} opacity={i===0?.22:i===1?.85:1}/>)}</svg></li>
       {config.workflow.map(({en,ar,icon:StepIcon},i)=><li key={en} style={{'--step-index':i} as React.CSSProperties}><span className="knx-workflow-glyph"><StepIcon aria-hidden="true"/></span><span lang="en" dir="ltr">{en}</span><small lang="ar" dir="rtl">{ar}</small></li>)}
      </ol>
     </section>
     <div className="knx-living-workspace" data-testid="unified-route-content">{children}</div>
    </div>
   </div>
  </div>
 </LivingLayoutContext.Provider>;
}
