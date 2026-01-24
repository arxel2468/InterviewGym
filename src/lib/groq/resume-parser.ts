import { getGroqClient } from './client'
import { executeWithFallback } from './fallback'

export type ParsedResume = {
  name?: string
  email?: string
  phone?: string
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

  const prompt = `Extract structured information from this resume text.

RESUME TEXT:
${rawText.slice(0, 8000)}

Return ONLY valid JSON with this structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "phone number",
  "summary": "Brief professional summary if present",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Date range",
      "highlights": ["Achievement 1", "Achievement 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What it does",
      "technologies": ["tech1", "tech2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "School Name",
      "year": "Graduation year"
    }
  ]
}

Extract real information only. If something isn't present, use empty arrays or omit the field.`

  const result = await executeWithFallback<ParsedResume>(
    'chat',
    async (modelId) => {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You extract structured data from resumes. Respond only with valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })

      const responseText = completion.choices[0]?.message?.content || '{}'
      
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        summary: parsed.summary,
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
      `- ${e.title} at ${e.company} (${e.duration}): ${e.highlights.slice(0, 2).join('; ')}`
    ).join('\n')
    sections.push(`EXPERIENCE:\n${exp}`)
  }

  if (parsed.projects.length > 0) {
    const proj = parsed.projects.map(p =>
      `- ${p.name}: ${p.description} [${p.technologies.join(', ')}]`
    ).join('\n')
    sections.push(`PROJECTS:\n${proj}`)
  }

  if (parsed.education.length > 0) {
    const edu = parsed.education.map(e =>
      `- ${e.degree} from ${e.institution} (${e.year})`
    ).join('\n')
    sections.push(`EDUCATION:\n${edu}`)
  }

  return sections.join('\n\n')
}
