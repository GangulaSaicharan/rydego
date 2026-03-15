import { firebaseClientConfig } from "@/lib/constants/firebase"

/**
 * Client-side Firebase config (from src/lib/constants/firebase.ts).
 * Same shape as Firebase Console "Your web app's Firebase configuration".
 */
export function getFirebaseConfig() {
  return {
    ...firebaseClientConfig,
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? undefined,
  }
}

/** Firebase config object for initializeApp (matches Firebase Console snippet). */
function getFirebaseConfigForInit() {
  const c = getFirebaseConfig()
  if (!c) return null
  return {
    apiKey: c.apiKey,
    authDomain: c.authDomain,
    projectId: c.projectId,
    storageBucket: c.storageBucket,
    messagingSenderId: c.messagingSenderId,
    appId: c.appId,
    measurementId: c.measurementId,
  }
}

let app: import("firebase/app").FirebaseApp | null = null
let analytics: import("firebase/analytics").Analytics | null = null

/**
 * Initialize Firebase app and Analytics (client-only). Uses config from env.
 * Call from client components/layouts; safe to call multiple times.
 */
export async function getFirebaseApp() {
  if (typeof window === "undefined") return { app: null, analytics: null }
  const config = getFirebaseConfigForInit()
  if (!config) return { app: null, analytics: null }

  const [{ getApp, getApps, initializeApp }, { getAnalytics }] = await Promise.all([
    import("firebase/app"),
    import("firebase/analytics"),
  ])

  if (!app) {
    app = getApps().length ? getApp() : initializeApp(config)
    analytics = getAnalytics(app)
  }
  return { app, analytics }
}
