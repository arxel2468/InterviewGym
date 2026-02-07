// src/lib/groq/resume-parser.ts

import { getGroqClient } from './client'
import { executeWithFallback } from './fallback'
import { sanitizeForAI } from '@/lib/utils/sanitize'

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
  if (!rawText || rawText.trim().length < 100) {
    console.log('Resume text too short:', rawText?.length || 0)
    return {
      skills: [],
      experience: [],
      projects: [],
      education: [],
    }
  }

  // Sanitize input
  const sanitizedText = sanitizeForAI(rawText, 10000)

  const groq = getGroqClient()

  // Take first 8000 chars to stay within token limits
  const textToProcess = sanitizedText.substring(0, 8000)

  const prompt = `You are a resume parser. Extract structured information from this resume text.

RESUME TEXT:
"""
${textToProcess}
"""

Extract ALL information you can find. Look carefully for:
- Name (usually at the top)
- Email and phone
- Skills (programming languages, tools, frameworks)
- Work experience (job titles, companies, dates, bullet points)
- Projects (project names, descriptions, technologies used)
- Education (degrees, schools, years)

Return a JSON object with this structure:
{
  "name": "Full Name",
  "email": "email@example.com",
  "summary": "Professional summary if present",
  "skills": ["Python", "Django", "Next.js", "TypeScript", "PostgreSQL"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Nov 2024 – Mar 2025",
      "highlights": ["Built X", "Increased Y by Z%"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What it does",
      "technologies": ["Next.js", "PostgreSQL", "Prisma"]
    }
  ],
  "education": [
    {
      "degree": "Bachelor's in Information Technology",
      "institution": "College Name",
      "year": "2023"
    }
  ]
}

IMPORTANT:
- Extract EVERYTHING you can find
- For projects, look for headers like "PROJECTS" and extract each project separately
- For skills, combine all technical skills mentioned anywhere
- If you see bullet points with achievements, include them in highlights
- Return valid JSON only, no markdown`

  const result = await executeWithFallback<ParsedResume>(
    'chat',
    async (modelId) => {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are a resume parser. Extract all information and return valid JSON only. No markdown, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2500,
      })

      const responseText = completion.choices[0]?.message?.content || '{}'
      console.log('LLM response:', responseText.substring(0, 500))

      // Extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('No JSON found in response')
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      console.log('Parsed JSON:', {
        name: parsed.name,
        skillsCount: parsed.skills?.length,
        expCount: parsed.experience?.length,
        projCount: parsed.projects?.length,
        eduCount: parsed.education?.length,
      })

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

  if (parsed.name) {
    sections.push(`CANDIDATE: ${parsed.name}`)
  }

  if (parsed.summary) {
    sections.push(`SUMMARY: ${parsed.summary}`)
  }

  if (parsed.skills.length > 0) {
    sections.push(`SKILLS: ${parsed.skills.join(', ')}`)
  }

  if (parsed.experience.length > 0) {
    const exp = parsed.experience.map(e => {
      let text = `- ${e.title} at ${e.company}`
      if (e.duration) text += ` (${e.duration})`
      if (e.highlights && e.highlights.length > 0) {
        text += `: ${e.highlights.slice(0, 2).join('; ')}`
      }
      return text
    }).join('\n')
    sections.push(`WORK EXPERIENCE:\n${exp}`)
  }

  if (parsed.projects.length > 0) {
    const proj = parsed.projects.map((p, i) => {
      let text = `${i + 1}. ${p.name}`
      if (p.description) text += ` - ${p.description}`
      if (p.technologies && p.technologies.length > 0) {
        text += ` [${p.technologies.join(', ')}]`
      }
      return text
    }).join('\n')
    sections.push(`PROJECTS (${parsed.projects.length} total):\n${proj}`)
  }

  if (parsed.education.length > 0) {
    const edu = parsed.education.map(e =>
      `- ${e.degree} from ${e.institution} (${e.year})`
    ).join('\n')
    sections.push(`EDUCATION:\n${edu}`)
  }

  if (sections.length === 0) {
    return ''
  }

  // Add instruction at the end
  const projectCount = parsed.projects.length
  if (projectCount > 0) {
    sections.push(`\nYou may ask about any of the ${projectCount} projects listed above. Reference them by name.`)
  }

  return sections.join('\n\n')
}
