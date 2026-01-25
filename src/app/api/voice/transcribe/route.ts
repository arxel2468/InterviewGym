import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transcribeAudio } from '@/lib/groq/transcribe'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get('audio')
    
    if (!audioFile) {
      return NextResponse.json({
        success: false,
        error: 'No audio provided',
        friendlyMessage: 'No audio was received. Please try again.',
      }, { status: 400 })
    }

    // Handle both File and Blob
    let audioBlob: Blob
    if (audioFile instanceof File) {
      audioBlob = audioFile
    } else if (audioFile instanceof Blob) {
      audioBlob = audioFile
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid audio format',
        friendlyMessage: 'Audio format not recognized. Please try again.',
      }, { status: 400 })
    }

    // Validate size
    if (audioBlob.size < 1000) {
      return NextResponse.json({
        success: false,
        error: 'Audio too short',
        friendlyMessage: 'Recording was too short. Please speak for at least 1 second.',
      }, { status: 400 })
    }

    if (audioBlob.size > 25 * 1024 * 1024) {
      return NextResponse.json({
        success: false,
        error: 'Audio too large',
        friendlyMessage: 'Recording was too long. Please keep responses under 5 minutes.',
      }, { status: 400 })
    }

    console.log('Received audio for transcription:', {
      size: audioBlob.size,
      type: audioBlob.type,
    })

    const result = await transcribeAudio(audioBlob)

    // Check if it's an error result
    if ('success' in result && result.success === false) {
      return NextResponse.json(result, { status: 400 })
    }
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Transcription route error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Transcription failed',
        friendlyMessage: 'Could not transcribe audio. Please try again.',
      },
      { status: 500 }
    )
  }
}
