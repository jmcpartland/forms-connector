export interface StoredToken {
  access_token: string;
  refresh_token?: string;
  expires_at: number; // epoch ms
  scope?: string;
}

/** Expire a minute early so a token never lapses mid-request. */
const EXPIRY_MARGIN_S = 60;

export function expiresAt(expiresInSeconds: number, now = Date.now()): number {
  return now + (expiresInSeconds - EXPIRY_MARGIN_S) * 1000;
}

export function isTokenFresh(tok: StoredToken | null, now = Date.now()): boolean {
  return !!tok && tok.expires_at > now;
}

/** Run `fn` once at a time: callers arriving while it is in flight share its result. */
export function singleFlight<T>(fn: () => Promise<T>): () => Promise<T> {
  let inflight: Promise<T> | null = null;
  return () => {
    inflight ??= fn().finally(() => {
      inflight = null;
    });
    return inflight;
  };
}
