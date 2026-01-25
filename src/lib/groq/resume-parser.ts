import { getGroqClient } from './client'
import { executeWithFallback } from './fallback'

export type ParsedResume = {
  name?: string
  email?: string
  summary?: string
  skills: string[]
  experience: {
    title: string
    company: string
    duration: string
    highlights: string[]
  }[]
  projects: {
    name: string
    description: string
    technologies: string[]
  }[]
  education: {
    degree: string
    institution: string
    year: string
  }[]
}

export async function parseResume(rawText: string): Promise<ParsedResume> {
  if (!rawText || rawText.trim().length < 50) {
    return {
      skills: [],
      experience: [],
      projects: [],
      education: [],
    }
  }

  const groq = getGroqClient()

  const prompt = `Extract ONLY information that is EXPLICITLY stated in this resume text. Do NOT invent, assume, or hallucinate any information.

RESUME TEXT:
---
${rawText.slice(0, 6000)}
---

STRICT RULES:
1. Only extract information that appears word-for-word or can be directly inferred from the text
2. If a section is not present, return an empty array
3. Do not guess project names, company names, or skills
4. If unsure about something, omit it entirely
5. Count the actual number of projects/jobs mentioned - do not invent more

Return ONLY valid JSON:
{
  "name": "Full name if clearly stated, otherwise null",
  "email": "Email if present, otherwise null",
  "summary": "Professional summary if explicitly written, otherwise null",
  "skills": ["Only skills explicitly listed"],
  "experience": [
    {
      "title": "Exact job title from resume",
      "company": "Exact company name from resume",
      "duration": "Date range as written",
      "highlights": ["Actual bullet points from resume"]
    }
  ],
  "projects": [
    {
      "name": "Exact project name from resume",
      "description": "Description as written in resume",
      "technologies": ["Only tech explicitly mentioned for this project"]
    }
  ],
  "education": [
    {
      "degree": "Exact degree name",
      "institution": "Exact school name",
      "year": "Year as written"
    }
  ]
}

If the resume only has 2 projects, return exactly 2 projects. Do not invent a third.
Respond with ONLY the JSON, no explanation.`

  const result = await executeWithFallback<ParsedResume>(
    'chat',
    async (modelId) => {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You extract structured data from resumes. You NEVER invent or hallucinate information. If something is not in the text, you do not include it. Respond only with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0, // Zero temperature for deterministic extraction
        max_tokens: 2000,
      })

      const responseText = completion.choices[0]?.message?.content || '{}'
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        name: parsed.name || undefined,
        email: parsed.email || undefined,
        summary: parsed.summary || undefined,
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        projects: Array.isArray(parsed.projects) ? parsed.projects : [],
        education: Array.isArray(parsed.education) ? parsed.education : [],
      }
    }
  )

  if (!result.success) {
    console.error('Resume parsing failed:', result.error)
    return {
      skills: [],
      experience: [],
      projects: [],
      education: [],
    }
  }

  return result.data
}

export function formatResumeForContext(parsed: ParsedResume): string {
  const sections: string[] = []

  if (parsed.summary) {
    sections.push(`SUMMARY: ${parsed.summary}`)
  }

  if (parsed.skills.length > 0) {
    sections.push(`SKILLS: ${parsed.skills.join(', ')}`)
  }

  if (parsed.experience.length > 0) {
    const exp = parsed.experience.map(e => 
      `- ${e.title} at ${e.company} (${e.duration})`
    ).join('\n')
    sections.push(`EXPERIENCE:\n${exp}`)
  }

  if (parsed.projects.length > 0) {
    const proj = parsed.projects.map((p, i) =>
      `- Project ${i + 1}: ${p.name} - ${p.description} [${p.technologies.join(', ')}]`
    ).join('\n')
    sections.push(`PROJECTS (${parsed.projects.length} total):\n${proj}`)
  }

  if (parsed.education.length > 0) {
    const edu = parsed.education.map(e =>
      `- ${e.degree} from ${e.institution} (${e.year})`
    ).join('\n')
    sections.push(`EDUCATION:\n${edu}`)
  }

  // Add explicit instruction to prevent hallucination
  sections.push(`\nIMPORTANT: Only ask about the ${parsed.projects.length} projects listed above. Do not reference projects that are not in this list.`)

  return sections.join('\n\n')
}
