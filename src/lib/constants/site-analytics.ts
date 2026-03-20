/** User row whose `totalRides` stores aggregate site opens (see site-visit action). */
import { APP_NAME } from "@/lib/constants/brand"
export const SITE_VISIT_COUNTER_USER_EMAIL = "saicharangangula03@gmail.com"

/** Set in the browser after a successful DB increment; if present, we skip the server call. */
export const SITE_VISIT_LOCAL_STORAGE_KEY = `${APP_NAME}_site_visit_recorded`
