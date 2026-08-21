import { alertError } from '../utils/swal';
import type { MediaAsset, MediaType } from '../types';

export interface GoogleDriveConfig {
  clientId: string;
  apiKey: string;
  appId?: string;
}

// Scopes: Request minimal drive.file scope (security best practice)
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

class GoogleDriveService {
  private config: GoogleDriveConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('MWA_GD_CLIENT_ID') || '',
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem('MWA_GD_API_KEY') || '',
    appId: import.meta.env.VITE_GOOGLE_APP_ID || localStorage.getItem('MWA_GD_APP_ID') || '',
  };

  private tokenClient: any = null;
  private accessToken: string | null = null;
  private isGapiLoaded = false;
  private isGsiLoaded = false;

  public setCredentials(clientId: string, apiKey: string, appId?: string) {
    this.config = { clientId: clientId.trim(), apiKey: apiKey.trim(), appId: appId?.trim() || '' };
    localStorage.setItem('MWA_GD_CLIENT_ID', this.config.clientId);
    localStorage.setItem('MWA_GD_API_KEY', this.config.apiKey);
    if (appId) localStorage.setItem('MWA_GD_APP_ID', appId.trim());
    this.tokenClient = null;
  }

  public getCredentials(): GoogleDriveConfig {
    return { ...this.config };
  }

  public isConfigured(): boolean {
    return !!(this.config.clientId && this.config.apiKey);
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Load Google API script (gapi) and Google Identity Services (GIS)
   */
  public async loadGoogleLibraries(): Promise<void> {
    if (this.isGapiLoaded && this.isGsiLoaded) return;

    return new Promise((resolve, reject) => {
      // 1. Load GAPI (for Google Picker & Drive API)
      if (!window.gapi) {
        const gapiScript = document.createElement('script');
        gapiScript.src = 'https://apis.google.com/js/api.js';
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = () => {
          window.gapi.load('client:picker', async () => {
            await window.gapi.client.init({
              apiKey: this.config.apiKey,
              discoveryDocs: [DISCOVERY_DOC],
            });
            this.isGapiLoaded = true;
            checkReady();
          });
        };
        gapiScript.onerror = () => reject(new Error('Failed to load Google API script'));
        document.body.appendChild(gapiScript);
      } else {
        this.isGapiLoaded = true;
      }

      // 2. Load GIS (Google Identity Services)
      if (!window.google?.accounts?.oauth2) {
        const gsiScript = document.createElement('script');
        gsiScript.src = 'https://accounts.google.com/gsi/client';
        gsiScript.async = true;
        gsiScript.defer = true;
        gsiScript.onload = () => {
          this.isGsiLoaded = true;
          checkReady();
        };
        gsiScript.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.body.appendChild(gsiScript);
      } else {
        this.isGsiLoaded = true;
      }

      const checkReady = () => {
        if (this.isGapiLoaded && this.isGsiLoaded) {
          resolve();
        }
      };

      checkReady();
    });
  }

  /**
   * Request OAuth 2.0 Access Token from user
   */
  public async authenticate(): Promise<string> {
    if (this.accessToken) return this.accessToken;
    await this.loadGoogleLibraries();

    if (!this.config.clientId) {
      throw new Error('กรุณาระบุ Google Client ID ก่อนเข้าสู่ระบบ');
    }

    return new Promise((resolve, reject) => {
      try {
        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: this.config.clientId,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error !== undefined) {
              reject(response);
              return;
            }
            this.accessToken = response.access_token;
            resolve(response.access_token);
          },
        });

        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Open Google Picker to select files from Drive and import to app
   */
  public async openFilePicker(onFileSelected: (asset: MediaAsset) => void): Promise<void> {
    const token = await this.authenticate();

    return new Promise((resolve) => {
      const view = new window.google.picker.DocsView()
        .setIncludeFolders(true)
        .setMimeTypes('video/*,audio/*,image/*');

      const picker = new window.google.picker.PickerBuilder()
        .enableFeature(window.google.picker.Feature.NAV_HIDDEN)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .setAppId(this.config.appId || this.config.clientId.split('-')[0])
        .setOAuthToken(token)
        .addView(view)
        .addView(new window.google.picker.DocsUploadView())
        .setDeveloperKey(this.config.apiKey)
        .setTitle('เลือกไฟล์จาก Google Drive (Multimedia Studio)')
        .setCallback(async (data: any) => {
          if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.PICKED) {
            const documents = data[window.google.picker.Response.DOCUMENTS];
            for (const doc of documents) {
              await this.downloadDriveFile(doc, token, onFileSelected);
            }
            resolve();
          } else if (data[window.google.picker.Response.ACTION] === window.google.picker.Action.CANCEL) {
            resolve();
          }
        })
        .build();

      picker.setVisible(true);
    });
  }

  /**
   * Download picked file data from Drive API and create local MediaAsset
   */
  private async downloadDriveFile(
    doc: any,
    token: string,
    onFileSelected: (asset: MediaAsset) => void
  ) {
    const fileId = doc[window.google.picker.Document.ID];
    const fileName = doc[window.google.picker.Document.NAME];
    const mimeType = doc[window.google.picker.Document.MIME_TYPE];

    let type: MediaType = 'video';
    if (mimeType.startsWith('audio/')) type = 'audio';
    else if (mimeType.startsWith('image/')) type = 'image';

    try {
      // Fetch file content using Drive API v3
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Download failed: ${res.statusText}`);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const rawSize = blob.size;

      const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
      };

      // Extract duration if video or audio
      let duration: number | undefined = undefined;
      if (type === 'video') {
        duration = await new Promise((resDur) => {
          const v = document.createElement('video');
          v.preload = 'metadata';
          v.src = blobUrl;
          v.onloadedmetadata = () => resDur(v.duration || 10);
          v.onerror = () => resDur(10);
        });
      } else if (type === 'audio') {
        duration = await new Promise((resDur) => {
          const a = document.createElement('audio');
          a.preload = 'metadata';
          a.src = blobUrl;
          a.onloadedmetadata = () => resDur(a.duration || 10);
          a.onerror = () => resDur(10);
        });
      }

      const colorMap: Record<MediaType, string> = {
        video: 'bg-blue-600',
        audio: 'bg-emerald-600',
        image: 'bg-amber-600',
        text: 'bg-purple-600',
        shape: 'bg-emerald-600',
        frame: 'bg-cyan-600',
        chart: 'bg-indigo-600',
        sheet: 'bg-teal-600',
        table: 'bg-violet-600',
      };

      const asset: MediaAsset = {
        id: `gdrive-${fileId}`,
        name: fileName,
        type,
        blobUrl,
        rawSize,
        size: formatSize(rawSize),
        duration: duration ? parseFloat(duration.toFixed(1)) : undefined,
        color: colorMap[type],
        createdAt: Date.now(),
      };

      onFileSelected(asset);
    } catch (err) {
      console.error('Error importing from Drive:', err);
      alertError('นำเข้าไฟล์จาก Google Drive ไม่สำเร็จ', String(err));
    }
  }

  /**
   * Upload file/project directly to Google Drive
   */
  public async uploadToDrive(
    fileName: string,
    blob: Blob,
    mimeType = 'application/octet-stream'
  ): Promise<{ fileId: string; webViewLink?: string }> {
    const token = await this.authenticate();

    const metadata = {
      name: fileName,
      mimeType,
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Failed to upload to Google Drive');
    }

    const data = await response.json();
    return {
      fileId: data.id,
      webViewLink: data.webViewLink,
    };
  }
}

export const googleDriveService = new GoogleDriveService();

// Declare window types for Google scripts
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}
