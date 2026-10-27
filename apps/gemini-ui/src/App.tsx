/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { StudioProvider } from './studio/context';
import { StudioPage } from './studio/StudioPage';
import { HomePage } from './pages/HomePage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { FilesPage } from './pages/FilesPage';
import { StoragePage } from './pages/StoragePage';
import { CleanupPage } from './pages/CleanupPage';
import { StartupPage } from './pages/StartupPage';
import { SystemPage } from './pages/SystemPage';
import { RepairPage } from './pages/RepairPage';
import { ServicesPage } from './pages/ServicesPage';
import { AutomationPage } from './pages/AutomationPage';
import { SmartScanPage } from './pages/SmartScanPage';
import { SettingsPage } from './pages/SettingsPage';
import { GoogleWorkspaceHub } from './components/workspace/GoogleWorkspaceHub';

import { KNOuXAssistantChat } from './components/chat/KNOuXAssistantChat';
import { ApiKeySetupModal } from './components/chat/ApiKeySetupModal';
import { setAiSession } from './lib/ai-session';

import './studio/styles/studio.css';
import './studio/styles/command-center.css';
import './applications.css';
import './files.css';
import './storage.css';
import './cleanup.css';
import './startup.css';
import './system.css';
import './repair.css';
import './services.css';
import './automation.css';
import './home-command-center.css';
// Light-workstation palette bridge must load after every page stylesheet.
import './theme-light.css';
import './visual/visual-sprint.css';
import './visual/files-visual.css';
import './visual/scan-visual.css';
import './visual/apps-visual.css';
import './visual/storage-visual.css';
import './visual/studio-reference.css';
import './visual/reference-controls.css';
import './visual/files-reference.css';
import './visual/reference-polish.css';
import './visual/scan-reference.css';
import './visual/apps-reference.css';
import './visual/storage-reference.css';
import './visual/cleanup-reference.css';
import './visual/startup-reference.css';
import './visual/system-reference.css';
import './visual/repair-reference.css';
// Home's day/night material layer: re-maps the literal dark utilities inside
// .knx-home-root only, so it must come after the global light bridge.
import './visual/home-reference.css';
// Restraint pass over the reference shells: restores the navy night identity,
// the rail and the System register. Materials only, no structural change, and
// deliberately no .knx-orbit rules now that the engine owns that surface.
import './visual/reference-restraint.css';
// Orbital Service Engine is the single source of truth for every .knx-orbit
// surface, so it loads last and nothing re-styles the dial behind its back.
import './visual/orbital-engine.css';
import { CinematicEntry } from './features/cinematic-entry/CinematicEntry';

export type { AppSection } from './context/NavigationContext';

function AppContent() {
  const { currentSection, navigateTo, isArabic } = useNavigation();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('setup_key') === 'true') {
        setIsApiKeyModalOpen(true);
      }
      const handleOpen = () => setIsApiKeyModalOpen(true);
      window.addEventListener('knoux:open-api-key-modal', handleOpen);
      return () => window.removeEventListener('knoux:open-api-key-modal', handleOpen);
    }
  }, []);

  const handleSaveApiKey = (key: string, provider: 'openrouter' | 'openai' | 'anthropic') => {
    // Session memory only. Persistent credentials require the native
    // safeStorage capability scheduled for Mission 14; localStorage is not a
    // credential store.
    setAiSession(key, provider);
    setIsApiKeyModalOpen(false);
  };

  const isAr = isArabic;

  // Active workspace injector into shared workspace container
  const renderActiveWorkspace = () => {
    switch (currentSection) {
      case 'settings':
        return <SettingsPage onNavigateSection={navigateTo} />;
      case 'smart_scan':
        return <SmartScanPage onNavigateSection={navigateTo} />;
      case 'workspace':
        return <GoogleWorkspaceHub locale={isAr ? 'ar' : 'en'} />;
      case 'automation':
        return <AutomationPage onNavigateSection={navigateTo} />;
      case 'services':
        return <ServicesPage onNavigateSection={navigateTo} />;
      case 'repair':
        return <RepairPage onNavigateSection={navigateTo} />;
      case 'system':
        return <SystemPage onNavigateSection={navigateTo} />;
      case 'startup':
        return <StartupPage onNavigateSection={navigateTo} />;
      case 'cleanup':
        return <CleanupPage onNavigateSection={navigateTo} />;
      case 'storage':
        return <StoragePage onNavigateSection={navigateTo} />;
      case 'files':
        return <FilesPage onNavigateSection={navigateTo} />;
      case 'applications':
        return <ApplicationsPage onNavigateSection={navigateTo} />;
      case 'studio':
        return (
          <StudioProvider>
            <StudioPage onNavigate={navigateTo} />
          </StudioProvider>
        );
      case 'home':
      default:
        return <HomePage onNavigateSection={navigateTo} onNavigate={navigateTo} />;
    }
  };

  return (
    <>
      <div className="visual-sprint" data-visual-section={currentSection} data-reference-shell={['studio', 'files', 'smart_scan', 'applications', 'storage', 'cleanup', 'startup', 'system', 'repair', 'services'].includes(currentSection)}>{renderActiveWorkspace()}</div>
      <KNOuXAssistantChat currentSection={currentSection} locale={isAr ? 'ar' : 'en'} />
      <ApiKeySetupModal
        isOpen={isApiKeyModalOpen}
        onSave={handleSaveApiKey}
        onSkip={() => setIsApiKeyModalOpen(false)}
        locale={isAr ? 'ar' : 'en'}
      />
    </>
  );
}

export default function App() {
  return (
    <NavigationProvider initialSection="home">
      <CinematicEntry><AppContent /></CinematicEntry>
    </NavigationProvider>
  );
}
