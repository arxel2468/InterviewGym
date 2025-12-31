import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function GET() {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    const response = await groq.models.list()
    
    // Return full model data to see what info we have
    return NextResponse.json({
      count: response.data.length,
      models: response.data.map(m => ({
        id: m.id,
        object: m.object,
        created: m.created,
        owned_by: m.owned_by,
        // Include any other fields that exist
        ...m
      }))
    }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      details: error 
    }, { status: 500 })
  }
}