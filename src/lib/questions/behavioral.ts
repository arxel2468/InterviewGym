import { Question, QuestionCategory } from './index'

export const BEHAVIORAL_QUESTIONS: Question[] = [
  // INTRO
  {
    id: 'intro_1',
    category: 'intro',
    question:
      'Before we dive in, tell me briefly about yourself and what brings you here today.',
    followUps: [
      'What made you decide to pursue this career path?',
      'What are you looking for in your next role?',
    ],
    lookingFor: ['clear narrative', 'relevant experience', 'enthusiasm'],
  },

  // TEAMWORK
  {
    id: 'team_1',
    category: 'teamwork',
    question:
      'Tell me about a time you had to work closely with someone whose working style was very different from yours.',
    followUps: [
      'How did you adapt your approach?',
      'What did you learn from that experience?',
      'Would you work with them again?',
    ],
    lookingFor: ['adaptability', 'communication', 'empathy', 'outcome'],
  },
  {
    id: 'team_2',
    category: 'teamwork',
    question:
      'Describe a situation where you had to collaborate with a difficult team member to achieve a goal.',
    followUps: [
      'What specifically made them difficult?',
      'How did you handle the tension?',
      'What was the end result?',
    ],
    lookingFor: ['conflict navigation', 'professionalism', 'results focus'],
  },

  // CONFLICT
  {
    id: 'conflict_1',
    category: 'conflict',
    question:
      'Tell me about a time you disagreed with your manager or a senior colleague. How did you handle it?',
    followUps: [
      'Did you push back or accept their decision?',
      'Looking back, who was right?',
      'What would you do differently?',
    ],
    lookingFor: ['respectful disagreement', 'data-driven', 'outcome'],
  },
  {
    id: 'conflict_2',
    category: 'conflict',
    question:
      'Describe a situation where two stakeholders wanted different things from you. How did you navigate that?',
    followUps: [
      'How did you prioritize?',
      'Did anyone end up unhappy?',
      'What did you learn about managing expectations?',
    ],
    lookingFor: ['prioritization', 'communication', 'negotiation'],
  },

  // FAILURE
  {
    id: 'failure_1',
    category: 'failure',
    question:
      'Tell me about a time you failed or made a significant mistake at work.',
    followUps: [
      'How did you realize you had failed?',
      'What did you do immediately after?',
      'How did you prevent it from happening again?',
    ],
    lookingFor: ['ownership', 'learning', 'prevention', 'honesty'],
  },
  {
    id: 'failure_2',
    category: 'failure',
    question: "Describe a project that didn't go as planned. What happened?",
    followUps: [
      "What was your role in the project's challenges?",
      'What signals did you miss early on?',
      'How did you recover or wrap up?',
    ],
    lookingFor: ['accountability', 'analysis', 'recovery'],
  },

  // ACHIEVEMENT
  {
    id: 'achieve_1',
    category: 'achievement',
    question: "What's a professional accomplishment you're most proud of?",
    followUps: [
      'Why does this one stand out to you?',
      'What was the hardest part?',
      'How did others recognize your contribution?',
    ],
    lookingFor: ['impact', 'specifics', 'ownership', 'metrics'],
  },
  {
    id: 'achieve_2',
    category: 'achievement',
    question:
      'Tell me about a time you exceeded expectations on a project or task.',
    followUps: [
      "What did 'exceeding' look like specifically?",
      'Was this recognized by your team or manager?',
      'What drove you to go beyond what was asked?',
    ],
    lookingFor: ['initiative', 'measurable impact', 'motivation'],
  },

  // PROBLEM SOLVING
  {
    id: 'problem_1',
    category: 'problem_solving',
    question:
      'Describe a complex problem you had to solve with limited information or resources.',
    followUps: [
      'How did you decide where to start?',
      'What assumptions did you make?',
      'How did you validate your solution?',
    ],
    lookingFor: ['analytical thinking', 'resourcefulness', 'validation'],
  },
  {
    id: 'problem_2',
    category: 'problem_solving',
    question:
      'Tell me about a time you had to learn something quickly to solve a problem.',
    followUps: [
      'How did you approach learning the new skill?',
      'How long did it take?',
      'Would you do anything differently?',
    ],
    lookingFor: ['learning agility', 'self-direction', 'application'],
  },

  // PRESSURE
  {
    id: 'pressure_1',
    category: 'pressure',
    question:
      'Tell me about a time you had to deliver results under a tight deadline.',
    followUps: [
      'How did you prioritize what to do?',
      'What did you sacrifice or deprioritize?',
      'Did you meet the deadline?',
    ],
    lookingFor: ['prioritization', 'time management', 'delivery'],
  },
  {
    id: 'pressure_2',
    category: 'pressure',
    question:
      'Describe a high-stakes situation where you had to make a decision quickly.',
    followUps: [
      'What information did you have at the time?',
      'What was the outcome?',
      'Would you make the same decision again?',
    ],
    lookingFor: ['decisiveness', 'judgment', 'reflection'],
  },

  // LEADERSHIP
  {
    id: 'lead_1',
    category: 'leadership',
    question:
      'Tell me about a time you took the lead on something without being asked.',
    followUps: [
      'Why did you step up?',
      'How did others respond?',
      'What was the result?',
    ],
    lookingFor: ['initiative', 'influence', 'outcome'],
  },
  {
    id: 'lead_2',
    category: 'leadership',
    question:
      'Describe a situation where you had to motivate others or get buy-in for an idea.',
    followUps: [
      'What resistance did you face?',
      'How did you persuade them?',
      'Did everyone get on board?',
    ],
    lookingFor: ['persuasion', 'empathy', 'persistence'],
  },

  // GROWTH
  {
    id: 'growth_1',
    category: 'growth',
    question:
      "What's the most valuable feedback you've ever received, and how did you act on it?",
    followUps: [
      'Was it hard to hear?',
      'How long did it take to change?',
      'Have you received similar feedback since?',
    ],
    lookingFor: ['coachability', 'self-awareness', 'growth'],
  },

  // MOTIVATION
  {
    id: 'motivation_1',
    category: 'motivation',
    question: 'What motivates you to do your best work?',
    followUps: [
      'Can you give me an example of when you felt that motivation?',
      'What demotivates you?',
    ],
    lookingFor: ['self-awareness', 'authenticity', 'alignment'],
  },

  // CLOSING
  {
    id: 'closing_1',
    category: 'closing',
    question:
      "Is there anything about your experience or skills that we haven't covered that you'd like to share?",
    followUps: [],
    lookingFor: ['preparation', 'self-advocacy'],
  },
]

// Interview structure: which categories to cover and in what order
export const INTERVIEW_STRUCTURE: QuestionCategory[][] = [
  ['intro'],
  ['teamwork', 'conflict', 'leadership'], // Pick 1-2
  ['failure', 'problem_solving', 'pressure'], // Pick 1-2
  ['achievement', 'growth'],
  ['motivation', 'closing'],
]

export function selectQuestionsForSession(count: number = 5): Question[] {
  const selected: Question[] = []

  // Always start with intro
  const introQs = BEHAVIORAL_QUESTIONS.filter((q) => q.category === 'intro')
  selected.push(introQs[Math.floor(Math.random() * introQs.length)])

  // Pick from middle sections
  const middleCategories: QuestionCategory[] = [
    'teamwork',
    'conflict',
    'failure',
    'achievement',
    'problem_solving',
    'pressure',
    'leadership',
  ]

  const shuffled = middleCategories.sort(() => Math.random() - 0.5)
  const categoriesToCover = shuffled.slice(0, count - 2)

  for (const category of categoriesToCover) {
    const questions = BEHAVIORAL_QUESTIONS.filter(
      (q) => q.category === category
    )
    if (questions.length > 0) {
      selected.push(questions[Math.floor(Math.random() * questions.length)])
    }
  }

  // End with closing or motivation
  const closingQs = BEHAVIORAL_QUESTIONS.filter(
    (q) => q.category === 'closing' || q.category === 'motivation'
  )
  selected.push(closingQs[Math.floor(Math.random() * closingQs.length)])

  return selected
}

export function getQuestionById(id: string): Question | undefined {
  return BEHAVIORAL_QUESTIONS.find((q) => q.id === id)
}

export function getRandomFollowUp(question: Question): string | null {
  if (question.followUps.length === 0) return null
  return question.followUps[
    Math.floor(Math.random() * question.followUps.length)
  ]
}
