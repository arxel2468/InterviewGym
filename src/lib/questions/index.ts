export type InterviewType =
  | 'behavioral'
  | 'technical'
  | 'hr_screen'
  | 'system_design'

export type TargetRole =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'data'
  | 'devops'
  | 'mobile'
  | 'qa'
  | 'product'
  | 'general'

export type QuestionCategory = string

export type Question = {
  id: string
  category: QuestionCategory
  question: string
  followUps: string[]
  lookingFor: string[]
  roles?: TargetRole[] // If undefined, applies to all
}

export type InterviewConfig = {
  type: InterviewType
  role: TargetRole
  questionCount: number
  durationMinutes: number
  description: string
}

export const INTERVIEW_CONFIGS: Record<
  InterviewType,
  Omit<InterviewConfig, 'role'>
> = {
  behavioral: {
    type: 'behavioral',
    questionCount: 5,
    durationMinutes: 15,
    description: 'STAR-format questions about past experiences',
  },
  technical: {
    type: 'technical',
    questionCount: 6,
    durationMinutes: 20,
    description: 'Conceptual technical questions for your role',
  },
  hr_screen: {
    type: 'hr_screen',
    questionCount: 8,
    durationMinutes: 15,
    description: 'Initial screening: motivation, availability, salary',
  },
  system_design: {
    type: 'system_design',
    questionCount: 3,
    durationMinutes: 25,
    description: 'Design systems and discuss trade-offs',
  },
}

export const ROLE_LABELS: Record<TargetRole, string> = {
  frontend: 'Frontend Developer',
  backend: 'Backend Developer',
  fullstack: 'Full Stack Developer',
  data: 'Data Engineer / Scientist',
  devops: 'DevOps / SRE',
  mobile: 'Mobile Developer',
  qa: 'QA / Test Engineer',
  product: 'Product Manager',
  general: 'General / Other',
}
