/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * KNOuX AI Assistant Chatbot Copilot
 *
 * The credential is handed to the Main-process AI bridge and never held here.
 * Completions go through the fixed `knoux:ai:v1:complete` channel, so this
 * component cannot choose a network destination and cannot leak a key into a
 * renderer log. Without the desktop bridge it says so instead of pretending.
 */

import React, { useState, useEffect, useRef } from 'react';
import { AiProviderIcon } from '../app/AppIcon';
import { getAiSession, refreshAiSession, resetAiSession } from '../../lib/ai-session';
import { cancelAiRequests, clearAiProvider, configureAiProvider, hasAiBridge, requestAiCompletion } from '../../lib/ai-bridge';
import type { AiChatMessage, AiProviderId } from '../../../shared/native-contracts';
import {
  Sparkles,
  MessageSquare,
  X,
  Minimize2,
  Send,
  Key,
  CheckCircle2,
  Settings,
  Shield,
  Zap,
  Bot,
  User,
  HelpCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { KNOUX_ASSISTANT_TOGGLE_EVENT } from '../shell/KNOuXShellComponents';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

interface KNOuXAssistantChatProps {
  currentSection?: string;
  locale?: 'en' | 'ar';
}

export const KNOuXAssistantChat: React.FC<KNOuXAssistantChatProps> = ({
  currentSection = 'home',
  locale = 'en',
}) => {
  const isAr = locale === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Provider selection and a transient key draft. The draft is handed to Main
  // and immediately forgotten; this component never holds a credential.
  const [provider, setProvider] = useState<AiProviderId>(() => getAiSession().provider);
  const [keyDraft, setKeyDraft] = useState('');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(() => getAiSession().hasKey);
  const [bridgeReady, setBridgeReady] = useState<boolean>(() => hasAiBridge());
  const [credentialScope, setCredentialScope] = useState<string>(() => getAiSession().storage);

  // Chat State
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: isAr
        ? 'مرحباً بك! يعمل مساعد KNOuX عبر الجسر الأصلي للمفاتيح: يُسلَّم المفتاح لعملية Main ولا يعود للمعروض. افتح إعدادات المزود لتسليم مفتاح، وستُنفَّذ الطلبات في المحرك الأصلي.'
        : 'Hello! KNOuX Copilot runs through the native credential bridge: a key is handed to the Main process and never returned to this view. Open provider settings to hand over a key, and requests will execute in the native engine.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Shared-chrome launcher: the titlebar trigger dispatches this event so the
  // assistant stays reachable from every route without a floating overlay.
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener(KNOUX_ASSISTANT_TOGGLE_EVENT, handleToggle);
    return () => window.removeEventListener(KNOUX_ASSISTANT_TOGGLE_EVENT, handleToggle);
  }, []);

  // Escape closes the panel, and focus returns to the launcher chrome.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Sync the honest bridge state each time the panel opens.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setBridgeReady(hasAiBridge());
    void refreshAiSession().then((state) => {
      if (cancelled) return;
      setIsKeySaved(state.hasKey);
      setCredentialScope(state.storage);
      if (state.hasKey) setProvider(state.provider);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const pushAssistantNote = (text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: 'ai', text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const draft = keyDraft.trim();
    if (!draft) return;
    // Forget the renderer copy first: Main owns it from here on.
    setKeyDraft('');
    const result = await configureAiProvider({ provider, apiKey: draft });
    const state = await refreshAiSession();
    setIsKeySaved(state.hasKey);
    setCredentialScope(state.storage);
    if (result.ok && result.data.configured) {
      setIsSettingsOpen(false);
      pushAssistantNote(
        isAr
          ? 'تسلّم محرك Windows المفتاح. يُنفَّذ كل طلب من عملية Main ولا يصل المفتاح إلى هذا العرض.'
          : 'The native engine holds the key now. Every request runs in the Main process; this view never sees the credential again.'
      );
    } else {
      pushAssistantNote(
        result.ok
          ? isAr ? 'رفض محرك Windows المفتاح.' : 'The native engine rejected the credential.'
          : result.error.message
      );
    }
  };

  const handleClearKey = async () => {
    await clearAiProvider();
    resetAiSession();
    setKeyDraft('');
    setIsKeySaved(false);
    setCredentialScope('empty');
  };

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    const userText = inputMessage.trim();
    setInputMessage('');

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsGenerating(true);

    // Build the bounded conversation the bridge will forward. Only the last few
    // real turns are sent; the bridge applies its own hard limits on top.
    const history: AiChatMessage[] = messages
      .slice(-10)
      .map((entry) => ({ role: entry.sender === 'user' ? 'user' : 'assistant', content: entry.text }) as AiChatMessage)
      .filter((entry) => entry.content.trim().length > 0);
    history.push({ role: 'user', content: userText });

    try {
      let aiResponseText = '';

      if (isKeySaved && bridgeReady) {
        // Single bounded completion, executed inside the Main process.
        const result = await requestAiCompletion({ messages: history });
        if (result.ok && result.data.ok && result.data.text) {
          aiResponseText = result.data.text;
        } else if (result.ok) {
          aiResponseText = isAr
            ? `رفض المزود الطلب (HTTP ${result.data.status}): ${result.data.error?.message || 'تحقق من صحة المفتاح.'}`
            : `Provider error (HTTP ${result.data.status}): ${result.data.error?.message || 'Please check your API key.'}`;
        } else {
          aiResponseText = isAr
            ? `تعذّر تنفيذ الطلب عبر الجسر الأصلي: ${result.error.message}`
            : `The native bridge could not run the request: ${result.error.message}`;
        }
      } else {
        // No simulated "AI answer". The assistant states what is missing.
        aiResponseText = isAr
          ? `لا يوجد مفتاح لدى الجسر الأصلي${bridgeReady ? '' : ' والجسر غير متاح أصلاً خارج تطبيق سطح المكتب'}. افتح إعدادات المزود (⚙️) وسلّم مفتاح ${provider} لتشغيل إجابات حقيقية. القسم النشط حالياً: "${currentSection}".`
          : `No credential is held by the native bridge${bridgeReady ? '' : ', and the bridge only exists in the desktop app'}. Open provider settings (⚙️) and hand over your ${provider} key to get live answers. Active section: "${currentSection}".`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      // Never interpolate a raw thrown value: it can carry a request context.
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: isAr ? 'تعذّر إتمام الطلب عبر الجسر الأصلي.' : 'The request did not complete through the native bridge.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelGeneration = async () => {
    await cancelAiRequests();
    setIsGenerating(false);
  };

  return (
    <>
      {/* The launcher lives in the shared titlebar chrome (a reserved slot) so the
          assistant can never float over page content, table rows, or footer bars. */}
      {/* Chat Window Modal / Floating Panel */}
      {isOpen && (
        <div
          dir={isAr ? 'rtl' : 'ltr'}
          className="fixed bottom-[7.5rem] end-6 z-50 w-[380px] sm:w-[420px] h-[min(560px,calc(100vh-11rem))] bg-[#040a16] border border-[#1b3f70] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300 font-sans"
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-[#061226] border-b border-[#0f2444] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.6)]">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white tracking-wide">KNOuX AI Copilot</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase border ${
                      isKeySaved
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    }`}
                  >
                    {isKeySaved ? (isAr ? 'مفتاح في المحرك' : 'Key in Main') : (isAr ? 'يحتاج مفتاح' : 'Needs Key')}
                  </span>
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">
                  {provider === 'openrouter' ? 'OpenRouter' : provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} ·{' '}
                  {bridgeReady ? (isKeySaved ? `Main bridge · ${credentialScope}` : 'Main bridge · no key') : 'desktop bridge unavailable'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsSettingsOpen((prev) => !prev)}
                className="p-1.5 rounded-lg bg-[#081730] hover:bg-[#11274f] text-slate-300 hover:text-white border border-[#183661] transition cursor-pointer"
                title="API Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-[#081730] hover:bg-rose-950 hover:text-rose-300 text-slate-400 border border-[#183661] transition cursor-pointer"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Drawer (API Key Input) */}
          {isSettingsOpen && (
            <div className="p-3.5 bg-[#071328] border-b border-[#15325d] animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <Key className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إعدادات مفتاح الـ API' : 'AI Provider & Key Setup'}</span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveKey} className="space-y-2.5 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    {isAr ? 'اختر المزود (Provider)' : 'Select AI Provider'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setProvider('openrouter')}
                      className={`p-1.5 rounded-lg border text-center font-semibold transition cursor-pointer ${
                        provider === 'openrouter'
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      <AiProviderIcon provider="openrouter" /> OpenRouter
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvider('openai')}
                      className={`p-1.5 rounded-lg border text-center font-semibold transition cursor-pointer ${
                        provider === 'openai'
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      <AiProviderIcon provider="openai" /> OpenAI
                    </button>
                    <button
                      type="button"
                      onClick={() => setProvider('anthropic')}
                      className={`p-1.5 rounded-lg border text-center font-semibold transition cursor-pointer ${
                        provider === 'anthropic'
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      <AiProviderIcon provider="anthropic" /> Anthropic
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    {isAr ? 'أدخل مفتاح الـ API (API Key)' : 'Enter API Key'}
                  </label>
                  <input
                    type="password"
                    value={keyDraft}
                    onChange={(e) => setKeyDraft(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={
                      provider === 'openrouter' ? 'sk-or-v1-...' : provider === 'anthropic' ? 'sk-ant-...' : 'sk-proj-...'
                    }
                    className="w-full bg-[#040a16] border border-[#1b3f70] rounded-lg px-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-mono text-xs"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  {isKeySaved ? (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="text-rose-400 hover:underline text-[11px]"
                    >
                      {isAr ? 'محو المفتاح من المحرك' : 'Erase Key from Engine'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      {isAr ? 'يُسلَّم للمحرك الأصلي؛ لا localStorage ولا ملف تفضيلات' : 'Handed to the native engine; no localStorage, no profile file'}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-md"
                  >
                    {isAr ? 'تسليم للمحرك' : 'Hand to Engine'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 knx-custom-scrollbar bg-[#050e1f]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-cyan-950 border border-cyan-500/40 text-cyan-300'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[78%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-md'
                      : 'bg-[#08162e] border border-[#17345f] text-slate-200 rounded-tl-none shadow-inner'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl bg-[#08162e] border border-[#17345f] text-slate-300 rounded-tl-none flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span className="text-xs">{isAr ? 'جاري التنفيذ في المحرك الأصلي...' : 'Running in the native engine...'}</span>
                  <button
                    type="button"
                    onClick={handleCancelGeneration}
                    className="ms-auto px-2 py-0.5 rounded-md bg-[#081730] hover:bg-[#11274f] text-[10px] text-rose-300 border border-[#183661] cursor-pointer"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div className="px-3 py-1.5 bg-[#061226] border-t border-[#0f2444] flex items-center gap-1.5 overflow-x-auto knx-custom-scrollbar shrink-0">
            <button
              onClick={() => setInputMessage(isAr ? 'كيف أنظف مخلفات النظام بأمان؟' : 'How can I safely clean junk files?')}
              className="px-2.5 py-1 rounded-full bg-[#091833] hover:bg-[#12274f] text-[10px] text-cyan-300 border border-[#173766] whitespace-nowrap transition cursor-pointer"
            >
              {isAr ? '🧹 تنظيف المخلفات' : '🧹 Clean Junk Files'}
            </button>
            <button
              onClick={() => setInputMessage(isAr ? 'ما هي التطبيقات التي تعمل عند بدء التشغيل؟' : 'Check startup apps optimization')}
              className="px-2.5 py-1 rounded-full bg-[#091833] hover:bg-[#12274f] text-[10px] text-cyan-300 border border-[#173766] whitespace-nowrap transition cursor-pointer"
            >
              {isAr ? '🚀 بدء التشغيل' : '🚀 Startup Apps'}
            </button>
            <button
              onClick={() => setInputMessage(isAr ? 'تحليل حالة التخزين' : 'Analyze storage volumes')}
              className="px-2.5 py-1 rounded-full bg-[#091833] hover:bg-[#12274f] text-[10px] text-cyan-300 border border-[#173766] whitespace-nowrap transition cursor-pointer"
            >
              {isAr ? '💾 مساحة التخزين' : '💾 Storage Analysis'}
            </button>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#040a16] border-t border-[#0f2444] flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isAr ? 'اطلب مساعدة من مساعد KNOuX الذكي...' : 'Ask KNOuX AI Copilot anything...'}
              className="flex-1 bg-[#071328] border border-[#173766] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isGenerating}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white flex items-center justify-center shadow-md transition cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default KNOuXAssistantChat;
