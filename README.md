# InterviewGym

InterviewGym is a Next.js 13 (App Router) application for creating, running, and reviewing AI-assisted mock interview sessions. It combines server-side logic, a client UI, voice recording/processing, and integrations with database and AI services to let users run interactive interview sessions, capture audio, transcribe, synthesize voice, and store session data.

## Key features

- **Interactive interview sessions**: start new sessions, record responses, and review session history.
- **Audio recording & playback**: browser recording, server-side transcription and TTS synthesis.
- **Session feedback**: collect and store reviewer feedback for each session.
- **User onboarding & auth**: basic onboarding flows and auth provider integration.

## Tech stack

- **Framework**: Next.js 13 (App Router) — source in [src/app](src/app)
- **Database**: Prisma ORM (schema in `prisma/schema.prisma`) with your chosen SQL database (Postgres recommended)
- **Auth / Realtime**: Supabase integration (see [src/lib/supabase](src/lib/supabase))
- **AI / TTS / Transcription**: Pluggable providers called from server API routes in [src/app/api](src/app/api)
- **UI**: Tailwind CSS + React components in [src/components](src/components)

## Project layout (high level)

- **App entry & routes**: [src/app](src/app)
- **Server helpers**: [src/lib](src/lib)
- **UI components**: [src/components]
- **Hooks**: [src/hooks]
- **Prisma client**: [src/lib/prisma.ts](src/lib/prisma.ts)
- **Supabase helpers**: [src/lib/supabase](src/lib/supabase)

## Environment variables

Create a `.env.local` in the project root and set the variables your chosen providers require. Common variables used in the codebase include (confirm exact keys by inspecting the files linked above):

- **DATABASE_URL**: connection string for Prisma/Postgres
- **NEXTAUTH_URL**: app base URL for auth callbacks
- **NEXTAUTH_SECRET**: random secret for NextAuth (if used)
- **SUPABASE_URL** and **SUPABASE_ANON_KEY**: for Supabase client (and **SUPABASE_SERVICE_ROLE_KEY** for server operations)
- **OPENAI_API_KEY** (or other AI provider keys): for transcription / LLM usage if integrated
- **TTS_API_KEY** / **SPEECH_KEY**: for any external text-to-speech provider you configure

Note: exact env names and usage are referenced in [src/lib](src/lib) and [src/app/api](src/app/api). Open those files if you need to map variables to specific providers.

## Local development

1. Install dependencies:

```bash
npm install
# or
pnpm install
```

2. Prepare the database (using Prisma):

```bash
# create/migrate your database (example for Postgres)
npx prisma migrate dev --name init
npx prisma generate
```

3. Run the dev server:

```bash
npm run dev
# or
pnpm dev
```

4. Open http://localhost:3000

## Database & Prisma

- Prisma schema is at `prisma/schema.prisma`. Use `DATABASE_URL` to point to your database.
- Common commands:

```bash
npx prisma migrate dev
npx prisma studio
```

## Supabase

- The repository contains a Supabase client and middleware in [src/lib/supabase](src/lib/supabase) and [src/lib/supabase/server.ts]. Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` (and service role key for server tasks).

## AI, TTS, and Transcription providers

- This app is built to be provider-agnostic: server API routes perform transcription and synthesis via helper modules in [src/lib/groq] and [src/lib]. Add provider API keys to `.env.local` and update the relevant helper to match the provider's SDK/API.
- Check these entry points:
	- [src/app/api/voice/synthesize/route.ts](src/app/api/voice/synthesize/route.ts)
	- [src/app/api/voice/transcribe/route.ts](src/app/api/voice/transcribe/route.ts)
	- [src/app/api/interview/respond/route.ts](src/app/api/interview/respond/route.ts)

For example, to enable OpenAI-based transcription (Whisper) or text-to-speech, set `OPENAI_API_KEY` and implement the provider in the helper modules.

## Running tests / linting / formatting

- If this project includes tests or linting scripts, run them via `npm run` scripts. Example:

```bash
npm run lint
npm run format
npm test
```

## Deployment

- The app targets platforms that support Next.js (Vercel, Netlify, etc.). Ensure env variables are set in the hosting platform.
- Build command:

```bash
npm run build
npm start
```

## Where to look next (important files)

- App routes and pages: [src/app](src/app)
- API routes: [src/app/api](src/app/api)
- Prisma client: [src/lib/prisma.ts](src/lib/prisma.ts)
- Supabase helpers: [src/lib/supabase](src/lib/supabase)
- Audio hooks: [src/hooks/use-audio-recorder.ts](src/hooks/use-audio-recorder.ts) and [src/hooks/use-audio-player.ts](src/hooks/use-audio-player.ts)

## Contributing

- Create feature branches, run the dev server locally, and open a PR with a description of your changes.

