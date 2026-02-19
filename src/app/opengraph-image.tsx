// src/app/opengraph-image.tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'InterviewGym - Practice Interviews with AI'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #09090B 0%, #1a1a2e 50%, #09090B 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, color: 'white', display: 'flex' }}>
          Interview
          <span style={{ background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', backgroundClip: 'text', color: 'transparent' }}>
            Gym
          </span>
        </div>
        <div style={{ fontSize: 28, color: '#a1a1aa', marginTop: 16 }}>
          Fail your interviews safely, before you fail them expensively.
        </div>
      </div>
    ),
    { ...size }
  )
}
