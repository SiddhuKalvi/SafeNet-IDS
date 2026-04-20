// Global state management for packet capture
// This uses Node.js process memory, so state persists across API calls

class CaptureState {
  private captureRunning: boolean = false
  private captureInterval: NodeJS.Timeout | null = null

  isRunning(): boolean {
    return this.captureRunning
  }

  setRunning(running: boolean): void {
    this.captureRunning = running
  }

  setInterval(interval: NodeJS.Timeout | null): void {
    this.captureInterval = interval
  }

  getInterval(): NodeJS.Timeout | null {
    return this.captureInterval
  }

  stopCapture(): void {
    if (this.captureInterval) {
      clearInterval(this.captureInterval)
      this.captureInterval = null
    }
    this.captureRunning = false
  }
}

export const captureState = new CaptureState()
