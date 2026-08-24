export const FPS = 60

export function framesToMilliseconds(frames: number): number {
  if (!Number.isFinite(frames) || frames < 0) {
    throw new RangeError('frames must be a finite non-negative number')
  }
  return (frames / FPS) * 1000
}

export function formatFrames(frames: number): string {
  if (!Number.isInteger(frames) || frames < 0) {
    throw new RangeError('frames must be a non-negative integer')
  }
  return `${frames}f`
}

export function formatActiveWindow(start: number, end: number): string {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end < start) {
    throw new RangeError('active frame window must be positive and ordered')
  }
  return start === end ? `${start}f` : `${start}–${end}f`
}
