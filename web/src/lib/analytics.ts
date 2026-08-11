import { logEvent, type Analytics } from 'firebase/analytics'
import { analytics, isAnalyticsConfigured } from '@/lib/firebase'

/** Launch funnel events from DEVELOPMENT_PLAN Phase 9. */
export type AnalyticsEventName =
  | 'signup'
  | 'room_created'
  | 'partner_joined'
  | 'questions_exchanged'
  | 'answers_exchanged'
  | 'verdict_revealed'
  | 'result_score'
  | 'report_downloaded'
  | 'result_match'
  | 'result_no_match'

/**
 * Fire a product analytics event when Firebase Analytics is configured.
 * No-ops safely when measurement ID is missing (local / Spark without GA).
 */
export function trackEvent(
  name: AnalyticsEventName,
  params?: Record<string, string | number | boolean>,
): void {
  if (!isAnalyticsConfigured || !analytics) return
  try {
    logEvent(analytics as Analytics, name, params)
  } catch (error) {
    console.warn('[analytics] Failed to log event', name, error)
  }
}
