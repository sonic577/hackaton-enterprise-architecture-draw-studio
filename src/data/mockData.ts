import { Diagram } from '../types'

export const rootDiagram: Diagram = {
  id: 'diagram-root',
  name: 'Blank Canvas',
  nodes: [],
  connectors: []
}

export const mockDiagrams: Diagram[] = [
  rootDiagram
]

// Legacy export for backward compatibility
export const architectureData = rootDiagram
