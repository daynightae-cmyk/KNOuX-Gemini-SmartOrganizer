import type {AppSection} from '../context/NavigationContext';
/** Decorative reference-guided cutouts only: real controls stay in React. */
export const LIVING_GLASS_ARTWORK:Record<AppSection,string>={
 studio:new URL('./assets/living-glass/studio-scene.png',import.meta.url).href,
 home:new URL('./assets/living-glass/home-scene.png',import.meta.url).href,
 workspace:new URL('./assets/living-glass/workspace-scene.png',import.meta.url).href,
 startup:new URL('./assets/living-glass/startup-scene.png',import.meta.url).href,
 smart_scan:new URL('./assets/living-glass/smart_scan-scene.png',import.meta.url).href,
 applications:new URL('./assets/living-glass/applications-scene.png',import.meta.url).href,
 services:new URL('./assets/living-glass/services-scene.png',import.meta.url).href,
 system:new URL('./assets/living-glass/system-scene.png',import.meta.url).href,
 repair:new URL('./assets/living-glass/repair-scene.png',import.meta.url).href,
 automation:new URL('./assets/living-glass/automation-scene.png',import.meta.url).href,
 files:new URL('./assets/living-glass/files-scene.png',import.meta.url).href,
 storage:new URL('./assets/living-glass/storage-scene.png',import.meta.url).href,
 cleanup:new URL('./assets/living-glass/cleanup-scene.png',import.meta.url).href,
 settings:new URL('./assets/living-glass/settings-scene.png',import.meta.url).href,
};
