// src/lib/groq/jd-parser.ts

export async function parseJobDescription(text: string): Promise<{
  company: string
  role: string
  requiredSkills: string[]
  niceToHaveSkills: string[]
  keyResponsibilities: string[]
  suggestedQuestions: string[]
}> {
  // TODO: Implement with Groq LLM
  return {
    company: '',
    role: '',
    requiredSkills: [],
    niceToHaveSkills: [],
    keyResponsibilities: [],
    suggestedQuestions: [],
  }
}
