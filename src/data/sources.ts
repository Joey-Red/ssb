import type { SourceRef } from '../types'

export const sources = [] as const satisfies readonly SourceRef[]
export const sourceById = new Map<string, SourceRef>()
