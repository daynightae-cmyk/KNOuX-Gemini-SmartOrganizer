/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * KNOuX API Key Configuration Modal
 *
 * The typed key is handed straight to the Main-process AI bridge and dropped
 * from this component on submit. The renderer never stores it and never contacts
 * a provider itself; verification is a bounded Main-side request.
 */

import React, { useEffect, useState } from 'react';
import { AiProviderIcon } from '../app/AppIcon';
import { Key, Shield, Sparkles, CheckCircle2, X, Lock, Zap, AlertTriangle, Info } from 'lucide-react';
import type { AiProviderId } from '../../../shared/native-contracts';
import { configureAiProvider, hasAiBridge } from '../../lib/ai-bridge';

interface ApiKeySetupModalProps {
  isOpen: boolean;
  /** Called after Main accepted the credential. No key material is passed. */
  onConfigured: () => void;
  onSkip: () => void;
  locale?: 'en' | 'ar';
}

export const ApiKeySetupModal: React.FC<ApiKeySetupModalProps> = ({
  isOpen,
  onConfigured,
  onSkip,
  locale = 'en',
}) => {
  const isAr = locale === 'ar';
  const [provider, setProvider] = useState<AiProviderId>('openrouter');
  const [keyValue, setKeyValue] = useState('');
  const [persist, setPersist] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const bridgeAvailable = hasAiBridge();

  // Never keep a typed credential in this component longer than it is needed.
  useEffect(() => {
    if (!isOpen) {
      setKeyValue('');
      setTestStatus('idle');
      setStatusMessage('');
      setIsTesting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSkip = () => {
    setKeyValue('');
    onSkip();
  };

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = keyValue.trim();
    if (!cleanKey) return;

    setIsTesting(true);
    setTestStatus('idle');
    setStatusMessage('');

    // Shape check only: it prevents an obvious paste mistake from reaching the
    // network, and it never echoes the value back.
    let formatValid = false;
    if (provider === 'openrouter') {
      formatValid = cleanKey.startsWith('sk-or-') || cleanKey.length >= 24;
    } else if (provider === 'openai') {
      formatValid = cleanKey.startsWith('sk-') && cleanKey.length >= 24;
    } else if (provider === 'anthropic') {
      formatValid = cleanKey.startsWith('sk-ant-') || cleanKey.length >= 24;
    }

    if (!formatValid) {
      setIsTesting(false);
      setTestStatus('error');
      setStatusMessage(
        isAr
          ? 'تنسيق المفتاح يبدو غير صالح للمزود المختار. يرجى التحقق من المفتاح.'
          : `Key format appears unusual for ${provider}. Please verify prefix and token structure.`
      );
      return;
    }

    // One-way handoff to Main, then forget it here immediately.
    const result = await configureAiProvider({ provider, apiKey: cleanKey, persist });
    setKeyValue('');
    if (result.ok && result.data.configured) {
      const persistedOk = result.data.persisted;
      setTestStatus(persistedOk || !persist ? 'success' : 'warning');
      setStatusMessage(
        persistedOk
          ? isAr
            ? 'تم تسليم المفتاح للمحرك الأصلي وحفظه مشفراً عبر حماية Windows.'
            : 'Credential handed to the native engine and stored encrypted under Windows protection.'
          : persist
            ? isAr
              ? 'تم تسليم المفتاح للذاكرة المؤقتة للمحرك الأصلي فقط: تشفير Windows غير متاح في هذا التشغيل.'
              : 'Credential held in Main-process session memory only: Windows credential encryption is unavailable in this runtime.'
            : isAr
              ? 'تم تسليم المفتاح لذاكرة الجلسة في المحرك الأصلي. لن يبقى بعد إغلاق التطبيق.'
              : 'Credential held in Main-process session memory. It is gone when KNOuX closes.'
      );
      // The assistant reads its state from the bridge, not from this component.
      onConfigured();
    } else {
      setTestStatus('error');
      setStatusMessage(
        result.ok
          ? isAr ? 'رفض المحرك الأصلي المفتاح.' : 'The native engine rejected the credential.'
          : result.error.message
      );
    }
    setIsTesting(false);
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-sans animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md bg-[#040a16] border border-[#1b3f70] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden relative text-slate-100">
        
        {/* Top Glow & Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
        
        <div className="p-5 pb-4 border-b border-[#0f2444] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.7)] border border-cyan-400/40 shrink-0">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                {isAr ? 'تكوين مفتاح الذكاء الاصطناعي' : 'API Key Configuration'}
              </h2>
              <p className="text-xs text-cyan-400 font-mono">
                {isAr ? 'مطلوب لتشغيل المساعد الذكي وخدمات الـ AI' : 'Required to initialize KNOuX AI Copilot'}
              </p>
            </div>
          </div>

          <button
            onClick={onSkip}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Skip for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleTestAndSave} className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#08152c] border border-[#15325e] text-slate-300 text-[11px] leading-relaxed flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              {isAr
                ? 'يرجى إدخال مفتاح الـ API (مثل مفتاح OpenRouter، OpenAI Code Console v2، أو Anthropic) لتفعيل المساعد الذكي فوراً في النظام.'
                : 'Please input your API key securely (OpenRouter, OpenAI Code Console v2, or Anthropic ANTHROPIC_API_KEY) to initialize AI services immediately.'}
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              {isAr ? 'اختر المزود (AI Provider)' : 'Select AI Provider'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProvider('openrouter')}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  provider === 'openrouter'
                    ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'border-slate-800 bg-[#061124] text-slate-400'
                }`}
              >
                <AiProviderIcon provider="openrouter" /> OpenRouter
              </button>
              <button
                type="button"
                onClick={() => setProvider('openai')}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  provider === 'openai'
                    ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'border-slate-800 bg-[#061124] text-slate-400'
                }`}
              >
                <AiProviderIcon provider="openai" /> OpenAI
              </button>
              <button
                type="button"
                onClick={() => setProvider('anthropic')}
                className={`p-2 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                  provider === 'anthropic'
                    ? 'border-cyan-400 bg-cyan-950/50 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                    : 'border-slate-800 bg-[#061124] text-slate-400'
                }`}
              >
                <AiProviderIcon provider="anthropic" /> Anthropic
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              {isAr ? 'مفتاح المصادقة (API Key / Token)' : 'API Key / Token Value'}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder={
                  provider === 'openrouter'
                    ? 'sk-or-v1-...'
                    : provider === 'openai'
                    ? 'sk-proj-...'
                    : 'sk-ant-...'
                }
                className="w-full bg-[#071328] border border-[#1b3f70] rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono text-xs shadow-inner"
              />
              <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {testStatus === 'success' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {testStatus === 'warning' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-semibold animate-in fade-in">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {!bridgeAvailable && (
            <div className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-[11px] leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                {isAr
                  ? 'جسر المفاتيح الأصلي غير متاح في معاينة المتصفح. شغّل تطبيق سطح المكتب لتسليم المفتاح لعملية Main.'
                  : 'The native credential bridge is unavailable in a browser preview. Run the KNOuX desktop app so the key can be handed to the Main process.'}
              </span>
            </div>
          )}

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#08152c] border border-[#15325e] cursor-pointer">
            <input
              type="checkbox"
              checked={persist}
              onChange={(event) => setPersist(event.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 accent-cyan-400 shrink-0"
              data-testid="ai-persist-optin"
            />
            <span className="text-[11px] leading-relaxed text-slate-300">
              {isAr
                ? 'أبقِ المفتاح بعد إغلاق التطبيق (مشفر بحماية Windows DPAPI). إن لم تحدده، يبقى في ذاكرة جلسة المحرك الأصلي فقط ويُمسح عند الإغلاق.'
                : 'Keep this key after KNOuX closes (encrypted with Windows DPAPI). Left unchecked, it stays in Main-process session memory only and is erased on quit.'}
            </span>
          </label>

          {/* Security storage boundary note — the actual, measured boundary. */}
          <div className="text-[10px] text-slate-400 leading-normal bg-[#061021] p-2.5 rounded-lg border border-[#0d213d]">
            <span className="text-cyan-400 font-bold">{isAr ? 'بيئة التخزين: ' : 'Storage Boundary: '}</span>
            {isAr
              ? 'يُسلَّم المفتاح إلى عملية Main في التطبيق المكتبي ولا يُعاد للمعروض. لا يُخزَّن في localStorage ولا في ملف التفضيلات. يبقى في الذاكرة افتراضياً.'
              : 'The key is handed to the desktop Main process and is never returned to the renderer. It is not written to localStorage or the settings profile, and by default it lives in memory only.'}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#0f2444]">
            <button
              type="button"
              onClick={handleSkip}
              className="text-slate-400 hover:text-slate-200 text-xs font-medium cursor-pointer"
            >
              {isAr ? 'تخطي مؤقتاً (وضع غير متصل)' : 'Skip for now (Offline Mode)'}
            </button>

            <button
              type="submit"
              disabled={!keyValue.trim() || isTesting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-[0_0_16px_rgba(37,99,235,0.6)] border border-cyan-400/40 flex items-center gap-2 cursor-pointer transition-all"
            >
              {isTesting ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>{isAr ? 'جاري التحقق...' : 'Verifying...'}</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-cyan-200" />
                  <span>{isAr ? 'حفظ وتفعيل فوري' : 'Save & Initialize AI'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ApiKeySetupModal;
