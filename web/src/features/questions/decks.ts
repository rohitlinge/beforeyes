export type QuestionDeck = {
  id: string
  title: string
  description: string
  icon: string
  order: number
  questions: string[]
}

/** Canonical starter decks — all unlocked. Also seeded to Firestore `questionDecks`. */
export const QUESTION_DECKS: QuestionDeck[] = [
  {
    id: 'money-work',
    title: 'Money & Work',
    description: 'Income, debt, spending, and career moves.',
    icon: 'account_balance',
    order: 1,
    questions: [
      'How do you feel about joint vs separate accounts after commitment?',
      'What debts or financial obligations should I know about now?',
      'How should we make big spending decisions together?',
      'What does financial security look like to you in five years?',
      'How would you feel if one of us earns significantly more than the other?',
      'How do you think about career risk — job switches, business, or relocation for work?',
      'What money habits from your family do you want to keep or leave behind?',
    ],
  },
  {
    id: 'family-inlaws',
    title: 'Family & In-Laws',
    description: 'Living arrangements, boundaries, holidays, and care.',
    icon: 'family_restroom',
    order: 2,
    questions: [
      'How involved should in-laws be in our day-to-day life?',
      'How do we handle holidays between both families?',
      'Would you prefer to live with parents, nearby, or independently — and why?',
      'How should we respond if family pressure conflicts with our private decision?',
      'What traditions from your childhood do you want to pass on?',
      'How do we support aging parents without losing our own partnership?',
    ],
  },
  {
    id: 'children',
    title: 'Children & Parenting',
    description: 'Whether, when, how many, and how you raise kids.',
    icon: 'child_care',
    order: 3,
    questions: [
      'Do you want children? If yes, roughly when and how many?',
      'How do you imagine sharing parenting responsibilities day to day?',
      'What parenting style feels right to you — firm, flexible, or somewhere in between?',
      'How would you feel if we struggled with fertility or needed medical help?',
      'What values matter most in how children are raised in our home?',
      'How should we handle disagreements about schooling or discipline?',
    ],
  },
  {
    id: 'faith-culture',
    title: 'Faith & Culture',
    description: 'Belief, festivals, and mixed-culture homes.',
    icon: 'temple_hindu',
    order: 4,
    questions: [
      'How important is religion or spiritual practice in your daily life?',
      'How do you want faith and festivals to show up in our home?',
      'How would we navigate different religious or cultural backgrounds?',
      'What would you need if family expected conversion or a specific ritual?',
      'Which cultural practices feel non-negotiable to you?',
      'How open are you to raising children with both families’ traditions?',
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle & Home',
    description: 'City vs hometown, social life, and personal space.',
    icon: 'self_improvement',
    order: 5,
    questions: [
      'Where do you want to live in the next five years — and what would make you move?',
      'How do you recharge — together time, alone time, or both?',
      'What does a healthy weekly routine look like for you?',
      'What boundaries around friends, privacy, and phones matter to you?',
      'How often do you want to travel, host, or go out socially?',
      'How should we handle disagreements when we are both stressed?',
    ],
  },
  {
    id: 'values-future',
    title: 'Values & Future',
    description: 'Deal-breakers, meaning, and long-term alignment.',
    icon: 'timeline',
    order: 6,
    questions: [
      'What does a meaningful life look like to you long-term?',
      'Are there deal-breakers for our future that we should name now?',
      'How important is career growth compared to proximity to family?',
      'How do you want us to repair after a serious argument?',
      'What does honesty look like when the truth might disappoint me?',
      'If we felt stuck later, how would you want us to seek help — friends, family, or counseling?',
      'What would make you feel truly chosen and safe in this partnership?',
    ],
  },
]

export type QuestionItem = {
  id: string
  text: string
  source?: 'custom' | string
}

export function newQuestionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().slice(0, 12)
  }
  return `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function totalStarterQuestionCount(
  decks: QuestionDeck[] = QUESTION_DECKS,
): number {
  return decks.reduce((sum, deck) => sum + deck.questions.length, 0)
}
