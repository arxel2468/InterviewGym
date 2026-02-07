# InterviewGym

InterviewGym is an AI-powered, voice-first interview practice platform built with Next.js. It helps candidates prepare for job interviews through realistic mock sessions with an intelligent interviewer that asks real questions, challenges weak answers, and delivers actionable feedback.

## Quick Links

- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

## Features

### Interactive Voice Interviews

- **Voice-First Practice**: Speak your answers out loud, just like in a real interview
- **AI Interviewer**: Dynamic interviewer that asks follow-up questions and challenges weak responses
- **Multiple Interview Types**: Behavioral, HR screen, and technical verbal interviews
- **Difficulty Levels**: Warm-up, standard, and intense modes for progressive practice

### Real-Time Feedback & Analytics

- **Speech Metrics**: Tracks filler words, pauses, response length, and word count
- **AI-Evaluated Scores**: Clarity, structure, relevance, and confidence scoring (1-10)
- **Comprehensive Feedback**: Structured strengths, improvements, and suggestions after each session
- **Progress Tracking**: Visualize improvement over time with streak tracking and session history

### User Experience

- **Resume Integration**: Upload your resume for personalized, context-aware interviews
- **Session History**: Review past sessions, transcripts, and performance metrics
- **Responsive Design**: Clean, dark-themed UI built with Tailwind CSS
- **Quick Setup**: Get started in under 30 seconds with Supabase authentication

## Tech Stack

| Layer                  | Technology                                                |
| ---------------------- | --------------------------------------------------------- |
| **Frontend**           | Next.js 14 (App Router), React 18, Tailwind CSS           |
| **UI Components**      | shadcn/ui, Radix UI primitives                            |
| **Database**           | PostgreSQL (Supabase) with Prisma ORM                     |
| **Authentication**     | Supabase Auth                                             |
| **Storage**            | Supabase Storage (resume PDFs)                            |
| **AI Services (Groq)** | Whisper Large V3 (STT), PlayAI (TTS), Llama 3.1 70B (LLM) |
| **Deployment**         | Vercel                                                    |
| **Language**           | TypeScript                                                |

## Architecture

```
+--------------------------------------------------------------------------------+
|                             INTERVIEWGYM ARCHITECTURE                          |
+--------------------------------------------------------------------------------+
|                                                                                |
|  +--------------------------- CLIENT (Browser) -----------------------------+ |
|  | Next.js Frontend | MediaRecorder | Audio Playback                         | |
|  +--------------------------------------------------------------------------+ |
|                             | HTTPS                                           |
|                             v                                                 |
|  +------------------------ VERCEL (API Routes) -----------------------------+ |
|  | /api/auth | /api/session | /api/voice | /api/interview                    | |
|  +-------------------+-------------------+-------------------+--------------+ |
|                      |                   |                   |                |
|                      v                   v                   v                |
|  +-----------+     +-----------+     +---------------------+                   |
|  | SUPABASE  |     |   GROQ    |     |  SUPABASE STORAGE   |                   |
|  | Postgres  |     | Whisper   |     | Resume PDFs         |                   |
|  | Auth      |     | PlayAI    |     |                     |                   |
|  |           |     | Llama 3.1 |     |                     |                   |
|  +-----------+     +-----------+     +---------------------+                   |
|                                                                                |
+--------------------------------------------------------------------------------+
```

## Database Schema

```
User 1:N Session 1:N Message
 |            | 
 |            +-- 1:1 Feedback (optional)
 |            +-- 1:1 Metrics
 |
 +-- 1:1 Resume (optional)
```

## Project Structure

```
interviewgym/
|-- src/
|   |-- app/                    # Next.js App Router
|   |   |-- (auth)/             # Authentication routes
|   |   |-- (dashboard)/        # Protected dashboard routes
|   |   |   |-- session/        # Interview session pages
|   |   |   |-- history/        # Session history
|   |   |   `-- settings/       # User settings
|   |   `-- api/                # API routes
|   |-- components/
|   |   |-- ui/                 # shadcn/ui components
|   |   |-- session/            # Interview session components
|   |   |-- feedback/           # Feedback display components
|   |   `-- dashboard/          # Dashboard components
|   |-- lib/
|   |   |-- supabase/           # Supabase client & middleware
|   |   |-- groq/               # AI service integrations
|   |   |-- prompts/            # LLM system prompts
|   |   |-- questions/          # Interview question banks
|   |   |-- utils/              # Utility functions
|   `-- hooks/                  # Custom React hooks
|-- prisma/
|   `-- schema.prisma           # Database schema
|-- docs/                       # Documentation
`-- public/                     # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Supabase account (for database & auth)
- Groq API key (for AI services)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/arxel2468/interviewgym.git
   cd interviewgym
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Configure the required variables in `.env.local` (see below)

4. **Set up the database**

   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`
### Local Development Notes

- The app expects Supabase Auth enabled and a Postgres database configured.
- The `DATABASE_URL` should use the Supabase connection pooler and `DIRECT_URL` should use the direct connection.
- If you update the Prisma schema, rerun `npx prisma generate`.

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database (Supabase connection pooler)
DATABASE_URL="postgresql://user:password@host:6543/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"

# Groq AI
GROQ_API_KEY=your-groq-api-key

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Variable Reference

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Client-side auth key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-side admin key |
| `DATABASE_URL` | Yes | Prisma pooled connection |
| `DIRECT_URL` | Yes | Prisma direct connection |
| `GROQ_API_KEY` | Yes | Groq API access |
| `NEXT_PUBLIC_APP_URL` | Yes | Base app URL for auth |

### Obtaining API Keys

1. **Supabase**: Create a new project at `https://supabase.com`
2. **Supabase keys**: Go to Settings > API to get your project URL, anon key, and service role key
3. **Groq**: Get your API key at `https://console.groq.com`

## API Endpoints

### Authentication

| Endpoint             | Method | Description            |
| -------------------- | ------ | ---------------------- |
| `/api/auth/callback` | GET    | OAuth callback handler |
| `/api/auth/logout`   | POST   | Clear user session     |

### User Management

| Endpoint               | Method    | Description                |
| ---------------------- | --------- | -------------------------- |
| `/api/user/profile`    | GET/PATCH | Get or update user profile |
| `/api/user/onboarding` | POST      | Complete onboarding flow   |
| `/api/user/progress`   | GET       | Get progress and stats     |

### Resume

| Endpoint      | Method | Description             |
| ------------- | ------ | ----------------------- |
| `/api/resume` | POST   | Upload and parse resume |
| `/api/resume` | GET    | Get parsed resume data  |
| `/api/resume` | DELETE | Remove resume           |

### Sessions

| Endpoint                     | Method | Description                  |
| ---------------------------- | ------ | ---------------------------- |
| `/api/session`               | POST   | Create new interview session |
| `/api/session`               | GET    | Get session history          |
| `/api/session/[id]`          | GET    | Get session details          |
| `/api/session/[id]/complete` | POST   | Mark session complete        |

### Voice

| Endpoint                | Method | Description              |
| ----------------------- | ------ | ------------------------ |
| `/api/voice/transcribe` | POST   | Speech-to-text (Whisper) |
| `/api/voice/synthesize` | POST   | Text-to-speech (PlayAI)  |

### Interview

| Endpoint                 | Method | Description                      |
| ------------------------ | ------ | -------------------------------- |
| `/api/interview/respond` | POST   | Generate AI interviewer response |

### Feedback

| Endpoint                 | Method | Description               |
| ------------------------ | ------ | ------------------------- |
| `/api/feedback/generate` | POST   | Generate session feedback |

## Interview Types

InterviewGym supports multiple interview formats:

| Type                 | Description                                           |
| -------------------- | ----------------------------------------------------- |
| **Behavioral**       | STAR method questions about past experiences          |
| **HR Screen**        | Standard HR questions about background and motivation |
| **Technical Verbal** | Technical questions requiring spoken explanations     |

### Difficulty Levels

| Level        | Use Case                                    |
| ------------ | ------------------------------------------- |
| **Warmup**   | Building confidence, beginners              |
| **Standard** | Regular interview practice                  |
| **Intense**  | High-pressure simulation, advanced practice |

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production server |
| `npm run lint` | Lint the codebase |
| `npx prisma studio` | Explore the database |

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: See the [docs](docs/) folder for detailed architecture and API documentation
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas

---

Built with Next.js, Supabase, and Groq


