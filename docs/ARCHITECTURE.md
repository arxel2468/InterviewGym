# InterviewGym Architecture

## Overview

InterviewGym is a voice-first AI interview practice platform built with Next.js 14.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │   Next.js   │  │ MediaRecorder│  │   Audio Playback   │  │
│  │   Frontend  │  │   (Voice)    │  │   (TTS Response)   │  │
│  └──────┬──────┘  └──────┬───────┘  └─────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          ▼                ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Next.js API Routes                 │    │
│  │  /api/session  /api/voice  /api/interview  /api/user│    │
│  └──────────────────────┬──────────────────────────────┘    │
└─────────────────────────┼───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Supabase   │  │     Groq     │  │   Sentry     │
│  ┌────────┐  │  │  ┌────────┐  │  │  ┌────────┐  │
│  │  Auth  │  │  │  │ Whisper│  │  │  │ Errors │  │
│  │Postgres│  │  │  │ Llama  │  │  │  │ Traces │  │
│  │Storage │  │  │  │  TTS   │  │  │  │ Replay │  │
│  └────────┘  │  └──────────────┘  └──────────────┘
└──────────────┘
```

## Data Flow

### Interview Session Flow

```
1. User clicks "Start Session"
   └─→ POST /api/session (create session in DB)
   
2. Frontend initializes
   └─→ POST /api/interview/respond (get first question)
   └─→ POST /api/voice/synthesize (TTS)
   └─→ Audio plays in browser
   
3. User speaks answer
   └─→ MediaRecorder captures audio
   └─→ POST /api/voice/transcribe (Whisper STT)
   └─→ POST /api/interview/respond (AI response)
   └─→ POST /api/voice/synthesize (TTS)
   └─→ Audio plays
   
4. Repeat step 3 for N questions

5. User ends session
   └─→ POST /api/session/[id]/complete
   └─→ AI generates feedback
   └─→ Save to database
   └─→ Redirect to feedback page
```

## Database Schema

```
User (1) ──────────── (*) Session
  │                        │
  │                        ├── (*) Message
  │                        │
  └── (1) Resume           ├── (1) Metrics
                           │
                           └── (1) Feedback
```

## AI Models

| Service | Model | Purpose |
|---------|-------|---------|
| STT | Whisper Large V3 | Speech-to-text transcription |
| LLM | Llama 3.1 70B | Interview logic, feedback generation |
| TTS | PlayAI/Orpheus | Text-to-speech responses |

## Key Design Decisions

1. **Voice-first**: Speaking answers builds real interview skills
2. **Graceful degradation**: Browser TTS fallback if cloud fails
3. **Session-based**: Each interview is a complete unit with metrics
4. **Progressive difficulty**: Warmup → Standard → Intense
5. **Resume context**: Personalized questions from user's experience
