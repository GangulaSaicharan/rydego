import { firebaseClientConfig } from "@/lib/constants/firebase"

/** Client Firebase config for FCM (from constants). */
export function getFirebaseConfig() {
  return firebaseClientConfig
}

let app: import("firebase/app").FirebaseApp | null = null

/** Init Firebase app (client-only). Safe to call multiple times. Used for FCM. */
export async function getFirebaseApp(): Promise<{
  app: import("firebase/app").FirebaseApp | null
}> {
  if (typeof window === "undefined") return { app: null }
  const c = firebaseClientConfig
  if (!c?.apiKey) return { app: null }

  const { getApp, getApps, initializeApp } = await import("firebase/app")
  if (!app) {
    app = getApps().length ? getApp() : initializeApp({
      apiKey: c.apiKey,
      authDomain: c.authDomain,
      projectId: c.projectId,
      storageBucket: c.storageBucket,
      messagingSenderId: c.messagingSenderId,
      appId: c.appId,
      measurementId: c.measurementId,
    })
  }
  return { app }
}
