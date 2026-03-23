/** User row whose `totalRides` stores aggregate site opens (see site-visit action). */
import { APP_NAME } from "@/lib/constants/brand"
export const SITE_VISIT_COUNTER_USER_EMAIL = "saicharangangula03@gmail.com"

/** Set as a cookie so PWA standalone mode can share the "already counted" flag. */
export const SITE_VISIT_COOKIE_KEY = `${APP_NAME}_site_visit_recorded`
