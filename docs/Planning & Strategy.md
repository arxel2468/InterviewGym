# Core User Stories (MVP)

┌─────────────────────────────────────────────────────────────┐
│ CORE USER STORIES │
├─────────────────────────────────────────────────────────────┤
│ │
│ STORY 1: First Session │
│ ───────────────────────── │
│ As a fresh graduate with an upcoming interview, │
│ I want to practice answering behavioral questions │
│ out loud │
│ So that I can experience interview pressure without │
│ real consequences. │
│ │
│ Acceptance Criteria: │
│ • I can start a session in under 30 seconds │
│ • AI asks me a behavioral question via voice │
│ • I respond via voice │
│ • AI follows up based on what I said │
│ • Session feels like a real interview, not a chatbot │
│ │
│ ─────────────────────────────────────────────────────── │
│ │
│ STORY 2: Personalized Practice │
│ ───────────────────────────── │
│ As a candidate with specific projects on my resume, │
│ I want the interviewer to ask about MY experience │
│ So that I practice articulating my actual stories, │
│ not generic ones. │
│ │
│ Acceptance Criteria: │
│ • I can optionally upload my resume │
│ • AI extracts projects, skills, experiences │
│ • Questions reference my specific background │
│ • "Tell me about the React project you mentioned..." │
│ │
│ ─────────────────────────────────────────────────────── │
│ │
│ STORY 3: Honest Feedback │
│ ──────────────────────── │
│ As someone who doesn't know what I'm doing wrong, │
│ I want specific, actionable feedback after my session │
│ So that I know exactly what to improve. │
│ │
│ Acceptance Criteria: │
│ • I see a transcript of everything I said │
│ • I see metrics: filler words, pause lengths, word count │
│ • I get AI analysis: structure, clarity, missed points │
│ • Feedback is specific ("You didn't explain the outcome") │
│ not generic ("Try to be more clear") │
│ │
│ ─────────────────────────────────────────────────────── │
│ │
│ STORY 4: Track My Progress │
│ ────────────────────────── │
│ As someone practicing over multiple sessions, │
│ I want to see if I'm actually getting better │
│ So that I stay motivated and see ROI on my time. │
│ │
│ Acceptance Criteria: │
│ • I see history of past sessions │
│ • I see trends: "Filler words: 47 → 23 → 12" │
│ • I feel progress, not just repetition │
│ │
│ ─────────────────────────────────────────────────────── │
│ │
│ STORY 5: Controlled Difficulty │
│ ───────────────────────────── │
│ As someone who freezes under pressure, │
│ I want to start with a friendly interviewer and │
│ gradually face tougher ones │
│ So that I build tolerance without being overwhelmed. │
│ │
│ Acceptance Criteria: │
│ • I can choose difficulty: Warm-up / Standard / Intense │
│ • Warm-up: Encouraging, hints if I freeze │
│ • Standard: Neutral, realistic corporate interviewer │
│ • Intense: Skeptical, interrupts, uncomfortable silences │
│ │
└─────────────────────────────────────────────────────────────┘

# MVP Feature Set

┌─────────────────────────────────────────────────────────────┐
│ MVP FEATURE MATRIX │
├─────────────────────────────────────────────────────────────┤
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ MUST HAVE (Launch Blockers) │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ • Voice input (STT via Groq Whisper) │ │
│ │ • Voice output (TTS via Groq PlayAI) │ │
│ │ • Behavioral question bank (20-30 questions) │ │
│ │ • Adaptive follow-up logic │ │
│ │ • Single session flow (10-15 min interview) │ │
│ │ • Post-session transcript │ │
│ │ • Basic metrics (filler words, pause count) │ │
│ │ • AI feedback summary │ │
│ │ • Difficulty selector (3 levels) │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ SHOULD HAVE (Week 2-3) │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ • Resume upload + parsing │ │
│ │ • Personalized questions from resume │ │
│ │ • Session history │ │
│ │ • Progress dashboard │ │
│ │ • Rate limiting (3 sessions/day free) │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ COULD HAVE (v1.x) │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ • Atmospheric loading messages │ │
│ │ • Session replay with audio │ │
│ │ • Gamification (streaks, achievements) │ │
│ │ • Voice quality tier fallback │ │
│ │ • HR screen mode │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ WON'T HAVE (Not This Version) │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ • Live coding environment │ │
│ │ • Peer matching │ │
│ │ • Video recording/analysis │ │
│ │ • Mobile app │ │
│ │ • Payment/premium tier │ │
│ └─────────────────────────────────────────────────────┘ │
│ │
└─────────────────────────────────────────────────────────────┘

# User Flow (Detailed)

┌─────────────────────────────────────────────────────────────┐
│ UPDATED USER FLOW WITH AUTH │
├─────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────┐ │
│ │ LANDING │ │
│ │ PAGE │ │
│ └──────┬───────┘ │
│ │ │
│ ▼ │
│ "The interview gym. Train until you can't fail." │
│ │
│ [Start Training] ← CTA │
│ │ │
│ ▼ │
│ ┌──────────────────────────────────────────┐ │
│ │ AUTH SCREEN │ │
│ ├──────────────────────────────────────────┤ │
│ │ │ │
│ │ "Create your training profile" │ │
│ │ │ │
│ │ [Continue with Google] │ │
│ │ [Continue with GitHub] │ │
│ │ [Continue with Email] │ │
│ │ │ │
│ │ "2 seconds. Progress saved forever." │ │
│ │ │ │
│ └──────────────────┬───────────────────────┘ │
│ │ │
│ ▼ │
│ ┌──────────────────────────────────────────┐ │
│ │ QUICK ONBOARDING (First Time Only) │ │
│ ├──────────────────────────────────────────┤ │
│ │ │ │
│ │ "What are you preparing for?" │ │
│ │ ○ Software Engineering roles │ │
│ │ ○ Product / PM roles │ │
│ │ ○ Data / Analytics roles │ │
│ │ ○ Other │ │
│ │ │ │
│ │ "How soon is your interview?" │ │
│ │ ○ This week (Intense mode recommended) │ │
│ │ ○ 2-4 weeks (Time to build habits) │ │
│ │ ○ Just exploring │ │
│ │ │ │
│ │ [Let's Train] │ │
│ │ │ │
│ └──────────────────┬───────────────────────┘ │
│ │ │
│ ▼ │
│ ┌──────────────────────────────────────────┐ │
│ │ DASHBOARD (Home) │ │
│ ├──────────────────────────────────────────┤ │
│ │ │ │
│ │ Welcome back, [Name] 💪 │ │
│ │ │ │
│ │ YOUR TRAINING STATS │ │
│ │ ──────────────────── │ │
│ │ Sessions completed: 7 │ │
│ │ Current streak: 3 days 🔥 │ │
│ │ Clarity score trend: 5 → 6 → 7 │ │
│ │ │ │
│ │ [Start New Workout] │ │
│ │ │ │
│ │ RECENT SESSIONS │ │
│ │ ─────────────── │ │
│ │ • Yesterday - Behavioral (Standard) │ │
│ │ • 2 days ago - Behavioral (Warm-up) │ │
│ │ │ │
│ │ [View Training Log] │ │
│ │ │ │
│ └──────────────────┬───────────────────────┘ │
│ │ │
│ ▼ │
│ (Continues to Session Setup...) │
│ │
└─────────────────────────────────────────────────────────────┘

# Step 4: Success Metrics

How do we know if this is working?

North Star Metric
Sessions completed per user per week

If users keep coming back and finishing sessions, the product is delivering value.

Supporting Metrics
Metric Target (MVP) Why It Matters
Session completion rate >70% Are people finishing or abandoning mid-interview?
Return rate (7-day) >30% Are they coming back to practice more?
Sessions before "job outcome" Track How many sessions before they report getting a job?
Feedback helpfulness rating >4/5 Is the feedback actually useful?
Time-to-first-session <60 seconds Is onboarding frictionless?
Voice latency (round-trip) <3 seconds Does it feel conversational or laggy?

# Step 5: Product Name Brainstorm

We should probably name this thing:

Direction Examples
Gym/training metaphor InterviewGym, MockReps, PrepReps
Pressure/intensity PressureTest, HotSeat, TheGrill
Safety/practice SafeInterview, FailSafe, PracticeRound
Direct/clear MockVoice, InterviewSim, VoicePrep
Clever/memorable Stammr, Nervo, FreezeLess
