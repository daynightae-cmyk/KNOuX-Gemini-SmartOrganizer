/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KNOuX SmartOrganizer — Settings & Engine Configuration Center
 * Ultra-visually stunning, high-specialization control panel matching KNOuX identity
 */

import React, { useEffect, useRef, useState } from 'react';
import { CinematicEntrySettings } from '../features/cinematic-entry/CinematicEntry';
import { getAiSession, setAiSession } from '../lib/ai-session';
import {
  exportSettingsProfile,
  loadSettingsProfile,
  normalizeSettingsProfile,
  previewSettingsImport,
  resetSettingsProfile,
  saveSettingsProfile,
  type SettingsImportPreview,
  type SettingsProfile,
} from '../settings/profile';
import {
  Settings,
  Sliders,
  Cpu,
  Zap,
  Key,
  Globe,
  Shield,
  Palette,
  Languages,
  Database,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  Download,
  Upload,
  RotateCcw,
  Check,
  Activity,
  ChevronRight,
  Info,
} from 'lucide-react';
import { KNOuXTitleBar, KNOuXSidebar } from '../components/shell/KNOuXShellComponents';
import { useNavigation } from '../context/NavigationContext';

export interface SettingsPageProps {
  onNavigateSection?: (section: string) => void;
}

const ACCENT_PREVIEW: Record<string, string> = {
  neon_cyan: '#22d3ee',
  obsidian: '#94a3b8',
  cyber_purple: '#c084fc',
  emerald_shield: '#34d399',
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigateSection }) => {
  const { navigateTo, isArabic, toggleLocale, setLocale } = useNavigation();
  const [activeTab, setActiveTab] = useState<
    'engine' | 'ai_keys' | 'workspace' | 'guard' | 'appearance' | 'language' | 'backup'
  >('engine');

  // API Key & Model State — session memory only, never localStorage.
  const [apiKey, setApiKey] = useState(() => getAiSession().apiKey);
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<'openrouter' | 'openai' | 'anthropic'>(() => getAiSession().provider);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  // Non-secret preferences are persisted locally. Credentials never enter it.
  const initialProfileRef = useRef<SettingsProfile | null>(null);
  if (!initialProfileRef.current) initialProfileRef.current = loadSettingsProfile();
  const initialProfile = initialProfileRef.current;
  const [engineMode, setEngineMode] = useState<'turbo' | 'balanced' | 'silent'>(initialProfile.engineMode);
  const [ramLimitGB, setRamLimitGB] = useState(initialProfile.ramLimitGB);
  const [cpuThreads, setCpuThreads] = useState(initialProfile.cpuThreads);
  const [colorTheme, setColorTheme] = useState(initialProfile.accent);
  const [density, setDensity] = useState(initialProfile.density);
  const [profileSavedAt, setProfileSavedAt] = useState(initialProfile.updatedAt);
  const [importPreview, setImportPreview] = useState<SettingsImportPreview | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Unsupported guard engines remain off and read-only; no automatic cleaning,
  // registry protection or purge is running in this phase.
  const blockUnapprovedStartup = false;
  const autoPurgePrivacyOnClose = false;
  const registrySentinel = false;

  // Notifications Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentProfile = (): SettingsProfile => normalizeSettingsProfile({
    schema: 'knoux.settings.profile.v1',
    accent: colorTheme,
    density,
    engineMode,
    ramLimitGB,
    cpuThreads,
    updatedAt: profileSavedAt,
  });

  const applyLocalProfile = (profile: SettingsProfile) => {
    setEngineMode(profile.engineMode);
    setRamLimitGB(profile.ramLimitGB);
    setCpuThreads(profile.cpuThreads);
    setColorTheme(profile.accent);
    setDensity(profile.density);
  };

  useEffect(() => {
    if (!pageRef.current) return;
    pageRef.current.dataset.density = density;
    pageRef.current.dataset.accent = colorTheme;
  }, [colorTheme, density]);

  const handleSaveAll = () => {
    const result = saveSettingsProfile(currentProfile());
    if (!result.saved) {
      showToastMsg(isArabic ? 'تعذر حفظ التفضيلات محليًا.' : 'Preferences could not be saved locally.');
      return;
    }
    setProfileSavedAt(result.profile.updatedAt);
    applyLocalProfile(result.profile);
    showToastMsg(isArabic
      ? 'حُفظت التفضيلات غير السرية محليًا. لا يوجد محرك أداء أو حارس تلقائي موصول، ولم يتغير أي إعداد ويندوز.'
      : 'Non-secret preferences saved locally. No engine/guard provider is connected and no Windows setting was changed.');
  };

  const handleExportProfile = () => {
    const payload = exportSettingsProfile(currentProfile());
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'knoux-settings-profile.json';
      anchor.click();
      URL.revokeObjectURL(url);
      showToastMsg(isArabic ? 'صُدّر ملف التفضيلات غير السري (بدون مفاتيح أو رموز).' : 'Credential-free settings profile exported (no keys or tokens).');
    } catch {
      showToastMsg(isArabic ? 'تعذر بدء تصدير ملف التفضيلات.' : 'The settings profile export could not start.');
    }
  };

  const handleImportFile = async (file: File | null) => {
    setImportError(null);
    setImportPreview(null);
    if (!file) return;
    if (file.size > 64 * 1024) {
      setImportError(isArabic ? 'حجم الملف يتجاوز 64 KB.' : 'The file exceeds 64 KB.');
      return;
    }
    try {
      const text = await file.text();
      setImportPreview(previewSettingsImport(text, currentProfile()));
    } catch {
      setImportError(isArabic ? 'تعذر قراءة الملف.' : 'The file could not be read.');
    }
  };

  const applyImportedProfile = () => {
    if (!importPreview?.valid || !importPreview.profile) return;
    const result = saveSettingsProfile(importPreview.profile);
    if (!result.saved) {
      showToastMsg(isArabic ? 'تعذر حفظ التفضيلات المستوردة.' : 'Imported preferences could not be saved.');
      return;
    }
    setProfileSavedAt(result.profile.updatedAt);
    applyLocalProfile(result.profile);
    setImportPreview(null);
    showToastMsg(isArabic ? 'طُبقت التفضيلات المستوردة. لم تُستورد أي مفاتيح أو رموز.' : 'Imported preferences applied. No keys or tokens were imported.');
  };

  const handleResetProfile = () => {
    const result = resetSettingsProfile();
    setProfileSavedAt(result.profile.updatedAt);
    applyLocalProfile(result.profile);
    setImportPreview(null);
    showToastMsg(result.saved
      ? (isArabic ? 'أُعيدت التفضيلات غير السرية إلى الافتراضي.' : 'Non-secret preferences reset to defaults.')
      : (isArabic ? 'تعذر حفظ إعادة الضبط.' : 'The reset could not be saved.'));
  };

  const handleSaveApiKey = () => {
    setAiSession(apiKey, provider);
    showToastMsg(
      isArabic
        ? 'تم الاحتفاظ بالمفتاح في ذاكرة الجلسة فقط. التخزين الآمن الأصلي غير موصول بعد.'
        : 'Key held in session memory only. Native secure storage is not connected yet.'
    );
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      showToastMsg(isArabic ? 'يرجى إدخال مفتاح API أولاً' : 'Please input an API key first.');
      return;
    }
    setTestStatus('testing');
    const start = performance.now();
    let isOk = false;
    let latencyMs = 0;
    try {
      if (provider === 'openrouter') {
        const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
          headers: { Authorization: `Bearer ${apiKey.trim()}` },
        });
        latencyMs = Math.round(performance.now() - start);
        isOk = res.ok;
      }
    } catch {
      // Network blocked or offline
    }

    if (isOk) {
      setTestStatus('success');
      showToastMsg(
        isArabic
          ? `نجح الاتصال بالمزود المباشر! زمن الاستجابة ${latencyMs}ms`
          : `Live connection verified! Response latency ${latencyMs}ms`
      );
    } else {
      setTestStatus('failed');
      showToastMsg(
        isArabic
          ? 'تعذر التحقق عبر الإنترنت حالياً. المفتاح في ذاكرة الجلسة فقط، ولا يوجد تخزين دائم.'
          : 'Online probe inconclusive. The key remains in session memory only; nothing is persisted.'
      );
    }
  };

  const handleNavigate = (sec: string) => {
    if (onNavigateSection) onNavigateSection(sec);
    else navigateTo(sec);
  };

  const renderEngineTab = () => (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'إعدادات أداء محرك KNOuX وتخصيص العتاد' : 'KNOuX Engine Performance & Hardware Allocation'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isArabic
                      ? 'التحكم في قوة معالجة الفحص، تخصيص الذاكرة المؤقتة، وتوزيع الخيوط البرمجية.'
                      : 'Control scanning speed, RAM cache limits, and CPU multithreading behavior.'}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-3 text-[11px] leading-relaxed text-amber-200" data-testid="settings-engine-notice">
                  {isArabic
                    ? 'هذه التفضيلات واجهة فقط. لا يوجد محرك أداء أصلي موصول، ولا تغيّر هذه الخيارات سرعة الفحص أو استهلاك الذاكرة أو خيوط المعالج فعليًا.'
                    : 'These are UI preferences only. No native engine provider is connected; they do not change scan speed, RAM cache or CPU threads at runtime.'}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Turbo Mode Card */}
                  {[
                    { id: 'turbo', titleEn: 'Maximum Turbo Engine', titleAr: 'وضع النفاث الأقصى', descEn: 'Max multi-threading & instant sector scans', descAr: 'استغلال كامل للمعالج وتسريع ثنائي' },
                    { id: 'balanced', titleEn: 'Balanced Smart Mode', titleAr: 'الوضع المتوازن الذكي', descEn: 'Optimized resource allocation for daily tasks', descAr: 'موازنة أداء النظام مع المهام اليومية' },
                    { id: 'silent', titleEn: 'Silent Eco Efficiency', titleAr: 'الوضع الصامت الاقتصادي', descEn: 'Low background priority for battery saving', descAr: 'أقل استهلاك طاقة وأثر خلفي صامت' },
                  ].map((mode) => (
                    <button
                      type="button"
                      aria-pressed={engineMode === mode.id}
                      key={mode.id}
                      onClick={() => {
                        setEngineMode(mode.id as any);
                        showToastMsg(isArabic
                          ? `حُفظ تفضيل "${mode.titleAr}" في الذاكرة. لا يوجد مزود محرك أداء موصول، لذلك لم يتغير أداء الفحص.`
                          : `"${mode.titleEn}" is a preference only. No native engine provider is connected, so scan performance did not change.`);
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        engineMode === mode.id
                          ? 'bg-[#0d254c] border-cyan-400 shadow-[0_0_15px_rgba(38,198,218,0.3)]'
                          : 'bg-[#091a38] border-[#132e54] hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-white text-sm">
                          {isArabic ? mode.titleAr : mode.titleEn}
                        </span>
                        {engineMode === mode.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                      </div>
                      <p className="text-xs text-slate-300">{isArabic ? mode.descAr : mode.descEn}</p>
                    </button>
                  ))}
                </div>

                {/* RAM Limit & Multithreading Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  <div className="bg-[#0a1a36] p-4 rounded-xl border border-[#143058] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-400" />
                        {isArabic ? 'حد تخصيص الذاكرة المؤقتة (RAM Cache)' : 'RAM Allocation Limit (Background Cache)'}
                      </label>
                      <span className="font-mono text-cyan-300 font-extrabold text-xs">{ramLimitGB} GB</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={16}
                      value={ramLimitGB}
                      onChange={(e) => setRamLimitGB(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>1 GB (Minimal)</span>
                      <span>8 GB (Optimal)</span>
                      <span>16 GB (Extreme)</span>
                    </div>
                  </div>

                  <div className="bg-[#0a1a36] p-4 rounded-xl border border-[#143058] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-cyan-400" />
                        {isArabic ? 'خيوط معالجة الفحص (CPU Threads)' : 'CPU Multithreading Allocation'}
                      </label>
                      <span className="font-mono text-cyan-300 font-extrabold text-xs">{cpuThreads} Threads</span>
                    </div>
                    <select
                      value={cpuThreads}
                      onChange={(e) => setCpuThreads(e.target.value as SettingsProfile['cpuThreads'])}
                      className="w-full bg-[#050e1f] border border-[#173763] rounded-xl p-2 text-xs text-white font-mono"
                    >
                      <option value="4">4 Threads (Low Impact)</option>
                      <option value="8">8 Threads (Standard)</option>
                      <option value="16">16 Threads (Full Multi-Core Turbo)</option>
                      <option value="32">32 Threads (Extreme Parallel Workstation)</option>
                    </select>
                  </div>
                </div>
              </div>
  );

  const renderAiKeysTab = () => (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Key className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'إعدادات مساعد KNOuX الذكي ومفاتيح API' : 'KNOuX Assistant AI Copilot & OpenRouter / OpenAI Key Config'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isArabic
                      ? 'إدخال وحفظ مفتاح API الخاص بك لتشغيل المساعد الذكي وخدمات التحليل المتقدمة.'
                      : 'Provide your OpenRouter, OpenAI, or Anthropic key to enable live KNOuX Copilot and smart diagnostics.'}
                  </p>
                </div>

                <div className="space-y-4 max-w-2xl">
                  {/* Provider Switcher */}
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-2">
                      {isArabic ? 'مزود خدمة الذكاء الاصطناعي:' : 'Select AI Provider:'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'openrouter', label: 'OpenRouter (Recommended)' },
                        { id: 'openai', label: 'OpenAI Direct' },
                        { id: 'anthropic', label: 'Anthropic Claude' },
                      ].map((prov) => (
                        <button
                          key={prov.id}
                          onClick={() => setProvider(prov.id as any)}
                          className={`p-2.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                            provider === prov.id
                              ? 'bg-blue-600 text-white border-cyan-400 shadow-[0_0_12px_rgba(37,99,235,0.5)]'
                              : 'bg-[#091a38] text-slate-300 border-[#143058]'
                          }`}
                        >
                          {prov.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* API Key Input */}
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      {isArabic ? 'مفتاح API الخاص بك (Secret Key):' : 'API Key Input:'}
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type={showKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="w-full bg-[#050e1f] border border-[#183968] focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 text-slate-400 hover:text-white"
                      >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveApiKey}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isArabic ? 'حفظ المفتاح' : 'Save Key'}</span>
                    </button>
                    <button
                      onClick={handleTestConnection}
                      disabled={testStatus === 'testing'}
                      className="px-4 py-2 rounded-xl bg-[#0b1c38] hover:bg-[#122b52] border border-[#173a6e] text-cyan-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin text-cyan-400' : ''}`} />
                      <span>{isArabic ? 'اختبار الاتصال (Ping)' : 'Test Connection'}</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 p-3 text-[11px] leading-relaxed text-amber-200" data-testid="settings-ai-security">
                  {isArabic
                    ? 'أمان الاعتماد: المفتاح يبقى في ذاكرة الصفحة فقط ولا يُحفظ في localStorage. لا توجد خزنة أصلية آمنة بعد، ولا يوجد وكيل شبكة أصلي؛ أغلق التطبيق لإزالة المفتاح. لا تستخدم مفتاحًا دائمًا أو عالي القيمة.'
                    : 'Credential security: the key remains in page memory only and is never written to localStorage. No native secure vault or native network proxy exists yet; close the app to discard it. Do not use a long-lived or high-value key.'}
                </div>
              </div>
  );

  const renderWorkspaceTab = () => (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'حالة تكامل خدمات Google Workspace العشر' : 'Google Workspace Hub 10 APIs Authorization Status'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isArabic
                      ? 'لا يوجد حساب Google متصل ولا رموز OAuth مخزنة. راجع نطاقات الخدمات العشر في مركز Google Workspace؛ التفويض الحي غير متاح في هذه المرحلة.'
                      : 'No Google account is connected and no OAuth token is stored. Review the 10 service scopes in the Google Workspace hub; live authorization is unavailable in this phase.'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    'Google Sheets',
                    'Gmail Inbox',
                    'Google Tasks',
                    'Google Forms',
                    'Google Contacts',
                    'Google Calendar',
                    'Google Picker',
                    'Google Slides',
                    'Google Chat',
                    'Google Classroom',
                  ].map((service, idx) => (
                    <div key={idx} className="bg-[#091a38] border border-[#133059] rounded-xl p-3 flex flex-col justify-between shadow-sm">
                      <span className="font-bold text-xs text-white mb-2">{service}</span>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-amber-300 font-mono font-semibold">
                          <Info className="w-3 h-3 text-amber-400" />
                          Sandbox Preview
                        </span>
                        <span className="text-slate-400 font-mono">OAuth Pending</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
  );

  const renderGuardTab = () => (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'قواعد الحماية والتنظيف التلقائي' : 'Automated System Guards & Cleaning Sentinel'}
                  </h3>
                </div>

                <div className="rounded-xl border border-rose-500/40 bg-rose-950/25 p-3 text-[11px] leading-relaxed text-rose-200" data-testid="settings-guard-notice">
                  {isArabic
                    ? 'غير منفذ: لا يوجد حارس سجل أو محرك تنظيف تلقائي أو كتم خصوصية. جميع المفاتيح معطلة ومطفأة افتراضيًا، ولا تُعدّل ملفاتك أو سجلك أو بدء التشغيل.'
                    : 'Not implemented: no registry sentinel, automatic cleanup or privacy-purge engine exists. All switches are disabled and off by default; none modifies your files, registry or startup.'}
                </div>
                <div className="space-y-3">
                  {[
                    {
                      labelEn: 'Block Unapproved Startup Additions Automatically',
                      labelAr: 'حظر أي تطبيق يحاول إضافة نفسه لبدء التشغيل بدون إذن',
                    },
                    {
                      labelEn: 'Auto-Purge Privacy Traces & Cache on Browser Exit',
                      labelAr: 'التنظيف التلقائي لآثار التصفح عند إغلاق المتصفح',
                    },
                    {
                      labelEn: 'Windows Registry Integrity Active Sentinel',
                      labelAr: 'مراقبة وحماية مسارات السجل العلوية HKLM/HKCU من التعديلات المشبوهة',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#081836] p-3.5 rounded-xl border border-[#14325a] opacity-80">
                      <span className="text-xs font-bold text-slate-200">{isArabic ? item.labelAr : item.labelEn}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-[9px] font-mono">{isArabic ? 'غير منفذ' : 'NOT IMPLEMENTED'}</span>
                        <input type="checkbox" checked={false} disabled aria-label={item.labelEn} className="w-5 h-5 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-not-allowed" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
  );

  const renderAppearanceTab = () => (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'تخصيص المظهر والسمات النيون الزجاجية' : 'KNOuX Dark Neon Glassmorphism Theme Settings'}
                  </h3>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-2">
                    {isArabic ? 'اختر النمط البصري النيون:' : 'Neon Color Accent Scheme:'}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'neon_cyan', label: 'KNOuX Royal Cyan', color: 'from-cyan-500 to-blue-600' },
                      { id: 'obsidian', label: 'Deep Space Obsidian', color: 'from-slate-700 to-slate-900' },
                      { id: 'cyber_purple', label: 'Cyberpunk Purple', color: 'from-purple-500 to-pink-600' },
                      { id: 'emerald_shield', label: 'Emerald Shield', color: 'from-emerald-500 to-teal-600' },
                    ].map((theme) => (
                      <button
                        type="button"
                        aria-pressed={colorTheme === theme.id}
                        key={theme.id}
                        onClick={() => {
                          setColorTheme(theme.id as any);
                          showToastMsg(isArabic
                            ? `حُدد "${theme.label}" كتفضيل. اضغط حفظ التفضيلات لتخزينه؛ التلوين العام للتطبيق غير موصول.`
                            : `"${theme.label}" selected as a preference. Press Save Preferences to store it; global accent theming is not connected.`);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2.5 transition ${
                          colorTheme === theme.id ? 'border-cyan-400 bg-[#0d254c]' : 'border-[#132e54] bg-[#091a38]'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full bg-gradient-to-r ${theme.color} shrink-0 border border-white/30`} />
                        <span className="text-xs font-bold text-white">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-[#14325a] bg-[#07162e] p-3" data-testid="settings-density">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">{isArabic ? 'كثافة الواجهة' : 'Interface density'}</span>
                    <div className="flex items-center gap-1.5">
                      {(['comfortable', 'compact'] as const).map((value) => (
                        <button
                          key={value}
                          type="button"
                          data-testid={`settings-density-${value}`}
                          onClick={() => { setDensity(value); showToastMsg(isArabic ? 'تغيرت كثافة هذه الصفحة. اضغط حفظ التفضيلات لتخزينها.' : 'This page density changed. Press Save Preferences to store it.'); }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${density === value ? 'bg-blue-600 text-white border-cyan-400' : 'bg-[#091a38] text-slate-300 border-[#143058]'}`}
                          aria-pressed={density === value}
                        >
                          {value === 'comfortable' ? (isArabic ? 'مريحة' : 'Comfortable') : (isArabic ? 'مضغوطة' : 'Compact')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-3" style={{ borderColor: ACCENT_PREVIEW[colorTheme] || '#22d3ee', background: 'rgba(4, 15, 32, 0.75)' }}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{isArabic ? 'معاينة التفضيل اللوني' : 'Accent preference preview'}</span>
                    <span className="w-24 h-2 rounded-full" style={{ background: ACCENT_PREVIEW[colorTheme] || '#22d3ee' }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {isArabic ? 'هذه معاينة محلية لهذه الصفحة فقط؛ لا تغيّر سمة التطبيق العامة.' : 'Page-local preview only; it does not change the global application theme.'}
                  </p>
                </div>
              </div>
  );

  const renderLanguageTab = () => (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Languages className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'اللغة والتوجيه ونظام الملاحة' : 'Language, RTL Direction & Regional Formats'}
                  </h3>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setLocale('en');
                      showToastMsg('Interface set to English');
                    }}
                    className={`px-5 py-3 rounded-xl border font-bold text-xs cursor-pointer transition ${
                      !isArabic ? 'bg-blue-600 text-white border-cyan-400' : 'bg-[#091a38] text-slate-300 border-[#143058]'
                    }`}
                  >
                    English (US)
                  </button>
                  <button
                    onClick={() => {
                      setLocale('ar');
                      showToastMsg('تم تغيير الواجهة إلى العربية');
                    }}
                    className={`px-5 py-3 rounded-xl border font-bold text-xs cursor-pointer transition ${
                      isArabic ? 'bg-blue-600 text-white border-cyan-400' : 'bg-[#091a38] text-slate-300 border-[#143058]'
                    }`}
                  >
                    العربية (Arabic RTL)
                  </button>
                </div>
              </div>
  );

  const renderImportPreview = () => {
    if (!importPreview) return null;
    const validityLabels = isArabic ? ['مرفوض', 'صالح'] : ['INVALID', 'VALID'];
    const validityLabel = validityLabels[Number(importPreview.valid)];
    return (
                  <div className="rounded-xl border border-[#1b3f70] bg-[#07162e] p-3 space-y-2" data-testid="settings-import-preview">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">{isArabic ? 'معاينة الاستيراد' : 'Import preview'}</span>
                      <span className={`text-[10px] font-mono ${importPreview.valid ? 'text-emerald-300' : 'text-rose-300'}`}>{validityLabel}</span>
                    </div>
                    {importPreview.errors.map((error) => <p key={error} className="text-[10.5px] text-rose-300">{error}</p>)}
                    {importPreview.valid ? (
                      importPreview.diff.length ? (
                        <div className="space-y-1">
                          {importPreview.diff.map((entry) => (
                            <div key={entry.key} className="flex items-center justify-between gap-2 text-[10.5px]">
                              <span className="font-mono text-slate-400">{entry.key}</span>
                              <span className="font-mono text-slate-500">{entry.from}</span>
                              <ChevronRight className="w-3 h-3 text-slate-500" />
                              <span className="font-mono text-cyan-300">{entry.to}</span>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-[10.5px] text-slate-400">{isArabic ? 'لا فروق في التفضيلات.' : 'No preference differences.'}</p>
                    ) : null}
                    <div className="flex items-center gap-2 pt-1">
                      <button type="button" onClick={applyImportedProfile} disabled={!importPreview.valid} className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[11px] font-bold">{isArabic ? 'تطبيق التفضيلات المستوردة' : 'Apply imported preferences'}</button>
                      <button type="button" onClick={() => setImportPreview(null)} className="px-3 py-1.5 rounded-lg bg-[#081329] border border-[#1b3f70] text-slate-300 text-[11px]">{isArabic ? 'إلغاء' : 'Cancel'}</button>
                    </div>
                  </div>
    );
  };

  const renderBackupTab = () => (
              <div className="space-y-5 animate-fadeIn">
                <div className="border-b border-[#0f274a] pb-3">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-cyan-400" />
                    {isArabic ? 'نسخ التفضيلات غير السرية واستيرادها' : 'Non-secret Preferences Backup & Import'}
                  </h3>
                </div>

                <p className="text-[10.5px] text-amber-200 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
                  {isArabic
                    ? 'لا تُنشئ هذه الصفحة نقطة استعادة Windows ولا تستعيد النظام. تصدير/استيراد التفضيلات فقط؛ استعادة النظام تخص Mission 11 Repair ولا تُنفذ هنا.'
                    : 'This page does not create a Windows restore point or restore the OS. It exports/imports preferences only; system restore belongs to Mission 11 Repair and is not executed here.'}
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExportProfile}
                    data-testid="settings-export"
                    className="px-4 py-2.5 rounded-xl bg-[#091e3e] hover:bg-[#122e5a] border border-cyan-500/40 text-cyan-300 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isArabic ? 'تصدير التفضيلات (JSON)' : 'Export Preferences (JSON)'}</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="settings-import"
                    className="px-4 py-2.5 rounded-xl bg-[#091e3e] hover:bg-[#122e5a] border border-[#1b3f70] text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isArabic ? 'معاينة استيراد تفضيلات' : 'Preview Preferences Import'}</span>
                  </button>
                  <button
                    onClick={handleResetProfile}
                    data-testid="settings-reset"
                    className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-bold transition cursor-pointer flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isArabic ? 'إعادة التفضيلات للافتراضي' : 'Reset Preferences'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    aria-label={isArabic ? 'ملف تفضيلات JSON' : 'Settings profile JSON file'}
                    onChange={(event) => { void handleImportFile(event.target.files?.[0] || null); event.currentTarget.value = ''; }}
                  />
                </div>

                <p className="text-[10.5px] text-slate-400" data-testid="settings-export-notice">
                  {isArabic
                    ? 'التصدير يشمل التفضيلات غير السرية فقط. لا تُصدّر مفاتيح API أو رموز OAuth أو أي بيانات اعتماد. الاستيراد يعاين الفروق قبل التطبيق.'
                    : 'Export includes non-secret preferences only. API keys, OAuth tokens and credentials are never exported. Import previews the diff before applying.'}
                </p>

                {importError ? <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-[11px] text-rose-200" role="alert">{importError}</div> : null}
                {renderImportPreview()}

              </div>
  );

  return (
    <div
      ref={pageRef}
      data-testid="settings-root"
      data-density={density}
      data-accent={colorTheme}
      style={{ '--settings-accent': ACCENT_PREVIEW[colorTheme] || ACCENT_PREVIEW.neon_cyan } as React.CSSProperties}
      className={`settings-root flex flex-col h-screen w-screen bg-[#040b18] text-slate-100 overflow-hidden font-sans select-none ${isArabic ? 'rtl' : 'ltr'}`}
    >
      {/* Top Titlebar */}
      <KNOuXTitleBar
        sectionName={isArabic ? 'الإعدادات وتخصيص المحرك' : 'Settings & Engine Configuration'}
        sectionSubtitle={isArabic ? 'تكوين الأداء والخدمات والذكاء الاصطناعي' : 'Performance, Services & AI Tuning'}
        onNavigateHome={() => handleNavigate('home')}
        isArabic={isArabic}
        onToggleArabic={toggleLocale}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Unified Sidebar */}
        <KNOuXSidebar
          activeSection="settings"
          onNavigate={handleNavigate}
          isArabic={isArabic}
        />

        {/* Main Body Canvas + Reserved Telemetry Dock */}
        <div className="flex-1 flex flex-col min-h-0">
        <main
          className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-gradient-to-b from-[#040b18] via-[#06142a] to-[#040b18] p-4 sm:p-5 gap-4 knx-custom-scrollbar"
          style={density === 'compact' ? { gap: '8px', padding: '12px' } : undefined}
        >

          {/* Toast Notification */}
          {toast && (
            <div className="fixed top-14 right-6 z-50 bg-gradient-to-r from-cyan-900 to-blue-900 border border-cyan-400/60 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-fadeIn" data-testid="settings-toast">
              <CheckCircle2 className="w-4 h-4 text-cyan-300" />
              <span className="font-semibold">{toast}</span>
            </div>
          )}

          {/* Ultra-Sleek HUD Header Banner */}
          <div className="shrink-0 min-h-fit relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#061833] via-[#0b264e] to-[#06142a] border border-cyan-400/40 p-4 sm:p-5 shadow-[0_0_25px_rgba(14,165,233,0.22)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="absolute -top-10 -right-10 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

            <div className="z-10 flex items-start gap-4">
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1e40af] via-[#2563eb] to-[#38bdf8] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.6)] border border-cyan-300/60 shrink-0">
                <Settings className="w-7 h-7 text-white animate-spin-slow" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-[#061833] animate-pulse" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-400/20 text-cyan-200 text-[10px] font-mono font-bold tracking-wider uppercase border border-cyan-400/40">
                    KNOuX Control Center v2.4
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 border border-amber-500/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {isArabic ? 'تفضيلات فقط — لا يوجد مزود محرك موصول' : 'Preferences only — no engine provider connected'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-300 tracking-tight">
                  {isArabic ? 'مركز تخصيص وإعدادات KNOuX الفائقة' : 'KNOuX Engine & Services Control Center'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium leading-relaxed">
                  {isArabic
                    ? 'تفضيلات محلية غير سرية، وحالة القدرات الحقيقية لمحرك الأداء والحماية ومفاتيح الذكاء الاصطناعي وGoogle Workspace. لا يوجد محرك أداء أو حارس تلقائي أو اتصال Google أو AI مباشر في هذه المرحلة.'
                    : 'Local non-secret preferences plus honest capability status for engine, guards, AI keys and Google Workspace. No engine executor, automatic guard, Google account or live AI is connected in this phase.'}
                </p>
              </div>
            </div>

            <div className="z-10 flex items-center gap-2">
              <button
                onClick={handleSaveAll}
                data-testid="settings-save"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold shadow-[0_0_20px_rgba(38,198,218,0.5)] border border-cyan-300/50 transition cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-white" />
                <span>{isArabic ? 'حفظ التفضيلات' : 'Save Preferences'}</span>
              </button>
            </div>
          </div>

          {/* Navigation Category Tabs Ribbon */}
          <div className="bg-[#071429]/90 border border-[#112a4e] rounded-2xl p-2 flex flex-wrap items-center gap-1.5 shadow-md">
            {[
              { id: 'engine', labelEn: 'Engine & Turbo Hardware', labelAr: 'الأداء والعتاد', icon: Cpu },
              { id: 'ai_keys', labelEn: 'AI Copilot & OpenRouter Keys', labelAr: 'مفاتيح الذكاء الاصطناعي', icon: Key },
              { id: 'workspace', labelEn: 'Google Workspace Hub (10 APIs)', labelAr: 'خدمات Google', icon: Globe },
              { id: 'guard', labelEn: 'Automated Protection & Guards', labelAr: 'الحماية التلقائية', icon: Shield },
              { id: 'appearance', labelEn: 'Neon Glass Customization', labelAr: 'المظهر والسمات', icon: Palette },
              { id: 'language', labelEn: 'Language & Locale', labelAr: 'اللغة والتوجيه', icon: Languages },
              { id: 'backup', labelEn: 'Profile Preferences Backup', labelAr: 'نسخ التفضيلات واستعادتها', icon: Database },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-testid={`settings-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.6)] border border-cyan-400/50'
                      : 'bg-[#0a1b38] hover:bg-[#122a52] text-slate-300 border border-[#142f57]'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                  <span>{isArabic ? tab.labelAr : tab.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Panel Body */}
          <div className="bg-[#071329]/90 border border-[#11294a] rounded-2xl p-5 shadow-xl space-y-6">

            {/* TAB 1: Engine Performance & Hardware */}
            <CinematicEntrySettings />
            {activeTab === 'engine' && renderEngineTab()}

            {/* TAB 2: AI Copilot & API Keys */}
            {activeTab === 'ai_keys' && renderAiKeysTab()}

            {/* TAB 3: Google Workspace Hub */}
            {activeTab === 'workspace' && renderWorkspaceTab()}

            {/* TAB 4: Automated Guards */}
            {activeTab === 'guard' && renderGuardTab()}

            {/* TAB 5: Appearance & Neon Glass */}
            {activeTab === 'appearance' && renderAppearanceTab()}

            {/* TAB 6: Language & Locale */}
            {activeTab === 'language' && renderLanguageTab()}

            {/* TAB 7: Backup & System Restore */}
            {activeTab === 'backup' && renderBackupTab()}
          </div>

        </main>

          {/* Reserved telemetry dock — sits outside the scrolling canvas so the
              console can never be pushed below the fold or paint over settings. */}
          <footer className="shrink-0 bg-[#061124] border-t border-[#11294a] px-4 sm:px-5 py-2.5 z-30" data-testid="settings-footer">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
              <span className="text-slate-300">
                {isArabic ? 'ملف التفضيلات: محلي وغير سري فقط' : 'Preferences profile: local, non-secret only'}
              </span>
              <span className="font-mono text-amber-300">
                {isArabic ? 'الأسرار: ذاكرة الجلسة فقط — الخزنة الأصلية غير موصولة' : 'Secrets: session memory only — native vault not connected'}
              </span>
              <span className="font-mono text-slate-400">
                {isArabic ? 'الذكاء الاصطناعي المباشر: غير متصل' : 'Live AI: not connected'}
              </span>
              {profileSavedAt ? <span className="font-mono text-slate-500">{isArabic ? 'آخر حفظ' : 'Saved'} {profileSavedAt.slice(0, 19).replace('T', ' ')}</span> : null}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
