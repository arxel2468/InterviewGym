// src/lib/groq/jd-parser.ts
export async function parseJobDescription(text: string): Promise<{
  company: string
  role: string
  requiredSkills: string[]
  niceToHaveSkills: string[]
  keyResponsibilities: string[]
  suggestedQuestions: string[]
}> {
  // Similar to resume parser but for JDs
}
