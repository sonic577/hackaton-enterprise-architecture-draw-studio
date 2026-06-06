// Position in 2D canvas
export interface Position {
  x: number
  y: number
}

// Connector/Relationship types
export type ConnectorType = 'related_to' | 'uses' | 'depends_on' | 'supports' | 'contains' | 'impacts' | 'consumes' | 'produces' | 'flow' | 'association'

// Node in the diagram
export interface DiagramNode {
  id: string
  type: string // mission, vision, process, system, data_store, etc.
  title: string
  description?: string
  position: Position
  properties?: Record<string, string | number | boolean>
  evidence?: string[]
  impact?: string
  context?: string
  status?: 'extracted' | 'inferred' | 'pending' | 'confirmed'
  childDiagramId?: string // ID of nested diagram for this node
}

// Connector/relationship between nodes
export interface DiagramConnector {
  id: string
  sourceId: string
  targetId: string
  type: ConnectorType
  label?: string
  description?: string
  evidence?: string[]
  impact?: string
  status?: 'extracted' | 'inferred' | 'pending' | 'confirmed'
}

// Canvas state
export interface DiagramData {
  projectName: string
  nodes: DiagramNode[]
  connectors: DiagramConnector[]
  metadata: {
    createdAt: string
    version: string
  }
}

// Selection state
export type SelectionType = 'node' | 'connector' | 'canvas' | null
export interface Selection {
  type: SelectionType
  id?: string
}

// Diagram with optional parent node reference
export interface Diagram {
  id: string
  parentNodeId?: string // ID of node that owns this diagram (for breadcrumb)
  nodes: DiagramNode[]
  connectors: DiagramConnector[]
}
