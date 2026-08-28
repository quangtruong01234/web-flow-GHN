// Bridges a gateway `401` to the auth layer.
//
// The query client is created in `Providers` *above* `AuthProvider`, so its
// caches cannot reach `useAuth()` directly. They publish here instead and
// `AuthProvider` subscribes: on a 401 it drops `user`, and the existing
// `AuthGate` redirect carries the current path as `?next=`.
//
// Nothing is persisted — this is an in-memory signal, not a session store
// (see .ai/context/auth.md: no identity or role hint in browser storage).

type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();

/** Subscribe to gateway 401s. Returns the unsubscribe function. */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Report that the gateway rejected a request with `401`. Called from the query
 * and mutation caches only — the login/`me` calls in `authApi` bypass React
 * Query, so a bad password never lands here.
 */
export function notifySessionExpired(): void {
  for (const listener of [...listeners]) listener();
}
