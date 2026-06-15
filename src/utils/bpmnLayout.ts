import type { DiagramConnector, DiagramNode } from '../types'

export interface BpmnLayoutView {
  nodes: DiagramNode[]
  connectors: DiagramConnector[]
}

export interface BpmnLayoutOptions {
  laneX: number
  laneStartY: number
  laneHeaderWidth: number
  laneHeight: number
  laneGap: number
  lanePaddingX: number
  nodeGapX: number
  gatewayGapX: number
  taskWidth: number
  taskHeight: number
  eventSize: number
  gatewaySize: number
}

const DEFAULT_BPMN_LAYOUT: BpmnLayoutOptions = {
  laneX: 60,
  laneStartY: 70,
  laneHeaderWidth: 170,
  laneHeight: 170,
  laneGap: 24,
  lanePaddingX: 80,
  nodeGapX: 260,
  gatewayGapX: 300,
  taskWidth: 170,
  taskHeight: 76,
  eventSize: 46,
  gatewaySize: 72
}

const isLane = (node: DiagramNode) => node.type === 'bpmn_lane' || node.type === 'bpmn_pool'

const isBpmnNode = (node: DiagramNode) => node.type.startsWith('bpmn_')

const isEvent = (node: DiagramNode) => node.type.includes('_event')

const isGateway = (node: DiagramNode) => node.type.includes('gateway')

const isSubprocess = (node: DiagramNode) => node.type.includes('subprocess')

const toStringHint = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined

const toNumberHint = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const slug = (value: string) =>
  value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')

const normalizeLaneId = (value: string) => slug(value)

const laneTitleFromId = (laneId: string) =>
  laneId
    .replace(/^lane[_-]?/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase()) || 'Process'

const getLaneHint = (node: DiagramNode) =>
  toStringHint(node.properties?.laneId) ||
  toStringHint(node.properties?.lane) ||
  toStringHint(node.properties?.actor) ||
  toStringHint(node.properties?.groupId) ||
  undefined

const getOrderHint = (node: DiagramNode) =>
  toNumberHint(node.properties?.order) ??
  toNumberHint(node.properties?.column)

const getBpmnSize = (node: DiagramNode, options: BpmnLayoutOptions) => {
  if (isEvent(node)) {
    return { width: options.eventSize, height: options.eventSize }
  }

  if (isGateway(node)) {
    return { width: options.gatewaySize, height: options.gatewaySize }
  }

  if (isSubprocess(node)) {
    return { width: options.taskWidth + 20, height: options.taskHeight + 6 }
  }

  return { width: options.taskWidth, height: options.taskHeight }
}

const inferLaneFromPosition = (node: DiagramNode, lanes: DiagramNode[]) => {
  const centerY = node.position.y + (node.height ?? 0) / 2
  const containingLane = lanes.find(lane => {
    const top = lane.position.y
    const bottom = lane.position.y + (lane.height ?? 0)
    return centerY >= top && centerY <= bottom
  })

  if (containingLane) return containingLane.id

  return lanes
    .map(lane => ({
      lane,
      distance: Math.abs(centerY - (lane.position.y + (lane.height ?? 0) / 2))
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.lane.id
}

const buildSequenceOrder = (nodes: DiagramNode[], connectors: DiagramConnector[]) => {
  const nodeIds = new Set(nodes.map(node => node.id))
  const originalIndex = new Map(nodes.map((node, index) => [node.id, index]))
  const sequenceConnectors = connectors.filter(connector =>
    (connector.type === 'sequence_flow' || connector.type === 'flow') &&
    nodeIds.has(connector.sourceId) &&
    nodeIds.has(connector.targetId)
  )

  if (sequenceConnectors.length === 0) return nodes

  const outgoing = new Map<string, string[]>()
  const indegree = new Map(nodes.map(node => [node.id, 0]))

  sequenceConnectors.forEach(connector => {
    outgoing.set(connector.sourceId, [...(outgoing.get(connector.sourceId) ?? []), connector.targetId])
    indegree.set(connector.targetId, (indegree.get(connector.targetId) ?? 0) + 1)
  })

  const starts = nodes
    .filter(node => (indegree.get(node.id) ?? 0) === 0)
    .sort((a, b) => {
      if (a.type === 'bpmn_start_event' && b.type !== 'bpmn_start_event') return -1
      if (b.type === 'bpmn_start_event' && a.type !== 'bpmn_start_event') return 1
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0)
    })

  const orderedIds: string[] = []
  const visited = new Set<string>()
  const queue = starts.length > 0 ? starts.map(node => node.id) : [nodes[0].id]

  while (queue.length > 0) {
    const id = queue.shift()
    if (!id || visited.has(id)) continue

    visited.add(id)
    orderedIds.push(id)

    const targets = (outgoing.get(id) ?? [])
      .filter(targetId => !visited.has(targetId))
      .sort((a, b) => (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0))

    queue.push(...targets)
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) orderedIds.push(node.id)
  })

  const byId = new Map(nodes.map(node => [node.id, node]))
  return orderedIds.flatMap(id => byId.get(id) ?? [])
}

const orderBpmnNodes = (nodes: DiagramNode[], connectors: DiagramConnector[]) => {
  const withExplicitOrder = nodes.filter(node => getOrderHint(node) !== undefined)
  if (withExplicitOrder.length > 0) {
    return [...nodes].sort((a, b) => {
      const orderA = getOrderHint(a)
      const orderB = getOrderHint(b)
      if (orderA !== undefined || orderB !== undefined) return (orderA ?? Number.MAX_SAFE_INTEGER) - (orderB ?? Number.MAX_SAFE_INTEGER)
      return nodes.indexOf(a) - nodes.indexOf(b)
    })
  }

  return buildSequenceOrder(nodes, connectors)
}

export const layoutBpmnView = <T extends BpmnLayoutView>(
  bpmnView: T,
  options: Partial<BpmnLayoutOptions> = {}
): T => {
  const config = { ...DEFAULT_BPMN_LAYOUT, ...options }
  const sourceNodes = bpmnView.nodes
  const laneNodes = sourceNodes.filter(isLane)
  const flowNodes = sourceNodes.filter(node => !isLane(node) && isBpmnNode(node))

  if (flowNodes.length === 0 && laneNodes.length === 0) return bpmnView

  const laneByNormalizedId = new Map<string, DiagramNode>()
  const lanes = laneNodes.map(lane => ({ ...lane, position: { ...lane.position } }))

  lanes.forEach(lane => {
    laneByNormalizedId.set(normalizeLaneId(lane.id), lane)
    laneByNormalizedId.set(normalizeLaneId(lane.title), lane)
    if (lane.name) laneByNormalizedId.set(normalizeLaneId(lane.name), lane)
  })

  const laneIdByNodeId = new Map<string, string>()
  flowNodes.forEach(node => {
    const hint = getLaneHint(node)
    const hintedLane = hint ? laneByNormalizedId.get(normalizeLaneId(hint)) : undefined
    const inferredLaneId = hintedLane?.id ?? inferLaneFromPosition(node, laneNodes)

    if (inferredLaneId) {
      laneIdByNodeId.set(node.id, inferredLaneId)
      return
    }

    const fallbackLaneId = hint ? `bpmn-lane-${normalizeLaneId(hint)}` : 'bpmn-lane-process'
    laneIdByNodeId.set(node.id, fallbackLaneId)

    if (!lanes.some(lane => lane.id === fallbackLaneId)) {
      const laneTitle = hint ? laneTitleFromId(hint) : 'Process'
      const lane: DiagramNode = {
        id: fallbackLaneId,
        type: 'bpmn_lane',
        name: laneTitle,
        title: laneTitle,
        description: `${laneTitle} lane`,
        layer: 'BPMN / Process Engineering',
        category: 'Swimlanes',
        bpmnType: 'Lane',
        position: { x: config.laneX, y: config.laneStartY },
        width: 1200,
        height: config.laneHeight,
        properties: { generatedLane: true }
      }
      lanes.push(lane)
      laneByNormalizedId.set(normalizeLaneId(lane.id), lane)
      laneByNormalizedId.set(normalizeLaneId(lane.title), lane)
    }
  })

  const orderedLanes = [...lanes].sort((a, b) => {
    const orderA = toNumberHint(a.properties?.laneIndex)
    const orderB = toNumberHint(b.properties?.laneIndex)
    if (orderA !== undefined || orderB !== undefined) return (orderA ?? 0) - (orderB ?? 0)
    return sourceNodes.findIndex(node => node.id === a.id) - sourceNodes.findIndex(node => node.id === b.id)
  })

  const lanePositionById = new Map<string, { x: number; y: number; width: number; height: number }>()
  orderedLanes.forEach((lane, index) => {
    lanePositionById.set(lane.id, {
      x: config.laneX,
      y: config.laneStartY + index * (config.laneHeight + config.laneGap),
      width: Math.max(lane.width ?? 0, 1200),
      height: Math.max(lane.height ?? 0, config.laneHeight)
    })
  })

  const orderedFlowNodes = orderBpmnNodes(flowNodes, bpmnView.connectors)
  const laidOutFlowNodes = new Map<string, DiagramNode>()
  const startX = Math.max(config.laneX + config.laneHeaderWidth + config.lanePaddingX, config.laneX + 220)
  let cursorX = startX

  orderedFlowNodes.forEach((node, index) => {
    const size = getBpmnSize(node, config)
    const laneId = laneIdByNodeId.get(node.id) ?? orderedLanes[0]?.id
    const laneBounds = laneId ? lanePositionById.get(laneId) : undefined
    const y = laneBounds
      ? laneBounds.y + (laneBounds.height - size.height) / 2
      : config.laneStartY + (config.laneHeight - size.height) / 2

    laidOutFlowNodes.set(node.id, {
      ...node,
      position: { x: cursorX, y },
      width: size.width,
      height: size.height,
      properties: {
        ...(node.properties ?? {}),
        ...(laneId ? { laneId } : {}),
        order: getOrderHint(node) ?? index
      }
    })

    const nextNode = orderedFlowNodes[index + 1]
    const gap = isGateway(node) || (nextNode ? isGateway(nextNode) : false)
      ? config.gatewayGapX
      : config.nodeGapX
    cursorX += gap
  })

  const maxRight = Math.max(
    startX + config.nodeGapX,
    ...Array.from(laidOutFlowNodes.values()).map(node => node.position.x + (node.width ?? config.taskWidth))
  )
  const laneWidth = maxRight - config.laneX + config.lanePaddingX
  const laidOutLanes = new Map<string, DiagramNode>()

  orderedLanes.forEach(lane => {
    const bounds = lanePositionById.get(lane.id)
    if (!bounds) return

    laidOutLanes.set(lane.id, {
      ...lane,
      position: { x: bounds.x, y: bounds.y },
      width: Math.max(bounds.width, laneWidth),
      height: Math.max(bounds.height, config.laneHeight),
      description: lane.description,
      properties: {
        ...(lane.properties ?? {}),
        laneIndex: orderedLanes.findIndex(item => item.id === lane.id)
      }
    })
  })

  const existingNodeIds = new Set(sourceNodes.map(node => node.id))
  const orderedNewLanes = orderedLanes.filter(lane => !existingNodeIds.has(lane.id))
  const nextNodes = [
    ...orderedNewLanes.map(lane => laidOutLanes.get(lane.id) ?? lane),
    ...sourceNodes.map(node => laidOutLanes.get(node.id) ?? laidOutFlowNodes.get(node.id) ?? node)
  ]

  return {
    ...bpmnView,
    nodes: nextNodes
  }
}
