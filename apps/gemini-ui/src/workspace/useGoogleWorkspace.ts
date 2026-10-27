/**
 * Google Workspace connection controller.
 *
 * Status is read once on mount (a local main-process read). Connecting,
 * disconnecting, metadata reads and value reads happen only on explicit user
 * actions. No Google request is made at startup.
 */
import { useCallback, useEffect, useState } from 'react';
import type {
  GoogleConnectionStatus,
  GoogleSheetMetadata,
  GoogleSheetValues,
  GoogleSheetsListResult,
} from '../../shared/native-contracts';
import {
  addGoogleSpreadsheet,
  beginGoogleConnect,
  cancelGoogleConnect,
  disconnectGoogle,
  getGoogleShell,
  listGoogleSheets,
  loadGoogleStatus,
  readGoogleSheet,
  removeGoogleSpreadsheet,
} from './google-native';

export interface GoogleWorkspaceController {
  bridgeAvailable: boolean;
  status: GoogleConnectionStatus | null;
  sheets: GoogleSheetMetadata[];
  sheetFailures: Array<{ id: string; code: string }>;
  values: GoogleSheetValues | null;
  loading: boolean;
  connecting: boolean;
  busy: 'sheets' | 'add' | 'remove' | 'read' | 'disconnect' | null;
  error: { code: string; message: string } | null;
  notice: string | null;
  refreshStatus: () => Promise<void>;
  connect: () => Promise<boolean>;
  cancelConnect: () => Promise<void>;
  disconnect: () => Promise<boolean>;
  loadSheets: () => Promise<GoogleSheetsListResult | null>;
  addSpreadsheet: (input: string) => Promise<boolean>;
  removeSpreadsheet: (id: string) => Promise<boolean>;
  readSheet: (id: string, range?: string) => Promise<GoogleSheetValues | null>;
  clearError: () => void;
  clearNotice: () => void;
}

function envelopeError(envelope: { error?: { code: string; message: string } | null } | null | undefined): {
  code: string;
  message: string;
} | null {
  if (!envelope?.error) return null;
  return { code: envelope.error.code, message: envelope.error.message };
}

export function useGoogleWorkspace(): GoogleWorkspaceController {
  const bridgeAvailable = Boolean(getGoogleShell());
  const [status, setStatus] = useState<GoogleConnectionStatus | null>(null);
  const [sheets, setSheets] = useState<GoogleSheetMetadata[]>([]);
  const [sheetFailures, setSheetFailures] = useState<Array<{ id: string; code: string }>>([]);
  const [values, setValues] = useState<GoogleSheetValues | null>(null);
  const [loading, setLoading] = useState<boolean>(bridgeAvailable);
  const [connecting, setConnecting] = useState(false);
  const [busy, setBusy] = useState<GoogleWorkspaceController['busy']>(null);
  const [error, setError] = useState<GoogleWorkspaceController['error']>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (!bridgeAvailable) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const envelope = await loadGoogleStatus();
      if (envelope?.data) setStatus(envelope.data);
      const failure = envelopeError(envelope);
      if (failure) setError(failure);
    } catch (caught) {
      setError({ code: 'GOOGLE_STATUS_FAILED', message: String((caught as Error)?.message || caught) });
    } finally {
      setLoading(false);
    }
  }, [bridgeAvailable]);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const connect = useCallback(async () => {
    if (!bridgeAvailable) {
      setError({ code: 'GOOGLE_BRIDGE_UNAVAILABLE', message: 'The native Google bridge is unavailable in this preview.' });
      return false;
    }
    setConnecting(true);
    setError(null);
    setNotice(null);
    try {
      const envelope = await beginGoogleConnect();
      if (envelope?.data) setStatus(envelope.data);
      const failure = envelopeError(envelope);
      if (failure) {
        setError(failure);
        return false;
      }
      setNotice('Google authorization completed. Only the read-only Sheets scope set was requested.');
      return true;
    } catch (caught) {
      setError({ code: 'GOOGLE_CONNECT_FAILED', message: String((caught as Error)?.message || caught) });
      return false;
    } finally {
      setConnecting(false);
      void refreshStatus();
    }
  }, [bridgeAvailable, refreshStatus]);

  const cancelConnect = useCallback(async () => {
    if (!bridgeAvailable) return;
    try {
      const envelope = await cancelGoogleConnect();
      if (envelope?.data) setStatus(envelope.data);
      setConnecting(false);
      setNotice('Google authorization was cancelled. No token was stored.');
    } catch (caught) {
      setError({ code: 'GOOGLE_CANCEL_FAILED', message: String((caught as Error)?.message || caught) });
    }
  }, [bridgeAvailable]);

  const disconnect = useCallback(async () => {
    if (!bridgeAvailable) return false;
    setBusy('disconnect');
    setError(null);
    try {
      const envelope = await disconnectGoogle();
      if (envelope?.data) setStatus(envelope.data);
      const failure = envelopeError(envelope);
      if (failure) {
        setError(failure);
        return false;
      }
      setSheets([]);
      setSheetFailures([]);
      setValues(null);
      setNotice('The local Google grant was removed. Revoke the app at myaccount.google.com/permissions if you also want to remove the Google-side grant.');
      return true;
    } catch (caught) {
      setError({ code: 'GOOGLE_DISCONNECT_FAILED', message: String((caught as Error)?.message || caught) });
      return false;
    } finally {
      setBusy(null);
      void refreshStatus();
    }
  }, [bridgeAvailable, refreshStatus]);

  const loadSheets = useCallback(async () => {
    if (!bridgeAvailable) return null;
    setBusy('sheets');
    setError(null);
    try {
      const envelope = await listGoogleSheets();
      const failure = envelopeError(envelope);
      if (failure) {
        setError(failure);
        return null;
      }
      const result = envelope?.data || null;
      setSheets(result?.sheets || []);
      setSheetFailures(result?.failures || []);
      return result;
    } catch (caught) {
      setError({ code: 'GOOGLE_SHEETS_LIST_FAILED', message: String((caught as Error)?.message || caught) });
      return null;
    } finally {
      setBusy(null);
    }
  }, [bridgeAvailable]);

  const addSpreadsheet = useCallback(async (input: string) => {
    if (!bridgeAvailable) return false;
    setBusy('add');
    setError(null);
    try {
      const envelope = await addGoogleSpreadsheet(input);
      const failure = envelopeError(envelope);
      if (failure) {
        setError(failure);
        return false;
      }
      setNotice('Spreadsheet added to the local selection. Its metadata is read only when you refresh.');
      await refreshStatus();
      return true;
    } catch (caught) {
      setError({ code: 'GOOGLE_SHEET_ADD_FAILED', message: String((caught as Error)?.message || caught) });
      return false;
    } finally {
      setBusy(null);
    }
  }, [bridgeAvailable, refreshStatus]);

  const removeSpreadsheet = useCallback(async (id: string) => {
    if (!bridgeAvailable) return false;
    setBusy('remove');
    setError(null);
    try {
      const envelope = await removeGoogleSpreadsheet(id);
      const failure = envelopeError(envelope);
      if (failure) {
        setError(failure);
        return false;
      }
      setSheets((current) => current.filter((sheet) => sheet.id !== id));
      setValues((current) => (current?.spreadsheetId === id ? null : current));
      await refreshStatus();
      return true;
    } catch (caught) {
      setError({ code: 'GOOGLE_SHEET_REMOVE_FAILED', message: String((caught as Error)?.message || caught) });
      return false;
    } finally {
      setBusy(null);
    }
  }, [bridgeAvailable, refreshStatus]);

  const readSheet = useCallback(async (id: string, range?: string) => {
    if (!bridgeAvailable) return null;
    setBusy('read');
    setError(null);
    try {
      const envelope = await readGoogleSheet({ id, range });
      const failure = envelopeError(envelope);
      if (failure) {
        setError(failure);
        return null;
      }
      const result = envelope?.data || null;
      if (result) setValues(result);
      return result;
    } catch (caught) {
      setError({ code: 'GOOGLE_SHEET_READ_FAILED', message: String((caught as Error)?.message || caught) });
      return null;
    } finally {
      setBusy(null);
    }
  }, [bridgeAvailable]);

  return {
    bridgeAvailable,
    status,
    sheets,
    sheetFailures,
    values,
    loading,
    connecting,
    busy,
    error,
    notice,
    refreshStatus,
    connect,
    cancelConnect,
    disconnect,
    loadSheets,
    addSpreadsheet,
    removeSpreadsheet,
    readSheet,
    clearError: () => setError(null),
    clearNotice: () => setNotice(null),
  };
}
