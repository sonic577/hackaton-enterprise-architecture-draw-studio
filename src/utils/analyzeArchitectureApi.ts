import { Diagram } from '../types'

export interface ArchitectureAnalysisResponse {
  nodes: unknown[]
  connectors: unknown[]
  diagrams?: unknown[]
  assumptions: string[]
  gaps: string[]
  risks: string[]
  recommendations: string[]
}

export const analyzeArchitecture = async (
  text: string,
  currentDiagram?: Diagram
): Promise<ArchitectureAnalysisResponse> => {
  const response = await fetch('/api/analyze-architecture', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, currentDiagram })
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload) {
    throw new Error(payload?.error ?? 'Architecture analysis failed.')
  }

  return payload as ArchitectureAnalysisResponse
}
