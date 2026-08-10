export type RoomStatus =
  | 'waiting_partner'
  | 'questions_building'
  | 'questions_ready'
  | 'questions_exchanged'
  | 'answering'
  | 'answers_ready'
  | 'answers_exchanged'
  | 'verdict_pending'
  | 'result_revealed'
  | 'closed'

export type RoomResult = 'match' | 'no_match' | null

export type Room = {
  roomId: string
  createdBy: string
  partnerA: string
  partnerB: string | null
  partnerADisplayName: string
  partnerAUsername: string
  partnerBDisplayName: string | null
  partnerBUsername: string | null
  memberIds: string[]
  status: RoomStatus
  partnerAReadyQuestions: boolean
  partnerBReadyQuestions: boolean
  partnerAQuestionCount: number
  partnerBQuestionCount: number
  partnerAQuestionsDelivered: boolean
  partnerBQuestionsDelivered: boolean
  partnerAReadyAnswers: boolean
  partnerBReadyAnswers: boolean
  partnerAAnsweredCount: number
  partnerBAnsweredCount: number
  partnerAAnswersDelivered: boolean
  partnerBAnswersDelivered: boolean
  partnerAVerdictSubmitted: boolean
  partnerBVerdictSubmitted: boolean
  result: RoomResult
  closedBy: string | null
  createdAt: number | null
  updatedAt: number | null
}

export function createRoomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
  }
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function inviteUrl(roomId: string): string {
  if (typeof window === 'undefined') return `/join/${roomId}`
  return `${window.location.origin}/join/${roomId}`
}

export function whatsappShareUrl(roomId: string): string {
  const url = inviteUrl(roomId)
  const text = `Join me in The Pre-Commitment Game — a private room for our big talk:\n${url}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function statusLabel(status: RoomStatus): string {
  switch (status) {
    case 'waiting_partner':
      return 'Waiting for partner'
    case 'questions_building':
    case 'questions_ready':
      return 'Building questions'
    case 'questions_exchanged':
    case 'answering':
    case 'answers_ready':
      return 'Answering'
    case 'answers_exchanged':
      return 'Reviewing answers'
    case 'verdict_pending':
      return 'Verdict'
    case 'result_revealed':
      return 'Completed'
    case 'closed':
      return 'Closed'
    default:
      return 'In progress'
  }
}

export const QUESTION_PHASE_DEFAULTS = {
  partnerAReadyQuestions: false,
  partnerBReadyQuestions: false,
  partnerAQuestionCount: 0,
  partnerBQuestionCount: 0,
  partnerAQuestionsDelivered: false,
  partnerBQuestionsDelivered: false,
} as const

export const ANSWER_PHASE_DEFAULTS = {
  partnerAReadyAnswers: false,
  partnerBReadyAnswers: false,
  partnerAAnsweredCount: 0,
  partnerBAnsweredCount: 0,
  partnerAAnswersDelivered: false,
  partnerBAnswersDelivered: false,
} as const

export const VERDICT_PHASE_DEFAULTS = {
  partnerAVerdictSubmitted: false,
  partnerBVerdictSubmitted: false,
  result: null,
} as const
