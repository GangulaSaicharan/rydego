import * as admin from "firebase-admin"

let app: admin.app.App | null = null

function getServiceAccountJson(): string | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  return json?.trim() ? json.trim() : null
}

function getFirebaseApp(): admin.app.App | null {
  if (app) return app

  // Reuse existing default app (e.g. already initialized by another route or serverless invocation)
  const existing = admin.apps?.find(Boolean)
  if (existing) {
    app = existing
    return app
  }

  let json = getServiceAccountJson()
  if (!json) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[firebase-admin] Set FIREBASE_SERVICE_ACCOUNT_JSON; push notifications disabled.")
    }
    return null
  }


  console.log(json)

  try {
    const serviceAccount = JSON.parse(json) as admin.ServiceAccount
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    return app
  } catch (err) {
    console.error("[firebase-admin] Failed to initialize:", err)
    return null
  }
}

export function getMessaging(): admin.messaging.Messaging | null {
  const a = getFirebaseApp()
  return a ? a.messaging() : null
}
