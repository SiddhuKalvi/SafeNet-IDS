import { NextResponse } from 'next/server'
import { captureState } from '@/lib/capture-state'

export async function POST() {
  try {
    captureState.stopCapture()

    return NextResponse.json({
      status: 'stopped',
      message: 'Packet capture stopped successfully',
    })
  } catch (error) {
    console.error('[v0] Failed to stop capture:', error)
    return NextResponse.json(
      { error: 'Failed to stop packet capture', details: String(error) },
      { status: 500 }
    )
  }
}
