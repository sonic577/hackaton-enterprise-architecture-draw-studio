import type { ConnectorType, Diagram, DiagramConnector, DiagramNode } from '../types'
import type { ProcessAnalysisResult } from './processAnalyzer'

interface FoundryNode {
  id?: unknown
  name?: unknown
  title?: unknown
  type?: unknown
  description?: unknown
  layer?: unknown
  status?: unknown
  evidence?: unknown
  properties?: unknown
  linkedDiagramId?: unknown
  bpmnType?: unknown
  category?: unknown
  width?: unknown
  height?: unknown
  position?: unknown
  x?: unknown
  y?: unknown
  order?: unknown
  laneId?: unknown
  groupId?: unknown
  row?: unknown
  column?: unknown
  parentId?: unknown
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
  layoutPlan?: FoundryLayoutPlan
  assumptions: string[]
  gaps: string[]
  risks: string[]
  recommendations: string[]
}

interface FoundryLayoutPlan {
  viewType?: unknown
  layoutStyle?: unknown
  groups?: unknown
  ordering?: unknown
  notes?: unknown
}

interface FoundryDiagram {
  id?: unknown
  name?: unknown
  parentNodeId?: unknown
  nodes?: unknown
  connectors?: unknown
  layoutPlan?: unknown
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

const VALID_NODE_TYPES = new Set([
  'Mission',
  'Vision',
  'Goal',
  'Objective',
  'Business Context',
  'Capability',
  'Value Chain',
  'Business Process',
  'Process Step',
  'Actor',
  'Role',
  'Gap',
  'Risk',
  'Recommendation',
  'Solution Option',
  'Application Component',
  'Data Entity',
  'Data Store',
  'Data Flow',
  'Database',
  'Data Object',
  'Technology Component',
  'Runtime',
  'Framework',
  'Server',
  'Network',
  'Device',
  'Storage Device',
  'Cloud Service',
  'Deployment Unit',
  'Integration',
  'Application Service',
  'System',
  'API',
  'Interface',
  'Event',
  'Message Queue',
  'Workflow',
  'Policy',
  'Control',
  'Standard',
  'Compliance Check',
  'Issue',
  'Bottleneck',
  'Pain Point',
  'Decision',
  'Action',
  'Driver',
  'Requirement',
  'Constraint',
  'Organization Unit',
  'Value Stream',
  'Note'
])

const NODE_TYPE_ALIASES: Record<string, string> = {
  mission: 'Mission',
  vision: 'Vision',
  goal: 'Goal',
  goals: 'Goal',
  meta: 'Goal',
  metas: 'Goal',
  objective: 'Objective',
  objectives: 'Objective',
  objetivo: 'Objective',
  objetivos: 'Objective',
  target: 'Objective',
  targets: 'Objective',
  okr: 'Objective',
  okrs: 'Objective',
  capability: 'Capability',
  value_chain: 'Value Chain',
  valuechain: 'Value Chain',
  value_stream: 'Value Stream',
  business_context: 'Business Context',
  business_process: 'Business Process',
  process: 'Business Process',
  process_step: 'Process Step',
  step: 'Process Step',
  task: 'Process Step',
  actor: 'Actor',
  role: 'Role',
  gap: 'Gap',
  problem: 'Gap',
  issue: 'Gap',
  risk: 'Risk',
  recommendation: 'Recommendation',
  solution: 'Solution Option',
  solution_option: 'Solution Option',
  application_component: 'Application Component',
  application: 'Application Component',
  system: 'Application Component',
  data_entity: 'Data Entity',
  data_object: 'Data Entity',
  data_flow: 'Data Flow',
  data_store: 'Data Store',
  database: 'Data Store',
  technology_component: 'Technology Component',
  technology: 'Technology Component',
  runtime: 'Runtime',
  framework: 'Framework',
  server: 'Server',
  network: 'Network',
  device: 'Device',
  storage_device: 'Storage Device',
  cloud_service: 'Cloud Service',
  deployment_unit: 'Deployment Unit',
  integration: 'Integration',
  application_service: 'Application Service',
  api: 'API',
  interface: 'Interface',
  event: 'Event',
  message_queue: 'Message Queue',
  workflow: 'Workflow',
  policy: 'Policy',
  control: 'Control',
  standard: 'Standard',
  compliance_check: 'Compliance Check',
  bottleneck: 'Bottleneck',
  pain_point: 'Pain Point',
  decision: 'Decision',
  action: 'Action',
  driver: 'Driver',
  requirement: 'Requirement',
  constraint: 'Constraint',
  organization_unit: 'Organization Unit',
  note: 'Note',
  generated_summary: 'Note'
}

const DOMAIN_TYPE_FALLBACKS: Record<string, string> = {
  motivation: 'Objective',
  business: 'Business Context',
  process: 'Business Process',
  application: 'Application Component',
  data: 'Data Entity',
  technology: 'Technology Component',
  integration: 'Integration',
  security: 'Policy',
  risk: 'Risk',
  recommendation: 'Recommendation',
  note: 'Note'
}

const isObjectiveContext = (value: string) =>
  /\b(so-\d{1,3}|objetivo|objetivos|meta|metas|goal|goals|objective|objectives|target|targets|okr|okrs)\b/i.test(value)

const normalizeBpmnNodeType = (typeSlug: string, raw: string) => {
  if (typeSlug.startsWith('bpmn_')) return typeSlug
  if (raw.includes('exclusive gateway')) return 'bpmn_exclusive_gateway_x'
  if (raw.includes('parallel gateway')) return 'bpmn_parallel_gateway'
  if (raw.includes('inclusive gateway')) return 'bpmn_inclusive_gateway_o'
  if (raw.includes('start event')) return 'bpmn_start_event'
  if (raw.includes('intermediate event')) return 'bpmn_intermediate_event'
  if (raw.includes('end event')) return 'bpmn_end_event'
  if (raw.includes('user task')) return 'bpmn_user_task'
  if (raw.includes('service task')) return 'bpmn_service_task'
  if (raw.includes('manual task')) return 'bpmn_manual_task'
  if (raw.includes('business rule task')) return 'bpmn_business_rule_task'
  if (raw.includes('lane')) return 'bpmn_lane'
  if (raw.includes('pool')) return 'bpmn_pool'
  return `bpmn_${typeSlug || 'task'}`
}

const normalizeNodeType = (type: string, layer: string, name = '', description = '') => {
  const raw = `${type} ${layer} ${name} ${description}`.toLowerCase()
  const typeAndLayer = `${type} ${layer}`.toLowerCase()
  const typeSlug = slug(type || '')

  if (
    typeAndLayer.includes('bpmn') ||
    typeAndLayer.includes('gateway') ||
    typeAndLayer.includes('event') ||
    typeAndLayer.includes(' task') ||
    typeAndLayer.includes('lane') ||
    typeAndLayer.includes('pool')
  ) {
    return normalizeBpmnNodeType(typeSlug, typeAndLayer)
  }

  if (typeSlug === 'motivation') {
    return isObjectiveContext(raw) ? 'Objective' : 'Note'
  }

  if (DOMAIN_TYPE_FALLBACKS[typeSlug]) {
    return DOMAIN_TYPE_FALLBACKS[typeSlug]
  }

  const directType = NODE_TYPE_ALIASES[typeSlug] ?? NODE_TYPE_ALIASES[slug(`${type} ${layer}`)]
  if (directType && VALID_NODE_TYPES.has(directType)) return directType

  if (raw.includes('mission')) return 'Mission'
  if (raw.includes('vision')) return 'Vision'
  if (isObjectiveContext(raw)) return raw.includes('goal') || raw.includes('meta') ? 'Goal' : 'Objective'
  if (raw.includes('capability')) return 'Capability'
  if (raw.includes('value chain') || raw.includes('value stream')) return 'Value Chain'
  if (raw.includes('business process') || raw.includes('process')) return 'Business Process'
  if (raw.includes('actor')) return 'Actor'
  if (raw.includes('role')) return 'Role'
  if (raw.includes('gap') || raw.includes('problem') || raw.includes('issue')) return 'Gap'
  if (raw.includes('risk')) return 'Risk'
  if (raw.includes('recommendation')) return 'Recommendation'
  if (raw.includes('solution')) return 'Solution Option'
  if (raw.includes('application') || raw.includes('system')) return 'Application Component'
  if (raw.includes('data store') || raw.includes('database')) return 'Data Store'
  if (raw.includes('data')) return 'Data Entity'
  if (raw.includes('technology')) return 'Technology Component'

  return 'Note'
}

const normalizeProperties = (value: unknown) => {
  if (!isRecord(value)) return undefined

  return Object.entries(value).reduce<Record<string, string | number | boolean>>((acc, [key, item]) => {
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      acc[key] = item
    }
    return acc
  }, {})
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

const toNumberValue = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const toPlan = (value: unknown): FoundryLayoutPlan | undefined =>
  isRecord(value) ? value as FoundryLayoutPlan : undefined

const getHint = (node: FoundryNode, key: keyof Pick<FoundryNode, 'order' | 'laneId' | 'groupId' | 'row' | 'column' | 'parentId'>) =>
  toStringValue(node[key])

const getNumericHint = (node: FoundryNode, key: keyof Pick<FoundryNode, 'order' | 'row' | 'column'>) =>
  toNumberValue(node[key])

const nodeLayoutKey = (node: DiagramNode, rawNode: FoundryNode) =>
  [
    getHint(rawNode, 'groupId'),
    node.layer,
    node.category,
    node.type,
    node.title
  ].filter(Boolean).join(' ').toLowerCase()

const sortByLayoutHints = (entries: Array<{ node: DiagramNode; rawNode: FoundryNode; index: number }>) =>
  [...entries].sort((a, b) => {
    const orderA = getNumericHint(a.rawNode, 'order')
    const orderB = getNumericHint(b.rawNode, 'order')
    if (orderA !== undefined || orderB !== undefined) return (orderA ?? a.index) - (orderB ?? b.index)

    const rowA = getNumericHint(a.rawNode, 'row')
    const rowB = getNumericHint(b.rawNode, 'row')
    if (rowA !== undefined || rowB !== undefined) return (rowA ?? 0) - (rowB ?? 0)

    const columnA = getNumericHint(a.rawNode, 'column')
    const columnB = getNumericHint(b.rawNode, 'column')
    if (columnA !== undefined || columnB !== undefined) return (columnA ?? 0) - (columnB ?? 0)

    return a.index - b.index
  })

const applyNonOverlappingPosition = (
  node: DiagramNode,
  occupied: Set<string>,
  x: number,
  y: number,
  cellWidth = 240,
  cellHeight = 170
) => {
  let nextY = y
  let cellKey = `${Math.round(x / cellWidth)}:${Math.round(nextY / cellHeight)}`

  while (occupied.has(cellKey)) {
    nextY += cellHeight
    cellKey = `${Math.round(x / cellWidth)}:${Math.round(nextY / cellHeight)}`
  }

  occupied.add(cellKey)
  node.position = { x, y: nextY }
}

const applyGridLayout = (
  entries: Array<{ node: DiagramNode; rawNode: FoundryNode; index: number }>,
  columns = 3,
  startX = 140,
  startY = 130,
  cellWidth = 260,
  cellHeight = 170
) => {
  const occupied = new Set<string>()
  sortByLayoutHints(entries).forEach((entry, index) => {
    const explicitColumn = getNumericHint(entry.rawNode, 'column')
    const explicitRow = getNumericHint(entry.rawNode, 'row')
    const column = explicitColumn ?? index % columns
    const row = explicitRow ?? Math.floor(index / columns)
    applyNonOverlappingPosition(entry.node, occupied, startX + column * cellWidth, startY + row * cellHeight, cellWidth, cellHeight)
  })
}

const applyColumnLayout = (
  entries: Array<{ node: DiagramNode; rawNode: FoundryNode; index: number }>,
  columns: string[],
  startX = 120,
  startY = 130
) => {
  const occupied = new Set<string>()
  const normalizedColumns = columns.map(column => column.toLowerCase())
  const buckets = new Map<string, Array<{ node: DiagramNode; rawNode: FoundryNode; index: number }>>()

  entries.forEach(entry => {
    const key = nodeLayoutKey(entry.node, entry.rawNode)
    const column = columns.find((_, index) => key.includes(normalizedColumns[index])) ?? columns[columns.length - 1]
    buckets.set(column, [...(buckets.get(column) ?? []), entry])
  })

  columns.forEach((column, columnIndex) => {
    sortByLayoutHints(buckets.get(column) ?? []).forEach((entry, rowIndex) => {
      const row = getNumericHint(entry.rawNode, 'row') ?? rowIndex
      applyNonOverlappingPosition(entry.node, occupied, startX + columnIndex * 280, startY + row * 170)
    })
  })
}

const laneNameFor = (entry: { node: DiagramNode; rawNode: FoundryNode }) =>
  getHint(entry.rawNode, 'laneId') ||
  toStringValue(entry.node.properties?.laneId) ||
  toStringValue(entry.node.properties?.actor) ||
  entry.node.category ||
  entry.node.layer ||
  'Process'

const applyBpmnLayout = (entries: Array<{ node: DiagramNode; rawNode: FoundryNode; index: number }>) => {
  const laneEntries = entries.filter(entry => entry.node.type === 'bpmn_lane' || entry.node.type === 'bpmn_pool')
  const flowEntries = sortByLayoutHints(entries.filter(entry => entry.node.type !== 'bpmn_lane' && entry.node.type !== 'bpmn_pool'))
  const laneNames = laneEntries.length > 0
    ? laneEntries.map(entry => entry.node.title)
    : Array.from(new Set(flowEntries.map(laneNameFor)))
  const laneY = (index: number) => 70 + index * 155
  const laneByName = new Map(laneNames.map((name, index) => [name, laneY(index)]))
  const occupied = new Set<string>()
  const canvasWidth = Math.max(1000, 360 + flowEntries.length * 230)

  laneEntries.forEach((entry, index) => {
    entry.node.position = { x: 60, y: laneY(index) - 38 }
    entry.node.width = Math.max(entry.node.width ?? 0, canvasWidth)
    entry.node.height = Math.max(entry.node.height ?? 0, 140)
  })

  flowEntries.forEach((entry, index) => {
    const lane = laneByName.get(laneNameFor(entry)) ?? laneY(index % Math.max(laneNames.length, 1))
    applyNonOverlappingPosition(entry.node, occupied, 150 + index * 230, lane, 230, 155)
  })
}

const applyLayoutPlan = (nodes: DiagramNode[], rawNodes: FoundryNode[], layoutPlan?: FoundryLayoutPlan) => {
  const viewType = slug(toStringValue(layoutPlan?.viewType))
  if (!viewType || nodes.length === 0) return nodes

  const entries = nodes.map((node, index) => ({ node, rawNode: rawNodes[index] ?? {}, index }))

  switch (viewType) {
    case 'objectives_board':
      applyGridLayout(entries, 3)
      break
    case 'bpmn_process':
      applyBpmnLayout(entries)
      break
    case 'layered_architecture':
      applyColumnLayout(entries, ['motivation', 'business', 'process', 'application', 'data', 'technology', 'risk', 'recommendation'])
      break
    case 'value_chain':
      applyGridLayout(entries, Math.max(entries.length, 1), 120, 160, 250, 160)
      break
    case 'capability_map':
      applyColumnLayout(entries, ['business', 'core', 'support', 'management', 'capability'])
      break
    case 'analysis_board':
      applyColumnLayout(entries, ['gap', 'risk', 'recommendation', 'solution', 'decision', 'action'])
      break
    default:
      applyGridLayout(entries, 3)
      break
  }

  return nodes
}

const parseDiagramElements = (
  rawNodes: FoundryNode[],
  rawConnectors: FoundryConnector[],
  idPrefix: string,
  layoutPlan?: FoundryLayoutPlan
) => {
  const idMap = new Map<string, string>()
  const nodes: DiagramNode[] = rawNodes.map((node, index) => {
    const oldId = toStringValue(node.id, `node-${index + 1}`)
    const name = toStringValue(node.name, toStringValue(node.title, `Foundry Node ${index + 1}`))
    const type = toStringValue(node.type, 'Note')
    const layer = toStringValue(node.layer)
    const description = toStringValue(node.description)
    const newId = `${idPrefix}-node-${index + 1}`
    const evidence = Array.isArray(node.evidence)
      ? node.evidence.filter(item => typeof item === 'string')
      : typeof node.evidence === 'string'
        ? [node.evidence]
        : undefined
    const properties = normalizeProperties(node.properties)

    idMap.set(oldId, newId)

    return {
      id: newId,
      type: normalizeNodeType(type, layer, name, description),
      name,
      title: name,
      description,
      layer: layer || undefined,
      bpmnType: toStringValue(node.bpmnType) || undefined,
      category: toStringValue(node.category) || undefined,
      properties: properties && Object.keys(properties).length > 0 ? properties : undefined,
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

  return { nodes: applyLayoutPlan(nodes, rawNodes, layoutPlan), connectors, idMap }
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
    layoutPlan: toPlan(parsed.layoutPlan),
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

  const rootElements = parseDiagramElements(response.nodes, response.connectors, idPrefix, response.layoutPlan)
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
    const elements = parseDiagramElements(rawNodes, rawConnectors, `${idPrefix}-diagram-${index + 1}`, toPlan(diagram.layoutPlan) ?? response.layoutPlan)
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
