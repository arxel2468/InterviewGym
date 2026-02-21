import { Question } from './index'

export const HR_SCREEN_QUESTIONS: Question[] = [
  {
    id: 'hr_intro_1',
    category: 'intro',
    question: 'Tell me a bit about yourself and your background.',
    followUps: [
      'What made you interested in this type of role?',
      'How does this fit into your career goals?',
    ],
    lookingFor: ['concise summary', 'relevance', 'enthusiasm'],
  },
  {
    id: 'hr_motivation_1',
    category: 'motivation',
    question: 'What are you looking for in your next role?',
    followUps: [
      'What would make a company a great fit for you?',
      "What's non-negotiable for you in a job?",
    ],
    lookingFor: ['clarity', 'self-awareness', 'alignment'],
  },
  {
    id: 'hr_motivation_2',
    category: 'motivation',
    question: 'Why are you leaving your current position?',
    followUps: [
      'What would have made you stay?',
      "Is there anything you'll miss?",
    ],
    lookingFor: ['professionalism', 'growth-focused', 'no bad-mouthing'],
  },
  {
    id: 'hr_availability_1',
    category: 'logistics',
    question: "What's your availability? When could you start?",
    followUps: [
      'Do you have any other offers or interviews in progress?',
      'Is there anything that might affect your start date?',
    ],
    lookingFor: ['clarity', 'honesty', 'flexibility'],
  },
  {
    id: 'hr_salary_1',
    category: 'compensation',
    question: 'What are your salary expectations for this role?',
    followUps: [
      'Is that flexible depending on the total package?',
      "What's most important to you beyond base salary?",
    ],
    lookingFor: ['research', 'confidence', 'reasonableness'],
  },
  {
    id: 'hr_remote_1',
    category: 'logistics',
    question: "What's your preference for remote vs in-office work?",
    followUps: [
      'How have you managed remote collaboration in the past?',
      "What's your home office setup like?",
    ],
    lookingFor: ['flexibility', 'experience', 'practicality'],
  },
  {
    id: 'hr_strength_1',
    category: 'self_assessment',
    question: 'What would you say is your greatest strength?',
    followUps: [
      'Can you give me an example of when that helped you?',
      'How has this developed over time?',
    ],
    lookingFor: ['self-awareness', 'examples', 'relevance'],
  },
  {
    id: 'hr_weakness_1',
    category: 'self_assessment',
    question: "What's an area you're working to improve?",
    followUps: [
      'What are you doing about it?',
      'How has it affected your work?',
    ],
    lookingFor: ['honesty', 'growth mindset', 'self-awareness'],
  },
  {
    id: 'hr_questions_1',
    category: 'closing',
    question: 'What questions do you have about the role or company?',
    followUps: [],
    lookingFor: ['preparation', 'genuine interest', 'thoughtfulness'],
  },
]

export function getHRScreenQuestions(count: number = 8): Question[] {
  // Always include intro and closing
  const intro = HR_SCREEN_QUESTIONS.filter((q) => q.category === 'intro')
  const closing = HR_SCREEN_QUESTIONS.filter((q) => q.category === 'closing')
  const middle = HR_SCREEN_QUESTIONS.filter(
    (q) => q.category !== 'intro' && q.category !== 'closing'
  )

  const shuffledMiddle = [...middle].sort(() => Math.random() - 0.5)
  const selected = shuffledMiddle.slice(0, count - 2)

  return [intro[0], ...selected, closing[0]]
}
