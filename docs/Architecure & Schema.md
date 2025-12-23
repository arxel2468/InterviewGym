# The Complete Stack

┌─────────────────────────────────────────────────────────────┐
│                   INTERVIEWGYM TECH STACK                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  FRONTEND                                                   │
│  ─────────                                                  │
│  Framework: Next.js 14 (App Router)                         │
│  Styling: Tailwind CSS                                      │
│  UI Components: shadcn/ui (free, copy-paste components)     │
│  State: React hooks + Context (no Redux needed)             │
│  Audio: Web Audio API + MediaRecorder                       │
│                                                             │
│  BACKEND                                                    │
│  ────────                                                   │
│  Runtime: Next.js API Routes (Vercel serverless)            │
│  Auth: Supabase Auth                                        │
│  Database: Supabase (Postgres)                              │
│  Storage: Supabase Storage (resume PDFs)                    │
│  ORM: Prisma (type-safe queries)                            │
│                                                             │
│  AI SERVICES (via Groq)                                     │
│  ─────────────────────                                      │
│  STT: Whisper Large V3                                      │
│  TTS: PlayAI                                                │
│  LLM: Llama 3.1 70B Versatile                               │
│                                                             │
│  DEPLOYMENT                                                 │
│  ──────────                                                 │
│  Hosting: Vercel                                            │
│  Database: Supabase Cloud                                   │
│  CI/CD: Vercel Git Integration                              │
│                                                             │
│  COST: $0                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

# Database Schema

## Entity Relationship Overview
┌─────────────────────────────────────────────────────────────┐
│                  ENTITY RELATIONSHIPS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐       ┌──────────────┐       ┌────────────┐  │
│  │   User   │──────<│   Session    │──────<│  Message   │  │
│  └──────────┘  1:N  └──────────────┘  1:N  └────────────┘  │
│       │                    │                               │
│       │                    │                               │
│       │              ┌─────┴─────┐                         │
│       │              │           │                         │
│       │              ▼           ▼                         │
│       │       ┌──────────┐ ┌──────────────┐               │
│       │       │ Feedback │ │   Metrics    │               │
│       │       └──────────┘ └──────────────┘               │
│       │                                                    │
│       │ 1:1 (optional)                                     │
│       ▼                                                    │
│  ┌──────────┐                                              │
│  │  Resume  │                                              │
│  └──────────┘                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

# Prisma Schema
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================
// USER
// ============================================
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  avatarUrl String?
  
  // Onboarding data
  targetRole    String?   // "software_engineer", "product_manager", etc.
  interviewTimeline String? // "this_week", "2_4_weeks", "exploring"
  
  // Gamification
  totalSessions Int @default(0)
  currentStreak Int @default(0)
  longestStreak Int @default(0)
  lastSessionAt DateTime?
  
  // Relations
  sessions  Session[]
  resume    Resume?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ============================================
// RESUME (Optional upload)
// ============================================
model Resume {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Storage
  fileUrl   String   // Supabase storage URL
  fileName  String
  
  // Parsed content (extracted by AI)
  rawText       String?  @db.Text // Full extracted text
  parsedData    Json?    // Structured: { skills: [], projects: [], experience: [] }
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ============================================
// SESSION (One interview workout)
// ============================================
model Session {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Session config
  interviewType String   // "behavioral", "hr_screen", "technical_verbal"
  difficulty    String   // "warmup", "standard", "intense"
  
  // Status
  status    String   @default("in_progress") // "in_progress", "completed", "abandoned"
  
  // Timing
  startedAt   DateTime @default(now())
  completedAt DateTime?
  durationSeconds Int?
  
  // Resume context (if used)
  usedResume  Boolean @default(false)
  
  // Relations
  messages  Message[]
  feedback  Feedback?
  metrics   Metrics?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId, createdAt])
}

// ============================================
// MESSAGE (Each Q&A exchange)
// ============================================
model Message {
  id        String   @id @default(uuid())
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  // Message data
  role      String   // "interviewer" or "candidate"
  content   String   @db.Text // The transcript
  
  // Audio reference (optional, for replay feature)
  audioUrl  String?
  
  // Timing
  startedAt   DateTime
  endedAt     DateTime
  durationMs  Int
  
  // Candidate message analysis (only for role="candidate")
  fillerWordCount Int?
  pauseCount      Int?
  longestPauseMs  Int?
  wordCount       Int?
  
  // Order in conversation
  orderIndex Int
  
  createdAt DateTime @default(now())
  
  @@index([sessionId, orderIndex])
}

// ============================================
// METRICS (Aggregated session stats)
// ============================================
model Metrics {
  id        String   @id @default(uuid())
  sessionId String   @unique
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  // Quantitative metrics
  totalFillerWords    Int
  totalPauses         Int
  longestPauseMs      Int
  averageResponseMs   Int
  totalWordCount      Int
  questionsAnswered   Int
  
  // AI-evaluated scores (1-10)
  clarityScore        Int?
  structureScore      Int?
  relevanceScore      Int?
  confidenceScore     Int?
  overallScore        Int?
  
  createdAt DateTime @default(now())
}

// ============================================
// FEEDBACK (AI-generated post-session)
// ============================================
model Feedback {
  id        String   @id @default(uuid())
  sessionId String   @unique
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  // Structured feedback
  strengths     Json   // ["Gave specific examples", "Good energy"]
  improvements  Json   // ["Lacked clear outcomes", "Too many filler words"]
  suggestions   Json   // ["Try using STAR format", "Pause before answering"]
  
  // Full summary
  summary       String @db.Text
  
  // User rating of feedback quality (optional)
  helpfulnessRating Int? // 1-5
  
  createdAt DateTime @default(now())
}

## Schema Design Decisions Explained
Decision	Rationale
---
UUID for IDs	Secure, no enumeration attacks, works with Supabase
---
Separate Metrics table	Keeps Session clean, easy to query for progress charts
---
Separate Feedback table	Generated async after session, can regenerate if needed
---
Message orderIndex	Ensures conversation order even if timestamps collide
---
Cascade deletes	User deletion cleans up all related data (GDPR friendly)
---
parsedData as JSON	Flexible schema for resume parsing, can evolve
---
Indexes on userId + createdAt	Fast queries for "my recent sessions"


# System Architecture Diagram
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTERVIEWGYM ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                         CLIENT (Browser)                         │     │
│    ├─────────────────────────────────────────────────────────────────┤     │
│    │                                                                  │     │
│    │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │     │
│    │   │   Next.js    │  │  MediaRecorder│  │    Audio Playback    │ │     │
│    │   │   Frontend   │  │  (Record)     │  │    (TTS Response)    │ │     │
│    │   └──────────────┘  └──────────────┘  └──────────────────────┘ │     │
│    │                                                                  │     │
│    └─────────────────────────────────┬───────────────────────────────┘     │
│                                      │                                      │
│                                      │ HTTPS                                │
│                                      ▼                                      │
│    ┌─────────────────────────────────────────────────────────────────┐     │
│    │                    VERCEL (Next.js API Routes)                   │     │
│    ├─────────────────────────────────────────────────────────────────┤     │
│    │                                                                  │     │
│    │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │     │
│    │   │ /api/auth   │ │/api/session │ │ /api/voice  │              │     │
│    │   │             │ │             │ │             │              │     │
│    │   │ • login     │ │ • create    │ │ • transcribe│              │     │
│    │   │ • logout    │ │ • complete  │ │ • synthesize│              │     │
│    │   │ • callback  │ │ • history   │ │             │              │     │
│    │   └─────────────┘ └─────────────┘ └─────────────┘              │     │
│    │                                                                  │     │
│    │   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐              │     │
│    │   │/api/interview│ │/api/feedback│ │ /api/user   │              │     │
│    │   │             │ │             │ │             │              │     │
│    │   │ • respond   │ │ • generate  │ │ • profile   │              │     │
│    │   │ • context   │ │ • rate      │ │ • progress  │              │     │
│    │   └─────────────┘ └─────────────┘ └─────────────┘              │     │
│    │                                                                  │     │
│    └────────┬──────────────────┬──────────────────┬─────────────────┘     │
│             │                  │                  │                        │
│             ▼                  ▼                  ▼                        │
│    ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐              │
│    │   SUPABASE  │    │    GROQ     │    │ SUPABASE STORAGE│              │
│    ├─────────────┤    ├─────────────┤    ├─────────────────┤              │
│    │             │    │             │    │                 │              │
│    │  Postgres   │    │ Whisper STT │    │  Resume PDFs    │              │
│    │  Database   │    │ PlayAI TTS  │    │  (Optional)     │              │
│    │             │    │ Llama 3.1   │    │                 │              │
│    │  Auth       │    │             │    │                 │              │
│    │             │    │             │    │                 │              │
│    └─────────────┘    └─────────────┘    └─────────────────┘              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

# API Endpoint Specification
Authentication Endpoints
Endpoint	Method	Purpose
/api/auth/callback	GET	OAuth callback handler
/api/auth/logout	POST	Clear session
Note: Most auth is handled by Supabase client-side SDK

User Endpoints
Endpoint	Method	Purpose	Request Body	Response
GET /api/user/profile	GET	Get current user	-	{ user, stats }
PATCH /api/user/profile	PATCH	Update onboarding	{ targetRole, timeline }	{ user }
GET /api/user/progress	GET	Get progress data	-	{ sessions, streaks, trends }
Resume Endpoints
Endpoint	Method	Purpose
POST /api/resume/upload	POST	Upload & parse resume
GET /api/resume	GET	Get parsed resume data
DELETE /api/resume	DELETE	Remove resume
Session Endpoints
Endpoint	Method	Purpose
POST /api/session/create	POST	Start new interview session
GET /api/session/:id	GET	Get session details
POST /api/session/:id/complete	POST	Mark session complete
GET /api/session/history	GET	Get past sessions
Voice Endpoints
Endpoint	Method	Purpose
POST /api/voice/transcribe	POST	Audio → Text (Whisper)
POST /api/voice/synthesize	POST	Text → Audio (PlayAI)
Interview Endpoints
Endpoint	Method	Purpose
POST /api/interview/respond	POST	Get AI interviewer response
POST /api/interview/analyze-message	POST	Analyze single response
Feedback Endpoints
Endpoint	Method	Purpose
POST /api/feedback/generate	POST	Generate session feedback
POST /api/feedback/:id/rate	POST	Rate feedback helpfulness

# Project Structure
interviewgym/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── callback/
│   │       └── route.ts
│   │
│   ├── (dashboard)/              # Protected routes
│   │   ├── layout.tsx            # Dashboard layout with nav
│   │   ├── page.tsx              # Dashboard home
│   │   ├── session/
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # Session setup
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Active interview
│   │   │       └── feedback/
│   │   │           └── page.tsx  # Post-session feedback
│   │   ├── history/
│   │   │   └── page.tsx          # Training log
│   │   └── profile/
│   │       └── page.tsx          # User settings
│   │
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts
│   │   ├── user/
│   │   │   ├── profile/
│   │   │   │   └── route.ts
│   │   │   └── progress/
│   │   │       └── route.ts
│   │   ├── resume/
│   │   │   └── route.ts
│   │   ├── session/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── complete/
│   │   │           └── route.ts
│   │   ├── voice/
│   │   │   ├── transcribe/
│   │   │   │   └── route.ts
│   │   │   └── synthesize/
│   │   │       └── route.ts
│   │   ├── interview/
│   │   │   └── respond/
│   │   │       └── route.ts
│   │   └── feedback/
│   │       ├── generate/
│   │       │   └── route.ts
│   │       └── [id]/
│   │           └── rate/
│   │               └── route.ts
│   │
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── landing/
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   └── cta.tsx
│   │
│   ├── dashboard/
│   │   ├── stats-card.tsx
│   │   ├── session-card.tsx
│   │   └── streak-display.tsx
│   │
│   ├── session/
│   │   ├── interview-screen.tsx
│   │   ├── voice-recorder.tsx
│   │   ├── ai-avatar.tsx
│   │   ├── status-indicator.tsx
│   │   └── atmospheric-loader.tsx
│   │
│   └── feedback/
│       ├── transcript-view.tsx
│       ├── metrics-display.tsx
│       └── suggestions-list.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Auth middleware
│   │
│   ├── groq/
│   │   ├── client.ts             # Groq SDK setup
│   │   ├── transcribe.ts         # Whisper wrapper
│   │   ├── synthesize.ts         # PlayAI wrapper
│   │   └── interview-ai.ts       # LLM interviewer logic
│   │
│   ├── prompts/
│   │   ├── interviewer.ts        # Interviewer system prompts
│   │   ├── feedback.ts           # Feedback generation prompts
│   │   └── resume-parser.ts      # Resume extraction prompts
│   │
│   ├── questions/
│   │   └── behavioral.ts         # Question bank
│   │
│   ├── utils/
│   │   ├── audio.ts              # Audio processing helpers
│   │   ├── metrics.ts            # Calculate filler words, pauses
│   │   └── streak.ts             # Streak calculation logic
│   │
│   └── constants.ts              # App-wide constants
│
├── hooks/
│   ├── use-audio-recorder.ts     # MediaRecorder hook
│   ├── use-session.ts            # Session state management
│   └── use-voice-chat.ts         # Voice conversation logic
│
├── types/
│   ├── database.ts               # Generated from Prisma
│   ├── api.ts                    # API request/response types
│   └── interview.ts              # Interview-specific types
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                   # Seed question bank
│
├── public/
│   ├── images/
│   └── sounds/                   # UI sounds (optional)
│
├── .env.local                    # Environment variables
├── .env.example                  # Template for env vars
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md

# Environment Variables
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq
GROQ_API_KEY=your-groq-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Key Technical Flows

##Flow 1: Voice Conversation Loop
┌─────────────────────────────────────────────────────────────────┐
│                  VOICE CONVERSATION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. AI asks question                                            │
│     └── Text from LLM                                           │
│     └── POST /api/voice/synthesize                              │
│     └── PlayAI returns audio                                    │
│     └── Browser plays audio                                     │
│                                                                 │
│  2. User responds                                               │
│     └── Browser MediaRecorder captures audio                    │
│     └── User clicks "Done" or silence detection                 │
│     └── Audio blob created                                      │
│                                                                 │
│  3. Transcribe user response                                    │
│     └── POST /api/voice/transcribe (audio blob)                 │
│     └── Whisper returns text                                    │
│     └── Calculate metrics (filler words, pauses)                │
│     └── Save Message to database                                │
│                                                                 │
│  4. Generate AI follow-up                                       │
│     └── POST /api/interview/respond                             │
│     └── Send: conversation history + user's response            │
│     └── LLM generates contextual follow-up                      │
│     └── Save Message to database                                │
│                                                                 │
│  5. Repeat from step 1                                          │
│     └── Until session complete (5-8 exchanges)                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

## Flow 2: Session Lifecycle
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION LIFECYCLE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CREATE                                                         │
│  ──────                                                         │
│  └── User selects type + difficulty                             │
│  └── Optional: Resume context loaded                            │
│  └── Session record created (status: in_progress)               │
│  └── Initial question selected/generated                        │
│                                                                 │
│  ACTIVE                                                         │
│  ──────                                                         │
│  └── Voice conversation loop (5-8 exchanges)                    │
│  └── Each exchange creates 2 Messages                           │
│  └── Real-time metrics calculated per response                  │
│                                                                 │
│  COMPLETE                                                       │
│  ────────                                                       │
│  └── User ends or max questions reached                         │
│  └── Session status → completed                                 │
│  └── Aggregate Metrics calculated and saved                     │
│  └── Feedback generated async                                   │
│  └── User streak updated                                        │
│                                                                 │
│  ABANDON (edge case)                                            │
│  ───────                                                        │
│  └── User leaves mid-session                                    │
│  └── Detect on next visit or timeout                            │
│  └── Mark status → abandoned                                    │
│  └── Partial data preserved for analysis                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

# Risk Mitigations Built Into Architecture
Risk	Mitigation in Architecture
Groq rate limits	Rate limiting middleware per user (3 sessions/day)
Voice latency	Stream TTS response, show atmospheric messages during processing
Large audio files	Compress client-side, chunk if >25MB Whisper limit
Session abandonment	Status field tracks; partial data still valuable
Database growth	Text is small; audio URLs point to storage, not stored in DB
Auth token expiry	Supabase handles refresh automatically
Cold starts (Vercel)	Keep functions small; LLM calls dominate latency anyway
