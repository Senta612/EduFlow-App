import { Platform } from 'react-native';

export type NetworkStatusListener = (isOnline: boolean) => void;

class NetworkMonitor {
  private _isOnline = true;
  private _listeners: Set<NetworkStatusListener> = new Set();
  private _intervalId: any = null;

  constructor() {
    this.init();
  }

  private init() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      window.addEventListener('online', () => this.setOnlineState(true));
      window.addEventListener('offline', () => this.setOnlineState(false));
    } else {
      // In native environments, start a periodic heartbeat ping
      this.startHeartbeat();
    }
  }

  private startHeartbeat(intervalMs = 15000) {
    if (this._intervalId) return;
    this._intervalId = setInterval(() => {
      this.checkConnectionAsync();
    }, intervalMs);
  }

  /**
   * Actively ping a lightweight endpoint to confirm actual internet connectivity
   */
  async checkConnectionAsync(): Promise<boolean> {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setOnlineState(false);
      return false;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      // Ping Supabase or reliable fast DNS endpoint with HEAD/GET
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const targetUrl = supabaseUrl ? `${supabaseUrl}/rest/v1/` : 'https://www.google.com';

      const res = await fetch(targetUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      const reachable = res.status >= 200 && res.status < 500;
      this.setOnlineState(reachable);
      return reachable;
    } catch {
      this.setOnlineState(false);
      return false;
    }
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  private setOnlineState(online: boolean) {
    if (this._isOnline !== online) {
      this._isOnline = online;
      this._listeners.forEach((listener) => {
        try {
          listener(online);
        } catch (e) {
          console.warn('[NetworkMonitor] Listener error:', e);
        }
      });
    }
  }

  /**
   * Subscribe to network availability changes
   */
  subscribe(listener: NetworkStatusListener): () => void {
    this._listeners.add(listener);
    // Notify immediately with current state
    listener(this._isOnline);
    return () => {
      this._listeners.delete(listener);
    };
  }
}

export const networkMonitor = new NetworkMonitor();
