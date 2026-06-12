// Position in 2D canvas
export interface Position {
  x: number
  y: number
}

// Legacy architecture element shape used by older panel components
export interface ArchitectureElement {
  id: string
  type: string
  title: string
  description: string
  context?: string
  properties: Record<string, string | number | boolean>
  impact?: string
  evidence?: string[]
  relationships?: {
    parentId?: string
    childIds?: string[]
    relatedIds?: string[]
  }
}

// Connector/Relationship types
export type ConnectorType = 'related_to' | 'uses' | 'depends_on' | 'supports' | 'contains' | 'impacts' | 'consumes' | 'produces' | 'flow' | 'association'
export type ConnectorLineStyle = 'solid' | 'dashed' | 'dotted'
export type ConnectorMarker = 'none' | 'arrow' | 'open_arrow' | 'diamond' | 'circle'

// Node in the diagram
export interface DiagramNode {
  id: string
  type: string // mission, vision, process, system, data_store, etc.
  name?: string
  layer?: string
  bpmnType?: string
  category?: string
  title: string
  description?: string
  position: Position
  width?: number
  height?: number
  properties?: Record<string, string | number | boolean>
  evidence?: string[]
  source?: string
  impact?: string
  context?: string
  status?: 'extracted' | 'inferred' | 'pending' | 'confirmed'
  linkedDiagramId?: string // ID of a diagram that expands this node
  childDiagramId?: string // Legacy nested diagram reference
}

// Connector/relationship between nodes
export interface DiagramConnector {
  id: string
  sourceId: string
  targetId: string
  type: ConnectorType
  label?: string
  lineStyle?: ConnectorLineStyle
  startMarker?: ConnectorMarker
  endMarker?: ConnectorMarker
  direction?: string
  description?: string
  evidence?: string[]
  source?: string
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
export type SelectionType = 'node' | 'connector' | 'multi' | 'canvas' | null
export interface Selection {
  type: SelectionType
  id?: string
  nodeIds?: string[]
  connectorIds?: string[]
}

// Diagram with optional parent node reference
export interface Diagram {
  id: string
  name: string
  parentId?: string // ID of parent diagram for hierarchy
  parentNodeId?: string // ID of node that owns this diagram (for breadcrumb)
  nodes: DiagramNode[]
  connectors: DiagramConnector[]
}
