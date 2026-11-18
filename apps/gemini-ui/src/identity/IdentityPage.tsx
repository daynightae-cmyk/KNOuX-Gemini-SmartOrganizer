import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowUpRight, BadgeCheck, Check, Code2, Copy, Cpu, Facebook,
  Github, Globe, Languages, Layers, Mail, MessageCircle, Moon, Music2, Phone,
  ShieldCheck, Sparkles, Sun, type LucideIcon,
} from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';
import type { IdentityLinkEntry } from '../../shared/native-contracts';
import {
  CONTACT, IDENTITY_LINKS, PILLARS, PRODUCT_FACTS, PRODUCT_VERSION, ROLES,
  type IdentityLink,
} from './profile';
import {
  copyIdentityValue, displayIdentityUri, hasIdentityShell,
  loadIdentityLinks, openIdentityLink,
} from './native';
import './identity.css';

const t = (ar: boolean, en: string, value: string) => (ar ? value : en);

const LINK_ICONS: Record<string, LucideIcon> = {
  website: Globe,
  product: Sparkles,
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  github_engineer: Github,
  github_company: Github,
  facebook_founder: Facebook,
  facebook_company: Facebook,
  tiktok: Music2,
};

const PILLAR_ICONS: Record<string, LucideIcon> = {
  windows: Cpu,
  consent: ShieldCheck,
  ai: Sparkles,
  design: Layers,
};

interface IdentityPageProps {
  onClose?: () => void;
}

/**
 * KNOuX — Founder & Developer.
 *
 * A real product surface, not a static poster: the destination table comes from
 * the native identity bridge, every row opens through the operating system, and
 * each displayed value can be copied. Nothing here is measured or invented; the
 * only numbers are the ones the repository can prove.
 */
export function IdentityPage({ onClose }: IdentityPageProps) {
  const navigation = useNavigation();
  const ar = navigation.isArabic;
  const [links, setLinks] = useState<IdentityLinkEntry[]>(() =>
    // First paint uses the reviewed mirror; the native table replaces it when
    // the handshake answers, so the surface is never empty or fake.
    [...IDENTITY_LINKS],
  );
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mode = hasIdentityShell() ? 'native' : 'browser';

  useEffect(() => {
    let active = true;
    void loadIdentityLinks().then((entries) => {
      if (active) setLinks(entries);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => () => {
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
  }, []);

  const announce = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const close = useCallback(() => {
    if (onClose) onClose();
    else navigation.navigateTo('home');
  }, [navigation, onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const open = useCallback(async (entry: IdentityLinkEntry) => {
    setError(null);
    setBusy(entry.id);
    try {
      const result = await openIdentityLink(entry.id);
      if (result.mode === 'unavailable') {
        setError(t(ar, 'No link handler is available in this environment.', 'لا يوجد معالج روابط متاح في هذه البيئة.'));
      } else {
        announce(t(ar, `Opened ${entry.labelAr} in your system.`, `تم فتح ${entry.labelAr} في نظامك.`));
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(message);
    } finally {
      setBusy(null);
    }
  }, [announce, ar]);

  const copy = useCallback(async (value: string, label: string) => {
    const copied = await copyIdentityValue(value);
    if (copied) announce(t(ar, `Copied ${label}`, `تم نسخ ${label}`));
    else setError(t(ar, 'The clipboard write was refused.', 'تم رفض الكتابة إلى الحافظة.'));
  }, [announce, ar]);

  const orderedLinks = useMemo(() => {
    const source = links.length ? links : [];
    const rank = ['website', 'product', 'email', 'phone', 'whatsapp', 'github_engineer', 'github_company', 'facebook_founder', 'facebook_company', 'tiktok'];
    return [...source].sort((a, b) => rank.indexOf(a.id) - rank.indexOf(b.id));
  }, [links]);

  const roles = ROLES.map((role) => (ar ? role.ar : role.en));

  return (
    <div
      className="knx-identity"
      data-testid="identity-page"
      data-identity-mode={mode}
      dir={ar ? 'rtl' : 'ltr'}
      lang={ar ? 'ar' : 'en'}
    >
      <div className="id-atmosphere" aria-hidden="true" />

      <div className="id-bar">
        <button type="button" className="id-bar-back" onClick={close} data-testid="identity-back">
          <ArrowLeft aria-hidden="true" />
          <span>{t(ar, 'Back to workspace', 'العودة إلى مساحة العمل')}</span>
        </button>
        <div className="id-bar-brand" aria-hidden="true">
          <span className="id-bar-mark">K</span>
          <span className="id-bar-word">KNOUX</span>
        </div>
        <div className="id-bar-actions">
          <button
            type="button"
            data-testid="identity-locale"
            className="id-bar-btn"
            onClick={navigation.toggleLocale}
            title={t(ar, 'Switch to English', 'التبديل إلى الإنجليزية')}
          >
            <Languages aria-hidden="true" />
            <span>{ar ? 'English' : 'العربية'}</span>
          </button>
          <button
            type="button"
            data-testid="identity-theme"
            className="id-bar-btn"
            onClick={navigation.toggleTheme}
            aria-pressed={navigation.theme === 'light'}
            title={navigation.theme === 'light'
              ? t(ar, 'Switch to dark theme', 'التبديل إلى الوضع الداكن')
              : t(ar, 'Switch to light theme', 'التبديل إلى الوضع الفاتح')}
          >
            {navigation.theme === 'light' ? <Moon aria-hidden="true" /> : <Sun aria-hidden="true" />}
          </button>
          <button
            type="button"
            className="id-bar-btn id-bar-close"
            onClick={close}
            aria-label={t(ar, 'Close identity page', 'إغلاق صفحة الهوية')}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      </div>

      <main className="id-scroll" id="identity-main">
        <section className="id-hero" data-testid="identity-hero">
          <div className="id-portrait" aria-hidden="true">
            <span className="id-portrait-rings" />
            <span className="id-portrait-core">
              <span className="id-portrait-initials">SE</span>
              <span className="id-portrait-ar" lang="ar" dir="rtl">ص</span>
            </span>
            <span className="id-portrait-badge">
              <BadgeCheck />
            </span>
          </div>

          <div className="id-intro">
            <p className="id-eyebrow">
              <span className="id-eyebrow-dot" aria-hidden="true" />
              {t(ar, 'KNOUX · Founder & Developer', 'KNOUX · المؤسس والمطوّر')}
            </p>
            <h1 ref={titleRef} tabIndex={-1} className="id-name">
              Eng. Sadek Elgazar
            </h1>
            <p className="id-name-ar"><bdi lang="ar" dir="rtl">م. صادق الجزار</bdi></p>
            <p className="id-lede">
              {t(ar,
                'Founder of KNOUX. I build Windows-first products where every visible control is backed by a real capability — measured, consent-gated and reversible.',
                'مؤسس KNOUX. أبني منتجات تعمل على Windows أولًا، حيث كل زر ظاهر مدعوم بقدرة حقيقية — مقيسة، بموافقة صريحة، وقابلة للتراجع.')}
            </p>

            <ul className="id-roles" data-testid="identity-roles" aria-label={t(ar, 'Roles', 'الأدوار')}>
              {roles.map((role) => (
                <li key={role}>{role}</li>
              ))}
            </ul>

            <div className="id-actions">
              <button
                type="button"
                className="id-action id-action-primary"
                data-testid="identity-action-whatsapp"
                onClick={() => {
                  const entry = orderedLinks.find((link) => link.id === 'whatsapp');
                  if (entry) void open(entry);
                }}
                disabled={!orderedLinks.length || busy === 'whatsapp'}
              >
                <MessageCircle aria-hidden="true" />
                <span>{t(ar, 'Message on WhatsApp', 'راسل عبر واتساب')}</span>
                <ArrowUpRight aria-hidden="true" />
              </button>
              <button
                type="button"
                className="id-action"
                data-testid="identity-action-email"
                onClick={() => {
                  const entry = orderedLinks.find((link) => link.id === 'email');
                  if (entry) void open(entry);
                }}
                disabled={!orderedLinks.length || busy === 'email'}
              >
                <Mail aria-hidden="true" />
                <span>{CONTACT.email}</span>
                <ArrowUpRight aria-hidden="true" />
              </button>
              <button
                type="button"
                className="id-action"
                data-testid="identity-action-phone"
                onClick={() => {
                  const entry = orderedLinks.find((link) => link.id === 'phone');
                  if (entry) void open(entry);
                }}
                disabled={!orderedLinks.length || busy === 'phone'}
              >
                <Phone aria-hidden="true" />
                <span dir="ltr">{CONTACT.phoneDisplay}</span>
                <ArrowUpRight aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="id-hero-aside">
            <dl className="id-facts" data-testid="identity-facts">
              {PRODUCT_FACTS.map((fact) => (
                <div key={fact.id}>
                  <dt>{ar ? fact.labelAr : fact.labelEn}</dt>
                  <dd dir="auto">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p className="id-facts-note">
              <Code2 aria-hidden="true" />
              {t(ar,
                'This build exposes a read-only native bridge. Changing a device state always needs its own approval.',
                'يوفّر هذا الإصدار جسرًا أصليًا للقراءة فقط. تغيير حالة الجهاز يحتاج دائمًا إلى موافقة مستقلة.')}
            </p>
          </div>
        </section>

        <section className="id-section" aria-labelledby="id-pillars-title">
          <div className="id-section-head">
            <h2 id="id-pillars-title">{t(ar, 'What KNOUX builds', 'ما تبنيه KNOUX')}</h2>
            <p>{t(ar,
              'Four disciplines, each one visible in this repository rather than described on a slide.',
              'أربع تخصصات، كل واحدة ظاهرة في هذا المستودع لا على شريحة عرض.')}</p>
          </div>
          <div className="id-pillars">
            {PILLARS.map((pillar) => {
              const Icon = PILLAR_ICONS[pillar.id] ?? Sparkles;
              return (
                <article key={pillar.id} className="id-pillar" data-testid={`identity-pillar-${pillar.id}`}>
                  <span className="id-pillar-icon"><Icon aria-hidden="true" /></span>
                  <h3>{ar ? pillar.titleAr : pillar.titleEn}</h3>
                  <p>{ar ? pillar.bodyAr : pillar.bodyEn}</p>
                  <span className="id-pillar-proof">
                    <Check aria-hidden="true" />
                    {ar ? pillar.proofAr : pillar.proofEn}
                  </span>
                </article>
              );
            })}
          </div>
        </section>

        <section className="id-section" aria-labelledby="id-connect-title">
          <div className="id-section-head">
            <h2 id="id-connect-title">{t(ar, 'Direct channels', 'قنوات التواصل المباشرة')}</h2>
            <p>{t(ar,
              'Every row opens through the operating system. Copy any value to keep it.',
              'كل صف يُفتح عبر نظام التشغيل. انسخ أي قيمة للاحتفاظ بها.')}</p>
          </div>
          <ul className="id-links">
            {orderedLinks.map((entry) => {
              const Icon = LINK_ICONS[entry.id] ?? Globe;
              const label = ar ? entry.labelAr : entry.labelEn;
              const value = displayIdentityUri(entry);
              return (
                <li key={entry.id} className="id-link" data-testid={`identity-link-${entry.id}`} data-uri={entry.uri}>
                  <span className="id-link-icon"><Icon aria-hidden="true" /></span>
                  <button
                    type="button"
                    className="id-link-open"
                    onClick={() => void open(entry)}
                    disabled={busy === entry.id}
                    aria-label={t(ar, `Open ${label}`, `افتح ${label}`)}
                  >
                    <span className="id-link-text">
                      <strong>{label}</strong>
                      <span dir="ltr">{value}</span>
                    </span>
                    <ArrowUpRight className="id-link-go" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="id-link-copy"
                    data-testid={`identity-link-copy-${entry.id}`}
                    onClick={() => void copy(entry.scheme === 'tel' ? entry.uri.replace(/^tel:/, '') : value, label)}
                    aria-label={t(ar, `Copy ${label}`, `انسخ ${label}`)}
                  >
                    <Copy aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="id-links-note">
            {t(ar,
              `Values above are the verified corporate contacts. Alternate line: ${CONTACT.phoneAlt}.`,
              `القيم أعلاه هي بيانات التواصل المؤسسية الموثقة. خط بديل: ${CONTACT.phoneAlt}.`)}
          </p>
        </section>

        <section className="id-section id-sign" aria-label={t(ar, 'Signature', 'التوقيع')}>
          <p className="id-sign-quote">
            {t(ar,
              '“Build thoughtfully. Measure truthfully. Keep the user in control.”',
              '«ابنِ بتأنٍّ. قِس بصدق. أبقِ التحكم بيد المستخدم.»')}
          </p>
          <p className="id-sign-name">
            Eng. Sadek Elgazar <span lang="ar" dir="rtl">· م. صادق الجزار</span>
          </p>
          <p className="id-sign-brand">
            {t(ar, 'Founder & Software Engineer, KNOUX', 'المؤسس ومهندس البرمجيات، KNOUX')}
          </p>
        </section>

        <footer className="id-foot">
          <span>© 2026 KNOUX · {t(ar, 'Built by Eng. Sadek Elgazar', 'بُني بواسطة م. صادق الجزار')}</span>
          <span className="id-foot-mode" data-testid="identity-mode">
            {mode === 'native'
              ? t(ar, 'Destinations open through the Windows shell', 'تُفتح الوجهات عبر غلاف Windows')
              : t(ar, 'Browser preview — destinations use the browser handler', 'معاينة المتصفح — تُفتح الوجهات عبر معالج المتصفح')}
          </span>
          <span className="id-foot-version">{PRODUCT_VERSION}</span>
        </footer>
      </main>

      {toast && (
        <div className="id-toast" role="status" aria-live="polite" data-testid="identity-copy-toast">
          <Check aria-hidden="true" />
          <span>{toast}</span>
        </div>
      )}
      {error && (
        <div className="id-toast id-toast-error" role="alert" data-testid="identity-error">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label={t(ar, 'Dismiss', 'إغلاق')}>✕</button>
        </div>
      )}
    </div>
  );
}

export type { IdentityLink };
export default IdentityPage;
