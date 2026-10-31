import { GoogleProductIcons } from '../components/workspace/GoogleProductIcon';
/**
 * Google Sheets read-only workbench.
 *
 * This surface is intentionally separate from the nine fixture previews. It
 * shows only the real main-process connection state, only user-selected
 * spreadsheets, and reads values only after an explicit button press. No token
 * or client-secret material is rendered.
 */
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Table2,
  Trash2,
  Unplug,
} from 'lucide-react';
import type { GoogleWorkspaceController } from './useGoogleWorkspace';

interface GoogleSheetsWorkbenchProps {
  google: GoogleWorkspaceController;
  isAr: boolean;
  onNotice: (message: string) => void;
}

export const SCOPE_ROWS = [
  { labelEn: 'openid', labelAr: 'openid', detailEn: 'Sign-in identity only', detailAr: 'هوية تسجيل الدخول فقط' },
  { labelEn: 'userinfo.email', labelAr: 'userinfo.email', detailEn: 'Account email after consent', detailAr: 'بريد الحساب بعد الموافقة' },
  { labelEn: 'userinfo.profile', labelAr: 'userinfo.profile', detailEn: 'Account display name', detailAr: 'اسم عرض الحساب' },
  {
    labelEn: 'spreadsheets.readonly',
    labelAr: 'spreadsheets.readonly',
    detailEn: 'Read known spreadsheet IDs only; no Drive search, no write',
    detailAr: 'قراءة معرفات الجداول المعروفة فقط؛ لا بحث في Drive ولا كتابة',
  },
];

function stateTone(connection: string): string {
  if (connection === 'connected') return 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
  if (connection === 'connecting') return 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40';
  if (connection === 'permission-missing') return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
  if (connection === 'error') return 'bg-rose-950/60 text-rose-300 border-rose-500/40';
  return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
}

function connectionLabel(connection: string, isAr: boolean): string {
  if (connection === 'connected') return isAr ? 'متصل' : 'Connected';
  if (connection === 'connecting') return isAr ? 'جارٍ الاتصال' : 'Connecting';
  if (connection === 'permission-missing') return isAr ? 'صلاحية ناقصة' : 'Permission missing';
  if (connection === 'error') return isAr ? 'خطأ' : 'Error';
  return isAr ? 'غير متصل' : 'Not connected';
}

export function GoogleSheetsWorkbench({ google, isAr, onNotice }: GoogleSheetsWorkbenchProps) {
  const [addValue, setAddValue] = useState('');
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [range, setRange] = useState('A1:Z50');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const status = google.status;
  const connection = status?.connection || (google.bridgeAvailable ? 'disconnected' : 'error');
  const connected = Boolean(status?.connected && connection !== 'error');
  const connecting = google.connecting || connection === 'connecting';
  const selectedSheet = useMemo(
    () => google.sheets.find((sheet) => sheet.id === selectedSheetId) || google.sheets[0] || null,
    [google.sheets, selectedSheetId]
  );

  const handleConnect = async () => {
    const ok = await google.connect();
    if (ok) {
      onNotice(isAr ? 'اكتمل التفويض. لم تُقرأ أي بيانات حتى تضغط تحديث البيانات الوصفية.' : 'Authorization completed. No data is read until you press refresh metadata.');
    }
  };

  const handleAdd = async () => {
    const input = addValue.trim();
    if (!input) return;
    const ok = await google.addSpreadsheet(input);
    if (ok) {
      setAddValue('');
      if (connected) {
        await google.loadSheets();
      } else {
        onNotice(isAr ? 'حُفظ المعرف محليًا. اتصل بالحساب لقراءة البيانات الوصفية.' : 'The ID is stored locally. Connect an account to read metadata.');
      }
    }
  };

  const handleRefresh = async () => {
    if (!connected) return;
    await google.loadSheets();
  };

  const handleRead = async () => {
    if (!connected || !selectedSheet) return;
    await google.readSheet(selectedSheet.id, range);
  };

  const handleDisconnect = async () => {
    if (!confirmDisconnect) {
      setConfirmDisconnect(true);
      return;
    }
    setConfirmDisconnect(false);
    await google.disconnect();
  };

  return (
    <section className="flex-1 min-h-0 bg-[#061226]/80 border border-[#142e56] rounded-xl shadow-inner flex flex-col overflow-hidden" data-testid="workspace-sheets-workbench">
      <header className="px-5 py-3 border-b border-[#122b52] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <GoogleProductIcons.sheets className="w-7 h-7 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white truncate">{isAr ? 'جداول Google — قراءة فقط' : 'Google Sheets — read only'}</h2>
            <p className="text-[10px] text-slate-400 truncate">
              {isAr ? 'معرفات مختارة وبيانات وصفية وقيم عند الطلب فقط.' : 'Selected IDs, metadata and values only on explicit action.'}
            </p>
          </div>
          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono shrink-0 ${stateTone(connection)}`} data-testid="workspace-google-state">
            {connectionLabel(connection, isAr)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {connected ? (
            <>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={Boolean(google.busy)}
                data-testid="workspace-sheets-refresh"
                className="px-3 py-1.5 rounded-lg bg-[#102952] hover:bg-[#16345e] border border-[#1d3f6e] text-cyan-200 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              >
                {google.busy === 'sheets' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {isAr ? 'تحديث البيانات الوصفية' : 'Refresh metadata'}
              </button>
              <button
                type="button"
                onClick={() => void handleDisconnect()}
                data-testid="workspace-google-disconnect"
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${confirmDisconnect ? 'bg-rose-950/70 border-rose-500/50 text-rose-200' : 'bg-[#102952] border-[#1d3f6e] text-slate-300'}`}
              >
                <LogOut className="w-3.5 h-3.5" />
                {confirmDisconnect
                  ? (isAr ? 'تأكيد فصل الحساب' : 'Confirm disconnect')
                  : (isAr ? 'فصل الحساب' : 'Disconnect')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={connecting || !google.bridgeAvailable || status?.configured === false}
              data-testid="workspace-google-connect"
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              {connecting ? (isAr ? 'بانتظار المتصفح' : 'Waiting for browser') : (isAr ? 'اتصال Google' : 'Connect Google')}
            </button>
          )}
          {connecting ? (
            <button
              type="button"
              onClick={() => void google.cancelConnect()}
              data-testid="workspace-google-cancel"
              className="px-3 py-1.5 rounded-lg bg-[#102952] border border-[#1d3f6e] text-slate-300 text-xs font-semibold"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto knx-custom-scrollbar p-4 space-y-3">
        {google.error ? (
          <div role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-3.5 py-2.5 text-rose-200 text-[11px] flex items-start gap-2" data-testid="workspace-google-error">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="font-bold font-mono">{google.error.code}</div>
              <div className="text-[10.5px] opacity-90">{google.error.message}</div>
            </div>
            <button type="button" onClick={google.clearError} className="ms-auto text-rose-300/80 hover:text-white" aria-label={isAr ? 'إغلاق الخطأ' : 'Dismiss error'}>
              ×
            </button>
          </div>
        ) : null}

        {!google.bridgeAvailable ? (
          <div className="rounded-xl border border-amber-500/35 bg-amber-950/20 px-3.5 py-3 text-amber-200 text-[11px]" data-testid="workspace-google-bridge-unavailable">
            <div className="font-bold">{isAr ? 'جسر Google الأصلي غير متاح' : 'Native Google bridge unavailable'}</div>
            <p className="mt-1 leading-relaxed">
              {isAr
                ? 'هذه معاينة متصفح. لا يوجد تفويض Google ولا تخزين رموز، ولا تُعرض بيانات حساب.'
                : 'This is a browser preview. There is no Google authorization, token storage or account data.'}
            </p>
          </div>
        ) : null}

        {status && !status.configured ? (
          <div className="rounded-xl border border-amber-500/35 bg-amber-950/20 px-3.5 py-3 text-amber-200 text-[11px]" data-testid="workspace-google-unconfigured">
            <div className="font-bold">{isAr ? 'عميل OAuth غير مهيأ' : 'OAuth client not configured'}</div>
            <p className="mt-1 leading-relaxed">
              {isAr
                ? 'ضع ملف عميل Desktop خارج المستودع واضبط KNOUX_GOOGLE_OAUTH_CLIENT_PATH ثم أعد تشغيل التطبيق. لا تدخل أي بيانات اعتماد هنا.'
                : 'Place a Desktop client file outside the repository, set KNOUX_GOOGLE_OAUTH_CLIENT_PATH and restart the app. Never paste credentials into this page.'}
            </p>
          </div>
        ) : null}

        {!connected ? (
          <div className="rounded-xl bg-[#091833] border border-[#173766] p-4 space-y-3" data-testid="workspace-google-disconnected">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-500/40 flex items-center justify-center shrink-0">
                <Unplug className="w-4 h-4 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white">{isAr ? 'لا يوجد حساب Google متصل' : 'No Google account is connected'}</div>
                <p className="text-[10.5px] text-slate-400 mt-0.5 leading-relaxed">
                  {isAr
                    ? 'الاتصال فعل صريح يفتح متصفح النظام. لا يُطلب أي نطاق آخر، ولا تُقرأ أي جداول في الخلفية.'
                    : 'Connecting is an explicit act that opens your system browser. No other scope is requested and no sheet is read in the background.'}
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-[#07162c] border border-[#122b52] divide-y divide-[#122b52]">
              {SCOPE_ROWS.map((scope) => (
                <div key={scope.labelEn} className="flex items-start justify-between gap-3 px-3 py-2 text-[10.5px]">
                  <div className="min-w-0">
                    <div className="font-mono text-cyan-300">{isAr ? scope.labelAr : scope.labelEn}</div>
                    <div className="text-slate-500 text-[10px]">{isAr ? scope.detailAr : scope.detailEn}</div>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">
              {isAr
                ? 'يتطلب ذلك موافقة صريحة في متصفح Google. لا تُرسل هذه الصفحة أي رمز أو سر عميل إلى الواجهة.'
                : 'This requires explicit consent in Google’s browser page. No token or client secret is sent to this page.'}
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-[#091833] border border-[#173766] p-3.5 flex flex-wrap items-center justify-between gap-3" data-testid="workspace-google-account">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {status?.account?.displayName || (isAr ? 'حساب Google' : 'Google account')}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{status?.account?.email || (isAr ? 'البريد غير متاح' : 'Email unavailable')}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[9.5px] font-mono">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">READ-ONLY</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#0b1f3d] border border-[#1d3f6e] text-slate-300">{status?.tokenStorage}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#0b1f3d] border border-[#1d3f6e] text-slate-300">
                    {status?.selectedSpreadsheetCount || 0} {isAr ? 'معرف محفوظ' : 'selected IDs'}
                  </span>
                </div>
                {status?.obtainedAt ? (
                  <span className="text-[9px] text-slate-500 font-mono">
                    {isAr ? 'تاريخ المنح' : 'grant obtained'}: {new Date(status.obtainedAt).toLocaleString(isAr ? 'ar' : 'en')}
                  </span>
                ) : null}
              </div>
            </div>

            {status?.connection === 'permission-missing' ? (
              <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 px-3.5 py-2.5 text-amber-200 text-[11px]" role="alert">
                <div className="font-bold">{isAr ? 'نطاق قراءة الجداول غير ممنوح' : 'Read-only Sheets scope is missing'}</div>
                <p className="mt-0.5">{isAr ? 'أعد الاتصال بعد مراجعة النطاقات؛ لا تُطلب نطاقات أوسع تلقائيًا.' : 'Reconnect after reviewing the scopes; broader scopes are never requested automatically.'}</p>
              </div>
            ) : null}

            <div className="rounded-xl bg-[#091833] border border-[#173766] p-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[220px]">
                  <label htmlFor="workspace-sheet-add" className="block text-[10.5px] font-semibold text-slate-300 mb-1">
                    {isAr ? 'إضافة رابط أو معرف جدول' : 'Add spreadsheet URL or ID'}
                  </label>
                  <input
                    id="workspace-sheet-add"
                    type="text"
                    value={addValue}
                    onChange={(event) => setAddValue(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') void handleAdd(); }}
                    placeholder="https://docs.google.com/spreadsheets/d/…"
                    data-testid="workspace-sheet-add-input"
                    className="w-full px-2.5 py-1.5 bg-[#07162c] border border-[#173766] rounded-lg text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleAdd()}
                  disabled={!addValue.trim() || Boolean(google.busy)}
                  data-testid="workspace-sheet-add-button"
                  className="mt-4 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isAr ? 'إضافة' : 'Add'}
                </button>
              </div>
              <p className="text-[9.5px] text-slate-500 mt-1.5">
                {isAr
                  ? 'لا يوجد بحث عام في Drive. تُقرأ الجداول التي تضيفها فقط.'
                  : 'No general Drive search. Only spreadsheets you add are read.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
              <div className="rounded-xl bg-[#091833] border border-[#173766] overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#173766]">
                  <span className="text-[11px] font-semibold text-slate-200">{isAr ? 'الجداول المختارة' : 'Selected spreadsheets'}</span>
                  <span className="text-[9.5px] font-mono text-slate-500">{google.sheets.length}</span>
                </div>
                <div className="p-2 space-y-1.5 max-h-64 overflow-y-auto knx-custom-scrollbar">
                  {google.sheets.map((sheet) => (
                    <button
                      key={sheet.id}
                      type="button"
                      onClick={() => setSelectedSheetId(sheet.id)}
                      className={`w-full p-2.5 rounded-lg border text-start ${selectedSheet?.id === sheet.id ? 'bg-[#0d2450] border-cyan-500/50' : 'bg-[#07162c] border-[#173766] hover:border-[#245089]'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-white truncate">{sheet.title}</span>
                        <span className="text-[9px] font-mono text-emerald-300 shrink-0">{sheet.tabs.length} {isAr ? 'ورقة' : 'tabs'}</span>
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">{sheet.id}</div>
                    </button>
                  ))}
                  {!google.sheets.length ? (
                    <div className="rounded-lg border border-dashed border-[#173766] p-4 text-center text-[10.5px] text-slate-500">
                      {isAr ? 'لا توجد بيانات وصفية بعد. أضف جدولًا ثم اضغط تحديث.' : 'No metadata yet. Add a spreadsheet, then press refresh.'}
                    </div>
                  ) : null}
                </div>
                {google.sheetFailures.length ? (
                  <div className="px-3 pb-2 text-[9.5px] text-amber-300">
                    {google.sheetFailures.map((failure) => `${failure.id.slice(0, 8)}…: ${failure.code}`).join(' · ')}
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl bg-[#091833] border border-[#173766] p-3.5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-200 mb-2">
                  <Table2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isAr ? 'قراءة قيم عند الطلب' : 'Read values on demand'}</span>
                </div>
                {selectedSheet ? (
                  <>
                    <div className="text-[10px] text-slate-400 mb-2 truncate">{selectedSheet.title}</div>
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="workspace-sheet-range" className="sr-only">{isAr ? 'نطاق الخلايا' : 'Cell range'}</label>
                      <input
                        id="workspace-sheet-range"
                        value={range}
                        onChange={(event) => setRange(event.target.value)}
                        data-testid="workspace-sheet-range"
                        className="flex-1 min-w-0 px-2 py-1 bg-[#07162c] border border-[#173766] rounded text-[10.5px] font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
                        maxLength={160}
                      />
                      <button
                        type="button"
                        onClick={() => void handleRead()}
                        disabled={Boolean(google.busy) || status?.connection === 'permission-missing'}
                        data-testid="workspace-sheet-read"
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold disabled:opacity-40"
                      >
                        {google.busy === 'read' ? (isAr ? 'جارٍ القراءة…' : 'Reading…') : (isAr ? 'قراءة' : 'Read')}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[9px] text-slate-500">{isAr ? 'حد أقصى 2000 صف × 60 عمود' : 'Bounded to 2000 rows × 60 columns'}</span>
                      <button
                        type="button"
                        onClick={() => void google.removeSpreadsheet(selectedSheet.id)}
                        data-testid="workspace-sheet-remove"
                        className="text-[9.5px] text-rose-300 hover:text-rose-200 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        {isAr ? 'إزالة من الاختيار' : 'Remove from selection'}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-[10.5px] text-slate-500">{isAr ? 'اختر جدولًا أولًا.' : 'Select a spreadsheet first.'}</p>
                )}
                {google.values ? (
                  <div className="mt-3 overflow-x-auto knx-custom-scrollbar max-h-56">
                    <table className="w-full text-[10px] border-collapse" data-testid="workspace-sheet-values">
                      <tbody>
                        {google.values.values.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-[#0b1f3d]">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="px-2 py-1 border-b border-[#122b52] text-slate-300 whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}

        <div className="rounded-xl bg-[#071328] border border-[#1b3f70] p-3 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-[10px] text-slate-400 leading-relaxed">
            {isAr
              ? 'الرموز تبقى في العملية الرئيسية داخل تخزين Windows المحمي. لا توجد كتابة Google، ولا بحث Drive، ولا نطاقات إضافية. قد تنتهي صلاحية رموز وضع Testing الخارجي بعد 7 أيام؛ أعد الاتصال إذا ألغت Google الرمز. لإبطال الوصول من جهة Google افتح myaccount.google.com/permissions.'
              : 'Tokens stay in the main process inside Windows-protected storage. There is no Google write, no Drive search and no additional scope. External Testing grants can expire after 7 days; reconnect if Google revokes the refresh token. To revoke Google-side access, open myaccount.google.com/permissions.'}
            <a
              href="https://myaccount.google.com/permissions"
              onClick={(event) => {
                event.preventDefault();
                onNotice(isAr ? 'افتح myaccount.google.com/permissions في متصفحك لإبطال الوصول.' : 'Open myaccount.google.com/permissions in your browser to revoke access.');
              }}
              className="ms-1 inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 underline"
            >
              <ExternalLink className="w-3 h-3" />
              {isAr ? 'تعليمات الإبطال' : 'revocation instructions'}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
