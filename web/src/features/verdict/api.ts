/**
 * @deprecated Legacy Yes/No verdict API.
 * New rooms use Agree/Disagree ratings + compatibility score
 * via `@/features/agreements/api`.
 */
export {
  resolveCompatibilityIfReady as resolveVerdictIfReady,
} from '@/features/agreements/api'
