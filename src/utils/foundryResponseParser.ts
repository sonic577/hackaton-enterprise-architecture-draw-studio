import { ConnectorType, Diagram, DiagramConnector, DiagramNode } from '../types'
import { ProcessAnalysisResult } from './processAnalyzer'

interface FoundryNode {
  id?: unknown
  name?: unknown
  title?: unknown
  type?: unknown
  description?: unknown
  layer?: unknown
  status?: unknown
  evidence?: unknown
  linkedDiagramId?: unknown
  bpmnType?: unknown
  category?: unknown
  width?: unknown
  height?: unknown
  position?: unknown
  x?: unknown
  y?: unknown
}

interface FoundryConnector {
  id?: unknown
  sourceId?: unknown
  targetId?: unknown
  relationshipType?: unknown
  type?: unknown
  label?: unknown
  description?: unknown
  evidence?: unknown
  status?: unknown
}

interface FoundryResponse {
  nodes: FoundryNode[]
  connectors: FoundryConnector[]
  diagrams: FoundryDiagram[]
  assumptions: string[]
  gaps: string[]
  risks: string[]
  recommendations: string[]
}

interface FoundryDiagram {
  id?: unknown
  name?: unknown
  parentNodeId?: unknown
  nodes?: unknown
  connectors?: unknown
}

export interface ParsedFoundryResponse {
  nodes: DiagramNode[]
  connectors: DiagramConnector[]
  diagrams: Diagram[]
  analysisResults: ProcessAnalysisResult[]
}

export type FoundryParseResult =
  | { kind: 'not-json' }
  | { kind: 'invalid'; error: string }
  | { kind: 'valid'; data: ParsedFoundryResponse }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toStringValue = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback

const toStringArray = (value: unknown) =>
  Array.isArray(value) ? value.filter(item => typeof item === 'string') : []

const slug = (value: string) =>
  value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

const normalizeNodeType = (type: string, layer: string) => {
  const raw = `${type} ${layer}`.toLowerCase()
  const typeSlug = slug(type || 'process')

  if (raw.includes('mission')) return 'mission'
  if (raw.includes('vision')) return 'vision'
  if (raw.includes('bottleneck')) return 'bottleneck'
  if (raw.includes('gap')) return 'gap'
  if (raw.includes('risk')) return 'risk'
  if (raw.includes('recommendation')) return 'recommendation'
  if (raw.includes('solution')) return 'solution'
  if (raw.includes('data store') || raw.includes('database')) return 'data_store'
  if (raw.includes('system')) return 'system'
  if (raw.includes('process')) return 'process'

  if (raw.includes('bpmn')) return `bpmn_${typeSlug}`
  if (raw.includes('business architecture')) return `togaf_business_${typeSlug}`
  if (raw.includes('data architecture')) return `togaf_data_${typeSlug}`
  if (raw.includes('application architecture')) return `togaf_application_${typeSlug}`
  if (raw.includes('technology architecture')) return `togaf_technology_${typeSlug}`
  if (raw.includes('motivation') || raw.includes('strategy')) return `togaf_motivation_${typeSlug}`
  if (raw.includes('governance')) return `togaf_governance_${typeSlug}`

  return typeSlug || 'process'
}

const normalizeConnectorType = (value: string): ConnectorType => {
  const normalized = slug(value)
  const supported: ConnectorType[] = [
    'related_to',
    'uses',
    'depends_on',
    'supports',
    'contains',
    'impacts',
    'consumes',
    'produces',
    'flow',
    'association'
  ]

  if (normalized === 'related' || normalized === 'relatedto') return 'related_to'
  if (supported.includes(normalized as ConnectorType)) return normalized as ConnectorType
  return 'related_to'
}

const getPosition = (node: FoundryNode, index: number) => {
  const position = isRecord(node.position) ? node.position : null
  const x = typeof node.x === 'number' ? node.x : typeof position?.x === 'number' ? position.x : 140 + (index % 4) * 240
  const y = typeof node.y === 'number' ? node.y : typeof position?.y === 'number' ? position.y : 140 + Math.floor(index / 4) * 180
  return { x, y }
}

const parseDiagramElements = (
  rawNodes: FoundryNode[],
  rawConnectors: FoundryConnector[],
  idPrefix: string
) => {
  const idMap = new Map<string, string>()
  const nodes: DiagramNode[] = rawNodes.map((node, index) => {
    const oldId = toStringValue(node.id, `node-${index + 1}`)
    const name = toStringValue(node.name, toStringValue(node.title, `Foundry Node ${index + 1}`))
    const type = toStringValue(node.type, 'process')
    const layer = toStringValue(node.layer)
    const newId = `${idPrefix}-node-${index + 1}`
    const evidence = Array.isArray(node.evidence)
      ? node.evidence.filter(item => typeof item === 'string')
      : typeof node.evidence === 'string'
        ? [node.evidence]
        : undefined

    idMap.set(oldId, newId)

    return {
      id: newId,
      type: normalizeNodeType(type, layer),
      name,
      title: name,
      description: toStringValue(node.description),
      layer: layer || undefined,
      bpmnType: toStringValue(node.bpmnType) || undefined,
      category: toStringValue(node.category) || undefined,
      position: getPosition(node, index),
      width: typeof node.width === 'number' ? node.width : 180,
      height: typeof node.height === 'number' ? node.height : 120,
      status: ['extracted', 'inferred', 'pending', 'confirmed'].includes(toStringValue(node.status))
        ? toStringValue(node.status) as DiagramNode['status']
        : 'inferred',
      evidence,
      source: 'Foundry'
    }
  })

  const connectors: DiagramConnector[] = rawConnectors.flatMap((connector, index) => {
    const oldSourceId = toStringValue(connector.sourceId)
    const oldTargetId = toStringValue(connector.targetId)
    const sourceId = idMap.get(oldSourceId)
    const targetId = idMap.get(oldTargetId)

    if (!sourceId || !targetId || sourceId === targetId) return []

    const type = normalizeConnectorType(toStringValue(connector.relationshipType, toStringValue(connector.type, 'related_to')))
    const evidence = Array.isArray(connector.evidence)
      ? connector.evidence.filter(item => typeof item === 'string')
      : typeof connector.evidence === 'string'
        ? [connector.evidence]
        : undefined

    return [{
      id: `${idPrefix}-conn-${index + 1}`,
      sourceId,
      targetId,
      type,
      label: toStringValue(connector.label, type.replace(/_/g, ' ')),
      description: toStringValue(connector.description),
      evidence,
      source: 'Foundry',
      lineStyle: type === 'related_to' ? 'dashed' : 'solid',
      startMarker: 'none',
      endMarker: type === 'association' ? 'none' : type === 'contains' ? 'diamond' : 'arrow',
      status: ['extracted', 'inferred', 'pending', 'confirmed'].includes(toStringValue(connector.status))
        ? toStringValue(connector.status) as DiagramConnector['status']
        : 'inferred'
    }]
  })

  return { nodes, connectors, idMap }
}

const analysisResult = (
  group: ProcessAnalysisResult['group'],
  title: string,
  description: string,
  index: number
): ProcessAnalysisResult => ({
  id: `foundry-${group}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  group,
  title,
  description,
  severity: group === 'Risks' ? 'high' : group === 'Gaps' ? 'medium' : 'low',
  relatedNodeIds: [],
  reasoning: 'Imported from Foundry response.',
  suggestedAction: description
})

export const parseFoundryResponse = (input: string): FoundryParseResult => {
  const trimmed = input.trim()
  if (!trimmed.startsWith('{')) return { kind: 'not-json' }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    return { kind: 'invalid', error: 'Quick Capture received JSON, but it is not valid JSON.' }
  }

  if (!isRecord(parsed)) {
    return { kind: 'invalid', error: 'Foundry response must be a JSON object.' }
  }

  if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.connectors)) {
    return { kind: 'invalid', error: 'Foundry response must include nodes and connectors arrays.' }
  }

  const response: FoundryResponse = {
    nodes: parsed.nodes as FoundryNode[],
    connectors: parsed.connectors as FoundryConnector[],
    diagrams: Array.isArray(parsed.diagrams) ? parsed.diagrams as FoundryDiagram[] : [],
    assumptions: toStringArray(parsed.assumptions),
    gaps: toStringArray(parsed.gaps),
    risks: toStringArray(parsed.risks),
    recommendations: toStringArray(parsed.recommendations)
  }
  const idPrefix = `foundry-${Date.now()}`
  const diagramIdMap = new Map<string, string>()
  response.diagrams.forEach((diagram, index) => {
    const oldId = toStringValue(diagram.id, `diagram-${index + 1}`)
    diagramIdMap.set(oldId, `${idPrefix}-diagram-${index + 1}`)
  })

  const rootElements = parseDiagramElements(response.nodes, response.connectors, idPrefix)
  const nodes: DiagramNode[] = response.nodes.map((node, index) => {
    const parsedNode = rootElements.nodes[index]
    const oldLinkedDiagramId = toStringValue(node.linkedDiagramId)

    return {
      ...parsedNode,
      linkedDiagramId: oldLinkedDiagramId ? diagramIdMap.get(oldLinkedDiagramId) : undefined
    }
  })

  const connectors = rootElements.connectors
  const diagrams: Diagram[] = response.diagrams.map((diagram, index) => {
    const rawNodes = Array.isArray(diagram.nodes) ? diagram.nodes as FoundryNode[] : []
    const rawConnectors = Array.isArray(diagram.connectors) ? diagram.connectors as FoundryConnector[] : []
    const elements = parseDiagramElements(rawNodes, rawConnectors, `${idPrefix}-diagram-${index + 1}`)
    const oldParentNodeId = toStringValue(diagram.parentNodeId)

    return {
      id: diagramIdMap.get(toStringValue(diagram.id, `diagram-${index + 1}`)) ?? `${idPrefix}-diagram-${index + 1}`,
      name: toStringValue(diagram.name, `Generated Diagram ${index + 1}`),
      parentNodeId: oldParentNodeId ? rootElements.idMap.get(oldParentNodeId) : undefined,
      nodes: elements.nodes,
      connectors: elements.connectors
    }
  })

  const analysisResults: ProcessAnalysisResult[] = [
    ...response.assumptions.map((item, index) => analysisResult('Recommendations', 'Foundry assumption', item, index)),
    ...response.gaps.map((item, index) => analysisResult('Gaps', 'Foundry gap', item, index)),
    ...response.risks.map((item, index) => analysisResult('Risks', 'Foundry risk', item, index)),
    ...response.recommendations.map((item, index) => analysisResult('Recommendations', 'Foundry recommendation', item, index + response.assumptions.length))
  ]

  return { kind: 'valid', data: { nodes, connectors, diagrams, analysisResults } }
}
