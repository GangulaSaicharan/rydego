import * as admin from "firebase-admin"

let app: admin.app.App | null = null

function parseServiceAccountFromEnv(raw: string): admin.ServiceAccount {
  const trimmed = raw.trim()

  // Common case: valid JSON object string.
  try {
    return JSON.parse(trimmed) as admin.ServiceAccount
  } catch {
    // continue with fallback parsing
  }

  // Some env providers/dev setups wrap JSON in quotes, e.g. '{"type":"service_account",...}'
  const unwrapped =
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
      ? trimmed.slice(1, -1)
      : trimmed

  // Handle escaped JSON string values and escaped private key newlines.
  const normalized = unwrapped
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")

  return JSON.parse(normalized) as admin.ServiceAccount
}

function getFirebaseApp(): admin.app.App | null {
  if (app) return app

  const existing = admin.apps?.find(Boolean)
  if (existing) {
    app = existing
    return app
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    console.warn(
      "[firebase-admin] FIREBASE_SERVICE_ACCOUNT_JSON not set or empty; push notifications disabled. Set it in Vercel env for production.",
    )
    return null
  }

  try {
    const serviceAccount = parseServiceAccountFromEnv(raw)
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    console.info("[firebase-admin] Initialized; FCM push enabled.")
    return app
  } catch (err) {
    console.error(
      "[firebase-admin] Failed to initialize (check FIREBASE_SERVICE_ACCOUNT_JSON is valid one-line JSON, e.g. newlines as \\n):",
      err,
    )
    return null
  }
}

export function getMessaging(): admin.messaging.Messaging | null {
  const a = getFirebaseApp()
  return a ? a.messaging() : null
}
