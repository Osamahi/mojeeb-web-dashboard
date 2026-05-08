/**
 * Google Drive Picker — lazy-loaded.
 *
 * Pairs with the `drive.file` OAuth scope: the user picks ONE spreadsheet via
 * Google's native file browser, and our app gets indefinite access to that
 * one file (no broader sheet listing). After picking, the access token granted
 * during OAuth applies to that spreadsheet on the Sheets API.
 *
 * Loads the gapi + Picker SDKs on demand so they don't bloat every page.
 */

const GAPI_SCRIPT_SRC = 'https://apis.google.com/js/api.js';

declare global {
  interface Window {
    gapi?: {
      load: (libs: string, opts: { callback: () => void; onerror?: (e: unknown) => void }) => void;
    };
    google?: {
      picker?: {
        PickerBuilder: new () => GooglePickerBuilder;
        DocsView: new (viewId?: string) => GooglePickerView;
        ViewId: { SPREADSHEETS: string };
        Action: { PICKED: string; CANCEL: string };
        Feature: { NAV_HIDDEN: string; SUPPORT_DRIVES: string };
        Response: { ACTION: string; DOCUMENTS: string };
        Document: {
          ID: string;
          NAME: string;
          URL: string;
          MIME_TYPE: string;
        };
      };
    };
  }
}

interface GooglePickerView {
  setMimeTypes: (mimeTypes: string) => GooglePickerView;
  setIncludeFolders: (b: boolean) => GooglePickerView;
  setSelectFolderEnabled: (b: boolean) => GooglePickerView;
  setOwnedByMe: (b: boolean) => GooglePickerView;
}

interface GooglePickerBuilder {
  addView: (view: GooglePickerView | string) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setAppId: (id: string) => GooglePickerBuilder;
  setCallback: (cb: (data: PickerCallbackData) => void) => GooglePickerBuilder;
  setTitle: (title: string) => GooglePickerBuilder;
  enableFeature: (feat: string) => GooglePickerBuilder;
  build: () => { setVisible: (visible: boolean) => void };
}

interface PickerCallbackData {
  action: string;
  docs?: Array<Record<string, unknown>>;
}

export interface PickedSpreadsheet {
  id: string;
  name: string;
  url: string;
}

let gapiLoadPromise: Promise<void> | null = null;
let pickerLoadPromise: Promise<void> | null = null;
let zIndexStyleInjected = false;

// BaseModal sits at z-index:9999. The Picker SDK injects `.picker-dialog` and `.picker-dialog-bg`
// to <body> at a much lower z-index, so it appears BEHIND our modal. Lift it above.
function injectPickerZIndexFix() {
  if (zIndexStyleInjected) return;
  zIndexStyleInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .picker-dialog-bg { z-index: 10000 !important; }
    .picker-dialog { z-index: 10001 !important; }
  `;
  document.head.appendChild(style);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureGapi(): Promise<void> {
  if (window.gapi) return;
  if (!gapiLoadPromise) gapiLoadPromise = loadScript(GAPI_SCRIPT_SRC);
  await gapiLoadPromise;
}

async function ensurePicker(): Promise<void> {
  injectPickerZIndexFix();
  if (window.google?.picker) return;
  await ensureGapi();
  if (!pickerLoadPromise) {
    pickerLoadPromise = new Promise<void>((resolve, reject) => {
      window.gapi!.load('picker', {
        callback: () => resolve(),
        onerror: (e) => reject(e instanceof Error ? e : new Error('Picker failed to load')),
      });
    });
  }
  await pickerLoadPromise;
}

/**
 * Open the Google Drive Picker filtered to spreadsheets owned by the user.
 * Resolves with the picked sheet, or null if the user cancelled.
 */
export async function openSpreadsheetPicker(opts: {
  oauthToken: string;
  developerKey: string;
  appId?: string;
}): Promise<PickedSpreadsheet | null> {
  await ensurePicker();
  const picker = window.google?.picker;
  if (!picker) throw new Error('Google Picker SDK is not available');

  return new Promise<PickedSpreadsheet | null>((resolve, reject) => {
    try {
      const view = new picker.DocsView(picker.ViewId.SPREADSHEETS)
        .setMimeTypes('application/vnd.google-apps.spreadsheet')
        .setIncludeFolders(false)
        .setSelectFolderEnabled(false);

      const builder = new picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(opts.oauthToken)
        .setDeveloperKey(opts.developerKey)
        .setTitle('Select a spreadsheet')
        .enableFeature(picker.Feature.NAV_HIDDEN)
        .setCallback((data) => {
          console.log('[Picker] callback', { action: data.action, docs: data.docs, fullData: data });
          if (data.action === picker.Action.PICKED) {
            const doc = data.docs?.[0];
            if (!doc) {
              console.warn('[Picker] PICKED but no docs');
              resolve(null);
              return;
            }
            const result = {
              id: String(doc[picker.Document.ID] ?? ''),
              name: String(doc[picker.Document.NAME] ?? ''),
              url: String(doc[picker.Document.URL] ?? ''),
            };
            console.log('[Picker] resolving with', result, 'raw doc:', doc);
            resolve(result);
          } else if (data.action === picker.Action.CANCEL) {
            resolve(null);
          }
        });

      console.log('[Picker] init opts', { hasOAuthToken: !!opts.oauthToken, hasDeveloperKey: !!opts.developerKey, appId: opts.appId });
      if (opts.appId) builder.setAppId(opts.appId);
      builder.build().setVisible(true);
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Failed to open Picker'));
    }
  });
}
